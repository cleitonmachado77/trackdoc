'use client'

import { ReactNode } from 'react'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Users, HardDrive } from 'lucide-react'
import Link from 'next/link'

interface LimitGuardProps {
  userId: string | undefined
  limitType: 'users' | 'storage'
  requiredAmount?: number // Para verificar se há espaço suficiente (em GB para storage)
  children: ReactNode
  onLimitReached?: () => void
  showAlert?: boolean
}

/**
 * Componente para bloquear ações quando limites são atingidos
 * 
 * @example
 * // Bloquear upload se não houver espaço
 * <LimitGuard userId={user.id} limitType="storage" requiredAmount={fileSize}>
 *   <UploadButton />
 * </LimitGuard>
 * 
 * @example
 * // Bloquear criação de usuário se limite atingido
 * <LimitGuard userId={user.id} limitType="users">
 *   <CreateUserButton />
 * </LimitGuard>
 */
export function LimitGuard({
  userId,
  limitType,
  requiredAmount = 0,
  children,
  onLimitReached,
  showAlert = true,
}: LimitGuardProps) {
  const { 
    subscription, 
    loading, 
    isWithinLimit,
    getRemainingUsers,
    getRemainingStorage,
    getUsagePercentage,
  } = useSubscription(userId)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!subscription) {
    if (!showAlert) return null
    
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Plano Necessário</AlertTitle>
        <AlertDescription>
          Você precisa de um plano ativo para realizar esta ação.
          <div className="mt-3">
            <Button asChild size="sm">
              <Link href="/pricing">Ver Planos</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Verificar limite
  let hasSpace = false
  let remaining = 0
  let percentage = 0
  let message = ''
  let icon = <AlertTriangle className="h-5 w-5" />

  if (limitType === 'users') {
    remaining = getRemainingUsers()
    percentage = getUsagePercentage('users')
    hasSpace = remaining > 0
    icon = <Users className="h-5 w-5" />
    
    if (!hasSpace) {
      message = `Sua entidade atingiu o limite de ${subscription.plan?.limits.max_usuarios} usuários do Plano ${subscription.plan?.name}.`
    }
  } else if (limitType === 'storage') {
    remaining = getRemainingStorage()
    percentage = getUsagePercentage('storage')
    
    // Se requiredAmount foi fornecido, verificar se há espaço suficiente
    if (requiredAmount > 0) {
      hasSpace = remaining >= requiredAmount
      if (!hasSpace) {
        message = `Espaço insuficiente. Você precisa de ${requiredAmount.toFixed(2)} GB, mas tem apenas ${remaining.toFixed(2)} GB disponíveis.`
      }
    } else {
      hasSpace = remaining > 0
      if (!hasSpace) {
        message = `Você atingiu o limite de ${subscription.plan?.limits.armazenamento_gb} GB do Plano ${subscription.plan?.name}.`
      }
    }
    
    icon = <HardDrive className="h-5 w-5" />
  }

  // Se tem espaço, renderizar children
  if (hasSpace) {
    return <>{children}</>
  }

  // Chamar callback se fornecido
  if (onLimitReached) {
    onLimitReached()
  }

  // Sem espaço - mostrar alerta
  if (!showAlert) {
    return null
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Alert variant="destructive">
        {icon}
        <AlertTitle className="text-lg font-semibold">
          {limitType === 'users' ? 'Limite de Usuários Atingido' : 'Limite de Armazenamento Atingido'}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p>{message}</p>
          
          <div className="bg-destructive/10 p-3 rounded-md">
            <p className="text-sm font-medium">
              {limitType === 'users' 
                ? `Usuários atuais: ${subscription.current_users}/${subscription.plan?.limits.max_usuarios} (${percentage}%)`
                : `Armazenamento usado: ${subscription.current_storage_gb.toFixed(2)} GB / ${subscription.plan?.limits.armazenamento_gb} GB (${percentage}%)`
              }
            </p>
          </div>

          <p className="text-sm">
            {limitType === 'users'
              ? 'Não é possível criar novos usuários. Entre em contato com o administrador para fazer upgrade do plano.'
              : 'Não é possível fazer upload de novos arquivos. Exclua arquivos ou solicite upgrade do plano.'
            }
          </p>
          
          <div className="flex gap-3">
            <Button asChild variant="default" size="sm">
              <Link href="/pricing">Ver Planos</Link>
            </Button>
            {limitType === 'storage' && (
              <Button asChild variant="outline" size="sm">
                <Link href="/documents">Gerenciar Arquivos</Link>
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
