import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseConfig } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  // Usar a URL correta baseada no ambiente
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.com.br'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Verificar o tipo de callback e redirecionar adequadamente
      if (type === 'recovery') {
        // Redirecionar para a página de reset de senha
        return NextResponse.redirect(`${baseUrl}/reset-password`)
      } else {
        // Redirecionar para a página de confirmação de email
        return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true`)
      }
    }
  }

  // Se houver erro, verificar o tipo para redirecionar adequadamente
  if (type === 'recovery') {
    return NextResponse.redirect(`${baseUrl}/forgot-password?error=invalid_link`)
  } else {
    return NextResponse.redirect(`${baseUrl}/confirm-email?error=confirmation_failed`)
  }
}
