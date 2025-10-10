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

  // Se não há usuário autenticado, mostrar mensagem de erro
  if (!user || !profile) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center p-8">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para acessar esta área.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ✅ MUDANÇA: Permitir acesso à administração para todos os usuários autenticados
  // Isso permite que usuários sem entidade possam criar uma entidade
  // Se é usuário autenticado, mostrar o conteúdo
  return <>{children}</>
}
