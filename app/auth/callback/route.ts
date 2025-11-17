import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  const baseUrl = 'https://www.trackdoc.app.br'
  
  console.log('🔧 [Callback] URL recebida:', request.url)
  console.log('🔧 [Callback] Parâmetros:', { code: !!code, type, error, baseUrl })
  console.log('🔧 [Callback] Headers:', Object.fromEntries(request.headers.entries()))

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
      
      // Método 1: exchangeCodeForSession
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.session) {
        console.log('✅ [Callback] Código processado com sucesso, usuário:', data.user?.email)
        
        // Sucesso - ativar usuário diretamente no servidor
        try {
          // Verificar se é usuário de entidade
          const isEntityUser = type === 'entity_user' || data.user.user_metadata?.registration_type === 'entity_user'
          
          console.log('🔧 [Callback] Tipo de usuário:', { isEntityUser, type, metadata: data.user.user_metadata })
          
          // Ativar usuário de entidade
          if (isEntityUser) {
            const apiUrl = process.env.NODE_ENV === 'production' 
              ? `${baseUrl}/api/activate-entity-user`
              : `http://localhost:3000/api/activate-entity-user`
              
            console.log('🔧 [Callback] Ativando usuário de entidade:', apiUrl)
            
            const activateResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: data.user.id })
            })
            
            if (activateResponse.ok) {
              const result = await activateResponse.json()
              console.log('✅ [Callback] Usuário de entidade ativado:', result)
              
              // Fazer logout para forçar novo login
              await supabase.auth.signOut()
              
              return NextResponse.redirect(`${baseUrl}/login?confirmed=true&message=${encodeURIComponent('Email confirmado com sucesso! Você já pode fazer login.')}`)
            } else {
              console.log('⚠️ [Callback] Falha na ativação, redirecionando para confirmação')
              return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&activated=false`)
            }
          }
          
          // Usuário individual - usar API antiga
          const apiUrl = process.env.NODE_ENV === 'production' 
            ? `${baseUrl}/api/activate-user`
            : `http://localhost:3000/api/activate-user`
            
          const activateResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: data.user.id })
          })
          
          if (activateResponse.ok) {
            return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&activated=true`)
          }
          
        } catch (activateError) {
          console.error('❌ [Callback] Erro ao ativar usuário:', activateError)
        }
        
        // Fallback - redirecionar para confirmação
        console.log('✅ [Callback] Redirecionando para página de confirmação')
        return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&activated=false`)
        
      } else {
        console.error('❌ [Callback] Erro ao processar código:', error?.message || 'Erro desconhecido')
        
        // MÉTODO ALTERNATIVO: Se é erro PKCE, tentar verificar se usuário foi confirmado pelo Supabase
        if (error?.message?.includes('both auth code and code verifier')) {
          console.log('🔧 [Callback] Erro PKCE detectado - usando método alternativo...')
          
          try {
            // Aguardar um pouco para o Supabase processar internamente
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Verificar se há sessão criada (Supabase pode ter processado internamente)
            const { data: sessionData } = await supabase.auth.getSession()
            
            if (sessionData.session?.user) {
              console.log('✅ [Callback] Sessão encontrada após aguardar - confirmação bem-sucedida!')
              
              // Tentar ativar usuário
              try {
                const apiUrl = process.env.NODE_ENV === 'production' 
                  ? `${baseUrl}/api/activate-user`
                  : 'http://localhost:3000/api/activate-user'
                  
                const activateResponse = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: sessionData.session.user.id })
                })
                
                if (activateResponse.ok) {
                  console.log('✅ [Callback] Usuário ativado após método alternativo!')
                  return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&activated=true&method=alternative`)
                }
              } catch (activateError) {
                console.error('❌ [Callback] Erro na ativação alternativa:', activateError)
              }
              
              // Mesmo sem ativação, redirecionar como confirmado
              return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&method=alternative`)
            }
            
            // Se não há sessão, tentar ativação em lote
            console.log('🔧 [Callback] Tentando ativação em lote...')
            
            const apiUrl = process.env.NODE_ENV === 'production' 
              ? `${baseUrl}/api/activate-confirmed-users`
              : 'http://localhost:3000/api/activate-confirmed-users'
              
            const activateResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trigger: 'callback_fallback' })
            })
            
            if (activateResponse.ok) {
              const result = await activateResponse.json()
              console.log('✅ [Callback] Ativação em lote executada:', result)
              return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&bulk_activated=true`)
            }
            
          } catch (altError) {
            console.error('❌ [Callback] Método alternativo falhou:', altError)
          }
        }
        
        // Último recurso - redirecionar com erro mas permitir verificação no cliente
        console.log('❌ [Callback] Redirecionando com erro para verificação no cliente')
        return NextResponse.redirect(`${baseUrl}/confirm-email?error=processing_failed&try_login=true&allow_verify=true&details=${encodeURIComponent(error?.message || 'Código inválido')}`)
      }
    } catch (sessionError) {
      console.error('❌ [Callback] Erro geral na sessão:', sessionError)
      return NextResponse.redirect(`${baseUrl}/confirm-email?error=session_error&details=${encodeURIComponent(sessionError.message)}`)
    }
  }

  // Fallback - redirecionar para confirmação com erro
  return NextResponse.redirect(`${baseUrl}/confirm-email?error=no_code`)
}
