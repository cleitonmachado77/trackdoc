"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
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
    // Aguardar o loading terminar
    if (loading) {
      return
    }

    // Páginas públicas
    const publicPages = ["/login", "/register", "/verify-email", "/reset-password", "/confirm-email", "/forgot-password"]
    const isPublicPage = publicPages.includes(pathname)
    
    // Se não está autenticado e não está em página pública
    if (!user && !isPublicPage && !hasRedirected.current) {
      console.log('🔒 [AuthGuard] Redirecionando para /login')
      hasRedirected.current = true
      router.replace("/login")
      return
    } 
    
    // Se está autenticado e está em página pública (exceto confirm-email)
    if (user && isPublicPage && pathname !== "/confirm-email" && !hasRedirected.current) {
      console.log('✅ [AuthGuard] Redirecionando para /')
      hasRedirected.current = true
      router.replace("/")
      return
    }
  }, [user, loading, pathname, router])

  // Reset do flag quando o pathname muda
  useEffect(() => {
    hasRedirected.current = false
  }, [pathname])

  // Timeout de segurança - se ficar mais de 5 segundos carregando, redirecionar para login
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ [AuthGuard] Timeout de autenticação - redirecionando para login')
        window.location.href = '/login'
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [loading])

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

  // Se autenticado, mostrar conteúdo
  return <>{children}</>
}
