"use client"

import { useAuth } from '@/lib/hooks/use-auth-final'
import { useForcePasswordChange } from '@/hooks/use-force-password-change'
import ForcePasswordChange from './ForcePasswordChange'
import { Loader2 } from 'lucide-react'

interface PasswordChangeGuardProps {
  children: React.ReactNode
}

export default function PasswordChangeGuard({ children }: PasswordChangeGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const { needsPasswordChange, loading: passwordLoading, markPasswordChanged } = useForcePasswordChange()

  // Mostrar loading enquanto verifica autenticação e status de senha
  if (authLoading || passwordLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário logado, mostrar o conteúdo normal (página de login)
  if (!user) {
    return <>{children}</>
  }

  // Se usuário precisa alterar senha, mostrar tela de alteração
  if (needsPasswordChange) {
    return (
      <ForcePasswordChange 
        user={user} 
        onPasswordChanged={markPasswordChanged}
      />
    )
  }

  // Caso contrário, mostrar o conteúdo normal
  return <>{children}</>
}