"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!loading && !hasRedirected.current) {
      // Páginas públicas que não precisam de autenticação
      const publicPages = ["/login", "/register", "/verify-email", "/reset-password", "/confirm-email"]
      
      // Só redirecionar se não estiver em uma página pública e não estiver autenticado
      if (!user && !publicPages.includes(pathname)) {
        hasRedirected.current = true
        router.push("/login")
      } 
      // Só redirecionar para home se estiver em uma página pública (exceto confirm-email) e estiver autenticado
      else if (user && publicPages.includes(pathname) && pathname !== "/confirm-email") {
        hasRedirected.current = true
        router.push("/")
      }
    }
  }, [user, loading, pathname, router])

  // Reset do flag quando o pathname muda
  useEffect(() => {
    hasRedirected.current = false
  }, [pathname])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Páginas públicas
  const publicPages = ["/login", "/register", "/verify-email", "/reset-password", "/confirm-email"]
  if (publicPages.includes(pathname)) {
    return <>{children}</>
  }

  // Se não autenticado, não mostrar nada (será redirecionado)
  if (!user) {
    return null
  }

  // Se autenticado, mostrar conteúdo
  return <>{children}</>
}
