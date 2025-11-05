import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

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

    console.log('🔍 [debug-user-status] Verificando status para:', email)

    // Buscar usuário no auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(user => user.email?.toLowerCase() === email.toLowerCase())

    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    const result = {
      email: email,
      auth_user: authUser ? {
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        confirmed_at: authUser.confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        user_metadata: authUser.user_metadata,
        app_metadata: authUser.app_metadata
      } : null,
      profile: profile || null,
      auth_error: authError?.message || null,
      profile_error: profileError?.message || null,
      status_summary: {
        auth_exists: !!authUser,
        email_confirmed: !!(authUser?.email_confirmed_at || authUser?.confirmed_at),
        profile_exists: !!profile,
        profile_status: profile?.status || 'not_found',
        registration_completed: profile?.registration_completed || false
      }
    }

    console.log('📊 [debug-user-status] Resultado:', result)

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ [debug-user-status] Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}