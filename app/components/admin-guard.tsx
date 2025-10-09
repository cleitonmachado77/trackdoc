"use client"

import { ReactNode } from "react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useUserProfile } from "@/hooks/use-database-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

interface AdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user } = useAuth()
  const { profile, loading } = useUserProfile(user?.id)

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Verificando permissões...</span>
      </div>
    )
  }

  // Se não é admin, mostrar mensagem de acesso negado
  if (profile?.role !== 'admin') {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center p-8">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta área. Apenas administradores podem acessar a página de Administração.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Se é admin, mostrar o conteúdo
  return <>{children}</>
}
