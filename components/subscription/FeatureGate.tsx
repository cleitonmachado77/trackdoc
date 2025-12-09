'use client'

import { ReactNode } from 'react'
import { useFeatureAccess, FEATURE_ACCESS_MESSAGES } from '@/lib/hooks/useFeatureAccess'
import type { PlanFeatures } from '@/types/subscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface FeatureGateProps {
  userId: string | undefined
  feature: keyof PlanFeatures
  children: ReactNode
  fallback?: ReactNode
  showAlert?: boolean
}

/**
 * Componente para bloquear acesso a funcionalidades baseado no plano
 * 
 * @example
 * <FeatureGate userId={user.id} feature="biblioteca_publica">
 *   <BibliotecaPublica />
 * </FeatureGate>
 */
export function FeatureGate({
  userId,
  feature,
  children,
  fallback,
  showAlert = true,
}: FeatureGateProps) {
  const { hasAccess, loading, reason, showUpgradePrompt } = useFeatureAccess(userId, feature)

  if (loading) {
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

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <Lock className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-lg font-semibold text-amber-900 dark:text-amber-100">
          Funcionalidade Bloqueada
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p className="text-amber-800 dark:text-amber-200">
            {reason ? FEATURE_ACCESS_MESSAGES[reason] : 'Você não tem acesso a esta funcionalidade.'}
          </p>
          
          {showUpgradePrompt && (
            <div className="flex gap-3">
              <Button asChild variant="default" className="gap-2">
                <Link href="/pricing">
                  <Sparkles className="h-4 w-4" />
                  Ver Planos
                </Link>
              </Button>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                Entre em contato com o administrador para fazer upgrade do seu plano.
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
