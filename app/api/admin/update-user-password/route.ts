import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, new_password } = body

    if (!user_id || !new_password) {
      return NextResponse.json(
        { error: 'user_id e new_password são obrigatórios' },
        { status: 400 }
      )
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    console.log('🔐 [update-user-password] Atualizando senha do usuário:', user_id)

    // Atualizar senha usando service role
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (updateError) {
      console.error('❌ [update-user-password] Erro ao atualizar senha:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ [update-user-password] Senha atualizada com sucesso')

    // Atualizar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        force_password_change: false,
        first_login_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)

    if (profileError) {
      console.warn('⚠️ [update-user-password] Erro ao atualizar perfil:', profileError)
    }

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    })

  } catch (error: any) {
    console.error('❌ [update-user-password] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
