import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, hash } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_code = searchParams.get('error_code')
  const error_description = searchParams.get('error_description')
  
  // Para implicit flow, os tokens podem vir no hash
  console.log('🔧 [auth/callback] Hash da URL:', hash)

  // Usar a URL correta baseada no ambiente
  const baseUrl = 'https://www.trackdoc.app.br'

  console.log('🔧 [auth/callback] Parâmetros recebidos:', { 
    code: !!code, 
    type, 
    next, 
    baseUrl,
    error,
    error_code,
    error_description
  })

  // Se há erro nos parâmetros da URL, tratar imediatamente
  if (error) {
    console.error('❌ [auth/callback] Erro recebido do Supabase:', { error, error_code, error_description })
    
    if (error === 'server_error' && error_description?.includes('Error confirming user')) {
      console.error('❌ [auth/callback] Erro específico: problema no trigger de confirmação de usuário')
      return NextResponse.redirect(`${baseUrl}/confirm-email?error=trigger_error&details=${encodeURIComponent(error_description || '')}`)
    }
    
    return NextResponse.redirect(`${baseUrl}/confirm-email?error=supabase_error&details=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    console.log('🔧 [auth/callback] Processando sessão da URL...')
    
    try {
      // Tentar obter sessão da URL completa
      const { data, error } = await supabase.auth.getSession()
      
      if (!error && data.session) {
        console.log('✅ [auth/callback] Sessão encontrada para:', data.session.user?.email)
        console.log('✅ [auth/callback] Email confirmado:', !!data.session.user?.email_confirmed_at)
        
        // Verificar o tipo de callback e redirecionar adequadamente
        if (type === 'recovery') {
          console.log('🔧 [auth/callback] Redirecionando para reset de senha')
          return NextResponse.redirect(`${baseUrl}/reset-password`)
        } else {
          console.log('🔧 [auth/callback] Redirecionando para confirmação de email')
          return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&user_id=${data.session.user?.id}`)
        }
      } else {
        console.log('⚠️ [auth/callback] Sessão não encontrada, tentando método alternativo...')
        
        // Método alternativo: redirecionar para página que processará no cliente
        console.log('🔧 [auth/callback] Redirecionando para processamento no cliente')
        
        if (type === 'recovery') {
          return NextResponse.redirect(`${baseUrl}/reset-password`)
        } else {
          // Redirecionar com o código para processamento no cliente
          return NextResponse.redirect(`${baseUrl}/confirm-email?code=${code}&type=signup`)
        }
      }
    } catch (sessionError) {
      console.error('❌ [auth/callback] Erro ao processar sessão:', sessionError)
    }
  } else {
    console.error('❌ [auth/callback] Código não encontrado nos parâmetros')
  }

  // Se houver erro, verificar o tipo para redirecionar adequadamente
  if (type === 'recovery') {
    console.log('🔧 [auth/callback] Erro - redirecionando para forgot-password')
    return NextResponse.redirect(`${baseUrl}/forgot-password?error=invalid_link`)
  } else {
    console.log('🔧 [auth/callback] Erro - redirecionando para confirm-email com erro')
    return NextResponse.redirect(`${baseUrl}/confirm-email?error=confirmation_failed`)
  }
}
