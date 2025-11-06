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
          const apiUrl = process.env.NODE_ENV === 'production' 
            ? `${baseUrl}/api/activate-user`
            : 'http://localhost:3000/api/activate-user'
            
          console.log('🔧 [Callback] Chamando API de ativação:', apiUrl)
          
          const activateResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: data.user.id })
          })
          
          console.log('🔧 [Callback] Resposta da API:', activateResponse.status)
          
          if (activateResponse.ok) {
            const result = await activateResponse.json()
            console.log('✅ [Callback] Usuário ativado:', result)
            return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&activated=true`)
          } else {
            const errorResult = await activateResponse.text()
            console.log('⚠️ [Callback] Falha na ativação:', errorResult)
          }
        } catch (activateError) {
          console.error('❌ [Callback] Erro ao ativar usuário:', activateError)
        }
        
        // Mesmo com erro na ativação, redirecionar para confirmação (sessão foi criada)
        console.log('✅ [Callback] Sessão criada, redirecionando sem ativação')
        return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true`)
        
      } else {
        console.error('❌ [Callback] Erro ao processar código:', error?.message || 'Erro desconhecido')
        
        // Tentar método alternativo - buscar usuário pelo código
        try {
          console.log('🔧 [Callback] Tentando método alternativo - buscar usuário...')
          
          // Verificar se há sessão atual (pode ter sido criada em tentativa anterior)
          const { data: sessionData } = await supabase.auth.getSession()
          
          if (sessionData.session?.user) {
            console.log('✅ [Callback] Sessão encontrada via método alternativo')
            return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true`)
          }
          
          // Se o código falhou, pode ser que o usuário já esteja confirmado
          // Vamos tentar ativar usuários confirmados mas não ativados
          console.log('🔧 [Callback] Tentando ativar usuários confirmados...')
          
          try {
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
              console.log('✅ [Callback] Usuários confirmados ativados:', result)
              return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&bulk_activated=true`)
            }
          } catch (bulkError) {
            console.error('❌ [Callback] Erro na ativação em lote:', bulkError)
          }
          
          // Último recurso - redirecionar com erro mas sugerir login
          console.log('❌ [Callback] Todos os métodos falharam')
          return NextResponse.redirect(`${baseUrl}/confirm-email?error=processing_failed&try_login=true&details=${encodeURIComponent(error?.message || 'Código inválido')}`)
          
        } catch (altError) {
          console.error('❌ [Callback] Método alternativo falhou:', altError)
          return NextResponse.redirect(`${baseUrl}/confirm-email?error=processing_failed&details=${encodeURIComponent(error?.message || 'Erro desconhecido')}`)
        }
      }
    } catch (sessionError) {
      console.error('❌ [Callback] Erro geral na sessão:', sessionError)
      return NextResponse.redirect(`${baseUrl}/confirm-email?error=session_error&details=${encodeURIComponent(sessionError.message)}`)
    }
  }

  // Fallback - redirecionar para confirmação com erro
  return NextResponse.redirect(`${baseUrl}/confirm-email?error=no_code`)
}
