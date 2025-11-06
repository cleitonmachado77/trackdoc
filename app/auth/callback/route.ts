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
      // Processar código de confirmação usando exchangeCodeForSession
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.session) {
        // Sucesso - ativar usuário diretamente no servidor
        try {
          // Usar URL absoluta para a API
          const apiUrl = process.env.NODE_ENV === 'production' 
            ? `${baseUrl}/api/activate-user`
            : 'http://localhost:3000/api/activate-user'
            
          const activateResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: data.user.id })
          })
          
          if (activateResponse.ok) {
            // Sucesso total - redirecionar para confirmação
            return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true&activated=true`)
          }
        } catch (activateError) {
          console.error('Erro ao ativar usuário no callback:', activateError)
        }
        
        // Mesmo com erro na ativação, redirecionar para confirmação
        return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true`)
      } else {
        console.error('Erro ao processar código no callback:', error)
        // Erro ao processar código - redirecionar com erro
        return NextResponse.redirect(`${baseUrl}/confirm-email?error=invalid_code`)
      }
    } catch (sessionError) {
      console.error('Erro na sessão do callback:', sessionError)
      // Erro na sessão - redirecionar com erro
      return NextResponse.redirect(`${baseUrl}/confirm-email?error=session_error`)
    }
  }

  // Fallback - redirecionar para confirmação com erro
  return NextResponse.redirect(`${baseUrl}/confirm-email?error=no_code`)
}
