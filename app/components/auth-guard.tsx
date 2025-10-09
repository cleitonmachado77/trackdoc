"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Aguardar o loading terminar antes de fazer qualquer redirecionamento
    if (loading) return

    // Páginas públicas que não precisam de autenticação
    const publicPages = ["/login", "/register", "/verify-email", "/reset-password", "/confirm-email"]
    
    // Se não está autenticado e não está em uma página pública, redirecionar para login
    if (!user && !publicPages.includes(pathname) && !hasRedirected.current) {
      hasRedirected.current = true
      router.push("/login")
      return
    } 
    
    // Se está autenticado e está em uma página pública (exceto confirm-email), redirecionar para home
    if (user && publicPages.includes(pathname) && pathname !== "/confirm-email" && !hasRedirected.current) {
      hasRedirected.current = true
      router.push("/")
      return
    }
  }, [user, loading, pathname, router])

  // Reset do flag quando o pathname muda
  useEffect(() => {
    hasRedirected.current = false
  }, [pathname])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    console.log('🔄 [AuthGuard] Ainda carregando autenticação...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  console.log('✅ [AuthGuard] Loading finalizado. User:', !!user, 'Pathname:', pathname)

  // Páginas públicas
  const publicPages = ["/login", "/register", "/verify-email", "/reset-password", "/confirm-email"]
  if (publicPages.includes(pathname)) {
    return <>{children}</>
  }

  // Se não autenticado, não mostrar nada (será redirecionado)
  if (!user) {
    return null
  }

  // Se autenticado, verificar perfil antes de mostrar conteúdo
  return (
    <>
      {/* Importar ProfileGuard dinamicamente para evitar problemas de SSR */}
      <ProfileGuardWrapper>{children}</ProfileGuardWrapper>
    </>
  )
}

// Componente wrapper para ProfileGuard
function ProfileGuardWrapper({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function checkProfile() {
      if (!user) return

      // Páginas que não precisam de verificação de perfil
      const skipProfileCheck = ["/confirm-email", "/verify-email"]
      if (skipProfileCheck.includes(pathname)) return

      try {
        console.log('🔍 [ProfileGuard] Verificando perfil para usuário:', user.id)
        
        const response = await fetch('/api/profile')
        const result = await response.json()

        if (response.status === 401 && result.code === 'PROFILE_NOT_FOUND') {
          console.log('❌ [ProfileGuard] Perfil não encontrado - fazendo logout')
          
          // Fazer logout através do contexto
          await signOut()
          
          // Limpar storage
          localStorage.clear()
          sessionStorage.clear()
          
          // Redirecionar para login
          router.replace('/login')
          return
        }

        if (!response.ok) {
          console.log('❌ [ProfileGuard] Erro ao verificar perfil:', result.error)
          await signOut()
          router.replace('/login')
          return
        }

        console.log('✅ [ProfileGuard] Perfil encontrado - acesso liberado')
      } catch (error) {
        console.error('❌ [ProfileGuard] Erro ao verificar perfil:', error)
        await signOut()
        router.replace('/login')
      }
    }

    checkProfile()
  }, [user, signOut, router, pathname])

  return <>{children}</>
}
