import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { canCreateMoreUsers, incrementEntityUserCount } from '@/lib/entity-subscription-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await request.json()
    console.log('🔧 [create-entity-user] Dados recebidos:', body)
    
    const {
      full_name,
      email,
      password,
      entity_id,
      entity_role = 'user',
      phone,
      position,
      cpf,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      address_zipcode
    } = body
    
    // Validações básicas
    if (!full_name?.trim()) {
      return NextResponse.json(
        { error: 'Nome completo é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!password?.trim()) {
      return NextResponse.json(
        { error: 'Senha é obrigatória' },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }
    
    if (!entity_id) {
      return NextResponse.json(
        { error: 'ID da entidade é obrigatório' },
        { status: 400 }
      )
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }
    
    // Verificar se email já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some((user: any) => 
      user.email?.toLowerCase() === email.toLowerCase()
    )
    
    if (emailExists) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado no sistema' },
        { status: 400 }
      )
    }
    
    // Verificar se entidade existe
    const { data: entityData, error: entityError } = await supabase
      .from('entities')
      .select('id, name')
      .eq('id', entity_id)
      .single()
    
    if (entityError || !entityData) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 400 }
      )
    }
    
    // Verificar limites do plano do admin da entidade
    console.log('🔍 [create-entity-user] Verificando limites do plano...')
    const limitCheck = await canCreateMoreUsers(entity_id)
    
    if (limitCheck.error) {
      console.error('❌ [create-entity-user] Erro ao verificar limites:', limitCheck.error)
      return NextResponse.json(
        { error: 'Erro ao verificar limites do plano: ' + limitCheck.error },
        { status: 400 }
      )
    }
    
    if (!limitCheck.canCreate) {
      console.warn('⚠️ [create-entity-user] Limite de usuários atingido')
      return NextResponse.json(
        { 
          error: `Limite de usuários atingido. Plano atual permite ${limitCheck.maxUsers} usuários e já possui ${limitCheck.currentUsers} usuários ativos.`,
          details: {
            maxUsers: limitCheck.maxUsers,
            currentUsers: limitCheck.currentUsers,
            remainingUsers: limitCheck.remainingUsers
          }
        },
        { status: 400 }
      )
    }
    
    console.log('✅ [create-entity-user] Limites verificados:', {
      maxUsers: limitCheck.maxUsers,
      currentUsers: limitCheck.currentUsers,
      remainingUsers: limitCheck.remainingUsers
    })
    
    console.log('✅ [create-entity-user] Validações passaram, criando usuário...')
    
    // Criar usuário com Supabase Auth (com confirmação de email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: false, // Requer confirmação de email
      user_metadata: {
        full_name: full_name.trim(),
        entity_id: entity_id,
        entity_role: entity_role,
        phone: phone?.trim() || null,
        position: position?.trim() || null,
        cpf: cpf?.trim() || null,
        address_street: address_street?.trim() || null,
        address_number: address_number?.trim() || null,
        address_complement: address_complement?.trim() || null,
        address_neighborhood: address_neighborhood?.trim() || null,
        address_city: address_city?.trim() || null,
        address_state: address_state?.trim() || null,
        address_zipcode: address_zipcode?.trim() || null,
        registration_type: 'entity_user'
      }
    })
    
    if (authError) {
      console.error('❌ [create-entity-user] Erro ao criar usuário no Auth:', authError)
      
      if (authError.message.includes('already registered') || authError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado no sistema' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }
    
    const userId = authData.user.id
    console.log('✅ [create-entity-user] Usuário criado no Auth:', userId)
    
    // Criar perfil do usuário (status inactive até confirmar email)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        entity_id: entity_id,
        entity_role: entity_role,
        phone: phone?.trim() || null,
        position: position?.trim() || null,
        cpf: cpf?.trim() || null,
        address_street: address_street?.trim() || null,
        address_number: address_number?.trim() || null,
        address_complement: address_complement?.trim() || null,
        address_neighborhood: address_neighborhood?.trim() || null,
        address_city: address_city?.trim() || null,
        address_state: address_state?.trim() || null,
        address_zipcode: address_zipcode?.trim() || null,
        role: entity_role === 'admin' ? 'admin' : 'user',
        status: 'inactive', // Inativo até confirmar email
        force_password_change: true, // Força alteração de senha no primeiro login
        first_login_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('❌ [create-entity-user] Erro ao criar perfil:', profileError)
      
      // Tentar deletar usuário do Auth se falhar ao criar perfil
      await supabase.auth.admin.deleteUser(userId)
      
      return NextResponse.json(
        { error: 'Erro ao criar perfil do usuário' },
        { status: 500 }
      )
    }
    
    console.log('✅ [create-entity-user] Perfil criado com sucesso')
    
    // Enviar email de confirmação
    // Quando usamos admin.createUser com email_confirm: false, o Supabase NÃO envia email automaticamente
    // Precisamos usar generateLink e então enviar o email manualmente ou usar a função de reenvio
    try {
      // Opção 1: Usar inviteUserByEmail (recomendado para novos usuários)
      // Mas como já criamos o usuário, vamos deletá-lo e recriar com invite
      
      // Deletar o usuário que acabamos de criar
      await supabase.auth.admin.deleteUser(userId)
      
      // Deletar o perfil também
      await supabase.from('profiles').delete().eq('id', userId)
      
      console.log('🔄 [create-entity-user] Recriando usuário com inviteUserByEmail...')
      
      // Recriar usando inviteUserByEmail (isso envia o email automaticamente)
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email.toLowerCase().trim(),
        {
          data: {
            full_name: full_name.trim(),
            entity_id: entity_id,
            entity_role: entity_role,
            phone: phone?.trim() || null,
            position: position?.trim() || null,
            cpf: cpf?.trim() || null,
            address_street: address_street?.trim() || null,
            address_number: address_number?.trim() || null,
            address_complement: address_complement?.trim() || null,
            address_neighborhood: address_neighborhood?.trim() || null,
            address_city: address_city?.trim() || null,
            address_state: address_state?.trim() || null,
            address_zipcode: address_zipcode?.trim() || null,
            registration_type: 'entity_user'
          },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.app.br'}/auth/callback?type=entity_user&entity_id=${entity_id}`
        }
      )
      
      if (inviteError) {
        console.error('❌ [create-entity-user] Erro ao enviar convite:', inviteError)
        return NextResponse.json(
          { error: 'Erro ao enviar email de confirmação' },
          { status: 500 }
        )
      }
      
      const newUserId = inviteData.user.id
      console.log('✅ [create-entity-user] Convite enviado, novo userId:', newUserId)
      
      // Criar perfil com o novo userId
      const { error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          full_name: full_name.trim(),
          email: email.toLowerCase().trim(),
          entity_id: entity_id,
          entity_role: entity_role,
          phone: phone?.trim() || null,
          position: position?.trim() || null,
          cpf: cpf?.trim() || null,
          address_street: address_street?.trim() || null,
          address_number: address_number?.trim() || null,
          address_complement: address_complement?.trim() || null,
          address_neighborhood: address_neighborhood?.trim() || null,
          address_city: address_city?.trim() || null,
          address_state: address_state?.trim() || null,
          address_zipcode: address_zipcode?.trim() || null,
          role: entity_role === 'admin' ? 'admin' : 'user',
          status: 'pending_confirmation', // Aguardando confirmação de email
          force_password_change: true, // Força alteração de senha no primeiro login
          first_login_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (newProfileError) {
        console.error('❌ [create-entity-user] Erro ao criar novo perfil:', newProfileError)
        await supabase.auth.admin.deleteUser(newUserId)
        return NextResponse.json(
          { error: 'Erro ao criar perfil do usuário' },
          { status: 500 }
        )
      }
      
      console.log('✅ [create-entity-user] Email de confirmação enviado com sucesso')
      
      // Incrementar contador de usuários na subscription do admin da entidade
      console.log('📊 [create-entity-user] Atualizando contador de usuários...')
      const incrementResult = await incrementEntityUserCount(entity_id)
      
      if (!incrementResult.success) {
        console.warn('⚠️ [create-entity-user] Falha ao atualizar contador:', incrementResult.error)
        // Não falhar a criação do usuário por causa do contador
        // Apenas logar o erro para investigação posterior
      } else {
        console.log('✅ [create-entity-user] Contador de usuários atualizado com sucesso')
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: newUserId,
          full_name: full_name.trim(),
          email: email.toLowerCase().trim(),
          entity_role: entity_role,
          status: 'pending_confirmation',
          email_confirmed: false
        },
        message: `Usuário ${full_name} criado com sucesso! Um email de confirmação foi enviado para ${email}.`,
        planInfo: {
          maxUsers: limitCheck.maxUsers,
          currentUsers: limitCheck.currentUsers + 1, // +1 porque acabamos de criar
          remainingUsers: limitCheck.remainingUsers - 1
        }
      })
      
    } catch (emailErr) {
      console.error('❌ [create-entity-user] Erro ao processar convite:', emailErr)
      return NextResponse.json(
        { error: 'Erro ao enviar email de confirmação' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ [create-entity-user] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}