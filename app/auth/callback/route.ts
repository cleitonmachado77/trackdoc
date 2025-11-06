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
      // Processar código de confirmação
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.session) {
        // Sucesso - redirecionar para confirmação
        return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true`)
      } else {
        // Erro ao processar código - redirecionar com código para processamento no cliente
        return NextResponse.redirect(`${baseUrl}/confirm-email?code=${code}`)
      }
    } catch (sessionError) {
      // Erro na sessão - redirecionar com código para processamento no cliente
      return NextResponse.redirect(`${baseUrl}/confirm-email?code=${code}`)
    }
  }

  // Fallback - redirecionar para confirmação com erro
  return NextResponse.redirect(`${baseUrl}/confirm-email?error=no_code`)
}
