"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"

export default function LandingRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Só redirecionar para landing se:
    // 1. Não está carregando
    // 2. Não tem usuário
    // 3. Não está em uma página de autenticação
    // 4. Não está na própria landing page
    const authPages = ['/login', '/register', '/verify-email', '/reset-password', '/confirm-email', '/landing']
    
    if (!loading && !user && !authPages.includes(pathname)) {
      router.push('/landing')
    }
  }, [user, loading, router, pathname])

  // Não renderizar nada, apenas controlar redirecionamentos
  return null
}
