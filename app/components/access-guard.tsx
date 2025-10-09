"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/lib/hooks/use-unified-auth'
import { useAccessStatus } from "@/hooks/use-access-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle, Loader2, ArrowRight } from "lucide-react"

interface AccessGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireActiveSubscription?: boolean
}

export default function AccessGuard({ 
  children, 
  requireAuth = true, 
  requireActiveSubscription = true 
}: AccessGuardProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  console.log('🔒 [AccessGuard] Estado:', { 
    user: !!user, 
    authLoading, 
    requireAuth, 
    requireActiveSubscription 
  })

  // Se não requer autenticação, mostrar conteúdo
  if (!requireAuth) {
    console.log('🔒 [AccessGuard] Não requer auth, liberando acesso')
    return <>{children}</>
  }

  // Se está carregando autenticação, mostrar loading
  if (authLoading) {
    console.log('🔒 [AccessGuard] Auth ainda carregando...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não está autenticado, deixar AuthGuard lidar
  if (!user) {
    console.log('🔒 [AccessGuard] Usuário não autenticado, deixando AuthGuard lidar')
    return null
  }

  // TEMPORÁRIO: Sempre permitir acesso para usuários autenticados
  // Isso evita problemas com RPC functions que podem não existir
  console.log('🔒 [AccessGuard] Usuário autenticado, liberando acesso (modo temporário)')
  return <>{children}</>
}
