"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from '@/lib/hooks/use-auth-final'

export default function LandingRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Só redirecionar para o site principal se:
    // 1. Não está carregando
    // 2. Não tem usuário
    // 3. Está na raiz (/) especificamente
    // 4. Não está em uma página de autenticação
    const authPages = ['/login', '/register', '/verify-email', '/reset-password', '/confirm-email', '/forgot-password']
    
    // Apenas redirecionar se estiver na raiz E não tiver usuário
    if (!loading && !user && pathname === '/' && !authPages.includes(pathname)) {
      console.log('🔄 [LandingRedirect] Redirecionando para site principal')
      window.location.href = 'https://www.trackdoc.app.br/'
    }
  }, [user, loading, router, pathname])

  // Não renderizar nada, apenas controlar redirecionamentos
  return null
}
