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
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('✅ [complete-password-change] Marcando alteração completa para:', userId)
    
    // Atualizar perfil para remover flag de alteração obrigatória
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        force_password_change: false,
        first_login_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('❌ [complete-password-change] Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil do usuário' },
        { status: 500 }
      )
    }
    
    console.log('✅ [complete-password-change] Perfil atualizado com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Alteração de senha marcada como completa'
    })
    
  } catch (error) {
    console.error('❌ [complete-password-change] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}