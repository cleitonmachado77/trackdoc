import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para:
 * 1. Gerenciar sessão do Supabase
 * 2. Bloquear acesso se subscription expirada/inativa
 * 3. Redirecionar para páginas apropriadas
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Rotas públicas que não precisam de verificação
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/subscription-expired',
    '/trial-expired',
    '/auth',
    '/api',
  ]

  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  // Se não estiver autenticado e não for rota pública, redirecionar para login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Se estiver autenticado, verificar subscription
  if (user && !isPublicRoute) {
    try {
      // Buscar subscription ativa
      const { data: subscription, error } = await supabase
        .rpc('get_user_active_subscription', { p_user_id: user.id })
        .single()

      // Se não tiver subscription ou erro, permitir acesso mas mostrar aviso
      // (não bloquear completamente para não travar o sistema)
      if (error || !subscription) {
        console.warn('Usuário sem subscription ativa:', user.id)
        // Permitir acesso mas pode adicionar header para mostrar banner
        response.headers.set('x-subscription-warning', 'no-subscription')
        return response
      }

      // Verificar se trial expirou
      if (subscription.status === 'trial' && subscription.trial_end_date) {
        const trialEnd = new Date(subscription.trial_end_date)
        const now = new Date()
        
        if (trialEnd < now) {
          // Trial expirado - redirecionar para página de trial expirado
          return NextResponse.redirect(new URL('/trial-expired', request.url))
        }

        // Trial próximo de expirar (3 dias ou menos)
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysRemaining <= 3) {
          response.headers.set('x-trial-expiring', daysRemaining.toString())
        }
      }

      // Verificar se subscription está expirada ou cancelada
      if (subscription.status === 'expired' || subscription.status === 'canceled') {
        return NextResponse.redirect(new URL('/subscription-expired', request.url))
      }

      // Verificar se pagamento está atrasado
      if (subscription.status === 'past_due') {
        response.headers.set('x-payment-warning', 'past-due')
      }
    } catch (error) {
      console.error('Erro ao verificar subscription:', error)
      // Em caso de erro, permitir acesso (fail-open)
      // Melhor do que bloquear usuário por erro técnico
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
