import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  
  const baseUrl = 'https://www.trackdoc.app.br'
  
  console.log('🔧 [Callback] URL recebida:', request.url)
  console.log('🔧 [Callback] Parâmetros:', { code: !!code, type, error, baseUrl })

  // Se há erro nos parâmetros da URL
  if (error) {
    return NextResponse.redirect(`${baseUrl}/confirm-email?error=callback_error`)
  }

  // Se é recovery (reset de senha)
  if (type === 'recovery') {
    return NextResponse.redirect(`${baseUrl}/reset-password`)
  }

  // Se há código de confirmação
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
              // Ignorar erro de cookies em Server Component
            }
          },
        },
      }
    )

    try {
      console.log('🔧 [Callback] Tentando processar código...')
      
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!sessionError && data.session) {
        console.log('✅ [Callback] Código processado com sucesso, usuário:', data.user?.email)
        
        // Ativar usuário
        try {
          const isEntityUser = type === 'entity_user' || data.user.user_metadata?.registration_type === 'entity_user'
          const apiEndpoint = isEntityUser ? 'activate-entity-user' : 'activate-user'
          
          const apiUrl = process.env.NODE_ENV === 'production' 
            ? `${baseUrl}/api/${apiEndpoint}`
            : `http://localhost:3000/api/${apiEndpoint}`
            
          console.log('🔧 [Callback] Ativando usuário:', apiUrl)
          
          const activateResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: data.user.id })
          })
          
          const activateResult = await activateResponse.json()
          console.log('🔧 [Callback] Resultado da ativação:', activateResult)
          
          // Fazer logout para forçar novo login
          await supabase.auth.signOut()
          
          return NextResponse.redirect(`${baseUrl}/login?confirmed=true&message=${encodeURIComponent('Email confirmado com sucesso! Você já pode fazer login.')}`)
          
        } catch (activateError) {
          console.error('❌ [Callback] Erro ao ativar usuário:', activateError)
          await supabase.auth.signOut()
          return NextResponse.redirect(`${baseUrl}/login?confirmed=true&message=${encodeURIComponent('Email confirmado! Faça login para continuar.')}`)
        }
        
      } else {
        console.error('❌ [Callback] Erro ao processar código:', sessionError?.message || 'Erro desconhecido')
        
        // Tentar método alternativo para erro PKCE
        if (sessionError?.message?.includes('both auth code and code verifier')) {
          console.log('🔧 [Callback] Erro PKCE detectado - tentando método alternativo...')
          
          await new Promise(resolve => setTimeout(resolve, 1000))
          const { data: sessionData } = await supabase.auth.getSession()
          
          if (sessionData.session?.user) {
            try {
              const apiUrl = process.env.NODE_ENV === 'production' 
                ? `${baseUrl}/api/activate-user`
                : 'http://localhost:3000/api/activate-user'
                
              await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: sessionData.session.user.id })
              })
            } catch (e) {
              console.error('❌ [Callback] Erro na ativação alternativa:', e)
            }
            
            return NextResponse.redirect(`${baseUrl}/login?confirmed=true&message=${encodeURIComponent('Email confirmado! Faça login para continuar.')}`)
          }
        }
        
        return NextResponse.redirect(`${baseUrl}/confirm-email?error=processing_failed&try_login=true`)
      }
    } catch (err: any) {
      console.error('❌ [Callback] Erro geral:', err)
      return NextResponse.redirect(`${baseUrl}/confirm-email?error=session_error`)
    }
  }

  // Fallback
  console.log('⚠️ [Callback] Sem code, redirecionando para confirmação')
  return NextResponse.redirect(`${baseUrl}/confirm-email?type=${type || 'unknown'}`)
}
