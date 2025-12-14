'use client'

import { ReactNode } from 'react'
import { useFeatureAccess, FEATURE_ACCESS_MESSAGES } from '@/lib/hooks/useFeatureAccess'
import type { PlanFeatures } from '@/types/subscription'
import { FEATURE_LABELS } from '@/types/subscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles, Mail } from 'lucide-react'
import Link from 'next/link'

interface FeatureGateProps {
  userId: string | undefined
  feature: keyof PlanFeatures
  children: ReactNode
  fallback?: ReactNode
  showAlert?: boolean
  customMessage?: string
}

/**
 * Componente para bloquear acesso a funcionalidades baseado no plano
 * 
 * @example
 * <FeatureGate userId={user.id} feature="biblioteca_publica">
 *   <BibliotecaPublica />
 * </FeatureGate>
 * 
 * @example
 * // Com mensagem customizada
 * <FeatureGate 
 *   userId={user.id} 
 *   feature="chat_nativo"
 *   customMessage="O chat está disponível apenas no plano Enterprise"
 * >
 *   <Chat />
 * </FeatureGate>
 */
export function FeatureGate({
  userId,
  feature,
  children,
  fallback,
  showAlert = true,
  customMessage,
}: FeatureGateProps) {
  const { hasAccess, loading, reason, showUpgradePrompt, requiredPlan, currentPlan } = useFeatureAccess(userId, feature)

  // Mostrar loading enquanto userId não está disponível ou enquanto carrega dados
  if (loading || userId === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  // Sem acesso - mostrar fallback ou alerta
  if (fallback) {
    return <>{fallback}</>
  }

  if (!showAlert) {
    return null
  }

  // Nomes amigáveis dos planos
  const planNames = {
    basico: 'Básico',
    profissional: 'Profissional',
    enterprise: 'Enterprise',
  }

  const featureName = FEATURE_LABELS[feature]
  const currentPlanName = currentPlan ? planNames[currentPlan] : 'Nenhum'
  const requiredPlanName = requiredPlan ? planNames[requiredPlan] : 'Desconhecido'

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <Lock className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-lg font-semibold text-amber-900 dark:text-amber-100">
          🔒 Funcionalidade Bloqueada
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          {customMessage ? (
            <p className="text-amber-800 dark:text-amber-200">{customMessage}</p>
          ) : (
            <>
              <p className="text-amber-800 dark:text-amber-200">
                A funcionalidade <span className="font-semibold">"{featureName}"</span> não está disponível no seu plano atual.
              </p>
              
              {reason === 'feature_not_included' && requiredPlan && (
                <p className="text-amber-800 dark:text-amber-200">
                  Para ter acesso, é necessário o plano <span className="font-semibold">{requiredPlanName}</span> ou superior.
                </p>
              )}
              
              {reason && reason !== 'feature_not_included' && (
                <p className="text-amber-800 dark:text-amber-200">
                  {FEATURE_ACCESS_MESSAGES[reason]}
                </p>
              )}
            </>
          )}

          {/* Informações do plano */}
          {currentPlan && requiredPlan && (
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-md space-y-1">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <span className="font-medium">Plano atual:</span> {currentPlanName}
              </p>
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <span className="font-medium">Plano necessário:</span> {requiredPlanName}
              </p>
            </div>
          )}
          
          {showUpgradePrompt && (
            <div className="space-y-3">
              <div className="flex gap-3 flex-wrap">
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/support">
                    <Sparkles className="h-4 w-4" />
                    Contatar Administrador
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/support">
                    <Mail className="h-4 w-4" />
                    Contatar Administrador
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Entre em contato com o administrador para fazer upgrade do seu plano.
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
