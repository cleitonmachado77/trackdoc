import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
      position
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
    const emailExists = existingUsers?.users?.some(user => 
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
    
    console.log('✅ [create-entity-user] Validações passaram, criando usuário...')
    
    // Usar função final que trabalha com triggers existentes
    const { data: userData, error: userError } = await supabase.rpc('create_user_entity_final', {
      p_email: email.toLowerCase().trim(),
      p_password: password,
      p_full_name: full_name.trim(),
      p_entity_id: entity_id,
      p_entity_role: entity_role,
      p_phone: phone?.trim() || null,
      p_position: position?.trim() || null
    })
    
    if (userError) {
      console.error('❌ [create-entity-user] Erro na função final:', userError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
    
    if (!userData?.success) {
      console.error('❌ [create-entity-user] Função retornou erro:', userData?.error)
      return NextResponse.json(
        { error: userData?.error || 'Erro desconhecido' },
        { status: 400 }
      )
    }
    
    const userId = userData.user_id
    console.log('✅ [create-entity-user] Usuário criado com função final:', userId)
    
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        entity_role: entity_role,
        status: 'active'
      },
      message: `Usuário ${full_name} criado com sucesso!`
    })
    
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