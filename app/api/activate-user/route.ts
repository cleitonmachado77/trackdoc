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
    const { user_id } = body
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('🔧 [activate-user] Ativando usuário:', user_id)
    
    // Verificar se o usuário existe e seu status atual
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, status, email, entity_id, registration_completed')
      .eq('id', user_id)
      .single()
    
    if (fetchError) {
      console.error('❌ [activate-user] Erro ao buscar perfil:', fetchError)
      
      // Se usuário não foi encontrado, tentar criar perfil básico
      if (fetchError.code === 'PGRST116') {
        console.log('🔧 [activate-user] Usuário não encontrado, tentando criar perfil...')
        
        try {
          // Buscar dados do usuário no auth.users via service role
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id)
          
          if (!authError && authUser.user) {
            // Criar perfil básico
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user_id,
                full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Usuário',
                email: authUser.user.email,
                role: 'user',
                status: 'active',
                permissions: JSON.stringify(["read", "write"]),
                registration_type: 'individual',
                registration_completed: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()
            
            if (!createError && newProfile) {
              console.log('✅ [activate-user] Perfil criado e ativado com sucesso!')
              return NextResponse.json({
                success: true,
                message: 'Perfil criado e usuário ativado com sucesso!',
                user: newProfile
              })
            } else {
              console.error('❌ [activate-user] Erro ao criar perfil:', createError)
            }
          }
        } catch (createProfileError) {
          console.error('❌ [activate-user] Erro ao tentar criar perfil:', createProfileError)
        }
      }
      
      return NextResponse.json(
        { error: 'Usuário não encontrado e não foi possível criar perfil' },
        { status: 404 }
      )
    }
    
    // Se já está ativo, retornar sucesso
    if (currentProfile.status === 'active') {
      console.log('✅ [activate-user] Usuário já está ativo')
      return NextResponse.json({
        success: true,
        message: 'Usuário já está ativo',
        user: currentProfile
      })
    }
    
    // Ativar usuário - preservando force_password_change e first_login_completed
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        registration_completed: true,
        permissions: JSON.stringify(["read", "write"]),
        // NÃO alterar force_password_change e first_login_completed aqui
        // Esses campos devem ser alterados apenas quando o usuário trocar a senha
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ [activate-user] Erro ao ativar usuário:', updateError)
      return NextResponse.json(
        { error: `Erro ao ativar usuário: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ [activate-user] Usuário ativado com sucesso!')
    
    // Se o usuário pertence a uma entidade, atualizar contador
    if (updatedProfile.entity_id) {
      try {
        // Contar usuários ativos da entidade
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('entity_id', updatedProfile.entity_id)
          .eq('status', 'active')
        
        // Atualizar contador na entidade
        await supabase
          .from('entities')
          .update({ 
            current_users: count || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedProfile.entity_id)
        
        // Marcar convite como aceito se existir
        await supabase
          .from('entity_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('email', updatedProfile.email)
          .eq('entity_id', updatedProfile.entity_id)
          .eq('status', 'pending')
        
        console.log('✅ [activate-user] Contador da entidade atualizado')
      } catch (entityError) {
        console.error('⚠️ [activate-user] Erro ao atualizar entidade:', entityError)
        // Não falhar a ativação por causa disso
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usuário ativado com sucesso!',
      user: updatedProfile
    })
    
  } catch (error) {
    console.error('❌ [activate-user] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}