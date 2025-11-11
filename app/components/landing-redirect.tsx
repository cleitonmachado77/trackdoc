"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from '@/lib/hooks/use-auth-final'

export default function LandingRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Se acabou de fazer logout, não fazer nada (signOut já está redirecionando)
    if (typeof window !== 'undefined' && sessionStorage.getItem('just_logged_out') === 'true') {
      console.log('🚪 [LandingRedirect] Logout em andamento, ignorando...')
      return
    }
    
    // Apenas redirecionar se estiver na raiz E não tiver usuário E não estiver carregando
    if (!loading && !user && pathname === '/') {
      console.log('🔄 [LandingRedirect] Redirecionando para site principal')
      window.location.href = 'https://www.trackdoc.app.br/'
    }
  }, [user, loading, pathname])

  // Não renderizar nada, apenas controlar redirecionamentos
  return null
}
