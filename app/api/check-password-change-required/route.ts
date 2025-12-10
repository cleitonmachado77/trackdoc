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
    
    console.log('🔍 [check-password-change] Verificando usuário:', userId)
    
    // Buscar informações do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('force_password_change, first_login_completed, status, full_name, email')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('❌ [check-password-change] Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('👤 [check-password-change] Perfil encontrado:', {
      force_password_change: profile.force_password_change,
      first_login_completed: profile.first_login_completed,
      status: profile.status
    })
    
    // Determinar se precisa alterar senha
    const needsPasswordChange = profile.force_password_change === true || 
                               profile.first_login_completed === false
    
    return NextResponse.json({
      needsPasswordChange,
      user: {
        id: userId,
        full_name: profile.full_name,
        email: profile.email,
        status: profile.status
      }
    })
    
  } catch (error) {
    console.error('❌ [check-password-change] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}