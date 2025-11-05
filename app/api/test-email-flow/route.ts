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
    const { action, email, password, full_name } = body
    
    console.log('🧪 [test-email-flow] Ação:', action, 'Email:', email)

    if (action === 'create_test_user') {
      // Criar usuário de teste
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: false, // Não confirmar automaticamente para testar o fluxo
        user_metadata: {
          full_name: full_name,
          registration_type: 'individual'
        }
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário de teste criado',
        user_id: data.user.id,
        email_confirmed: !!data.user.email_confirmed_at
      })
    }

    if (action === 'confirm_test_user') {
      // Confirmar email manualmente para teste
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find((u: any) => u.email === email)

      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      // Confirmar email manualmente
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Tentar ativar o usuário
      const activateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/activate-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })

      const activateResult = await activateResponse.json()

      return NextResponse.json({
        success: true,
        message: 'Email confirmado e usuário ativado',
        user_id: user.id,
        email_confirmed: true,
        activation_result: activateResult
      })
    }

    if (action === 'check_user_status') {
      // Verificar status do usuário
      const { data: users } = await supabase.auth.admin.listUsers()
      const authUser = users?.users?.find((u: any) => u.email === email)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      return NextResponse.json({
        auth_user: authUser ? {
          id: authUser.id,
          email: authUser.email,
          email_confirmed_at: authUser.email_confirmed_at,
          created_at: authUser.created_at
        } : null,
        profile: profile || null,
        status_summary: {
          auth_exists: !!authUser,
          email_confirmed: !!authUser?.email_confirmed_at,
          profile_exists: !!profile,
          profile_status: profile?.status || 'not_found'
        }
      })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error('❌ [test-email-flow] Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}