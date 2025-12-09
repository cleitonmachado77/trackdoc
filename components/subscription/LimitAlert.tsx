'use client'

import { useState } from 'react'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Users, HardDrive, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface LimitAlertProps {
  userId: string | undefined
  limitType: 'users' | 'storage'
  showAt?: number[] // Percentuais para exibir alerta (padrão: [80, 90])
  onClose?: () => void
}

/**
 * Componente para exibir alertas preventivos quando limites estão próximos
 * 
 * @example
 * // Alertar em 80% e 90% de armazenamento
 * <LimitAlert userId={user.id} limitType="storage" showAt={[80, 90]} />
 * 
 * @example
 * // Alertar em 90% de usuários
 * <LimitAlert userId={user.id} limitType="users" showAt={[90]} />
 */
export function LimitAlert({
  userId,
  limitType,
  showAt = [80, 90],
  onClose,
}: LimitAlertProps) {
  const [dismissed, setDismissed] = useState(false)
  
  const { 
    subscription, 
    loading,
    getRemainingUsers,
    getRemainingStorage,
    getUsagePercentage,
  } = useSubscription(userId)

  if (loading || !subscription || dismissed) {
    return null
  }

  const percentage = getUsagePercentage(limitType)
  
  // Verificar se deve exibir alerta
  const shouldShow = showAt.some(threshold => percentage >= threshold)
  
  if (!shouldShow) {
    return null
  }

  // Determinar severidade
  const isCritical = percentage >= 90
  const variant = isCritical ? 'destructive' : 'default'
  
  // Calcular valores
  let current = 0
  let max = 0
  let remaining = 0
  let unit = ''
  let icon = <AlertTriangle className="h-5 w-5" />
  let title = ''

  if (limitType === 'users') {
    current = subscription.current_users
    max = subscription.plan?.limits.max_usuarios || 0
    remaining = getRemainingUsers()
    unit = 'usuários'
    icon = <Users className="h-5 w-5" />
    title = isCritical 
      ? `🚨 Alerta Crítico: ${percentage}% dos Usuários`
      : `⚠️ Atenção: ${percentage}% dos Usuários`
  } else {
    current = subscription.current_storage_gb
    max = subscription.plan?.limits.armazenamento_gb || 0
    remaining = getRemainingStorage()
    unit = 'GB'
    icon = <HardDrive className="h-5 w-5" />
    title = isCritical 
      ? `🚨 Alerta Crítico: Armazenamento em ${percentage}%`
      : `⚠️ Atenção: Armazenamento em ${percentage}%`
  }

  const handleDismiss = () => {
    setDismissed(true)
    if (onClose) {
      onClose()
    }
  }

  return (
    <Alert 
      variant={variant}
      className={`relative ${isCritical ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        aria-label="Fechar alerta"
      >
        <X className="h-4 w-4" />
      </button>

      {icon}
      <AlertTitle className={`text-lg font-semibold pr-8 ${isCritical ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'}`}>
        {title}
      </AlertTitle>
      
      <AlertDescription className={`mt-2 space-y-3 ${isCritical ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
        <p>
          Você está usando{' '}
          <span className="font-semibold">
            {limitType === 'storage' ? current.toFixed(2) : current} {unit}
          </span>
          {' '}dos{' '}
          <span className="font-semibold">
            {max} {unit}
          </span>
          {' '}disponíveis no seu plano.
        </p>

        <div className={`p-3 rounded-md ${isCritical ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          <p className="text-sm font-medium">
            Espaço restante:{' '}
            <span className="font-bold">
              {limitType === 'storage' ? remaining.toFixed(2) : remaining} {unit}
            </span>
          </p>
          {isCritical && (
            <p className="text-sm mt-1 font-semibold">
              ⚠️ O limite está próximo!
            </p>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          {limitType === 'storage' && (
            <Button asChild variant="outline" size="sm">
              <Link href="/documents">Gerenciar Arquivos</Link>
            </Button>
          )}
          {isCritical && (
            <Button asChild variant="default" size="sm" className="gap-2">
              <Link href="/pricing">
                <Sparkles className="h-4 w-4" />
                Ver Planos
              </Link>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
