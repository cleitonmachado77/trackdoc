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
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
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
    
    // Ativar usuário
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        registration_completed: true,
        permissions: JSON.stringify(["read", "write"]),
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