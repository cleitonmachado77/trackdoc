'use client'

import { useSubscription } from './useSubscription'
import type { PlanFeatures } from '@/types/subscription'

interface UseFeatureAccessReturn {
  hasAccess: boolean
  loading: boolean
  reason?: 'no_subscription' | 'feature_not_included' | 'trial_expired' | 'subscription_expired'
  showUpgradePrompt: boolean
}

/**
 * Hook para verificar acesso a funcionalidades específicas
 * Retorna se o usuário tem acesso e o motivo caso não tenha
 */
export function useFeatureAccess(
  userId: string | undefined,
  feature: keyof PlanFeatures
): UseFeatureAccessReturn {
  const { subscription, loading, hasFeature, isTrialExpired } = useSubscription(userId)

  if (loading) {
    return {
      hasAccess: false,
      loading: true,
      showUpgradePrompt: false,
    }
  }

  // Sem subscription
  if (!subscription) {
    return {
      hasAccess: false,
      loading: false,
      reason: 'no_subscription',
      showUpgradePrompt: true,
    }
  }

  // Trial expirado
  if (isTrialExpired) {
    return {
      hasAccess: false,
      loading: false,
      reason: 'trial_expired',
      showUpgradePrompt: true,
    }
  }

  // Subscription expirada
  if (subscription.status === 'expired') {
    return {
      hasAccess: false,
      loading: false,
      reason: 'subscription_expired',
      showUpgradePrompt: true,
    }
  }

  // Verificar se o plano inclui a funcionalidade
  const hasFeatureAccess = hasFeature(feature)

  if (!hasFeatureAccess) {
    return {
      hasAccess: false,
      loading: false,
      reason: 'feature_not_included',
      showUpgradePrompt: true,
    }
  }

  // Tem acesso!
  return {
    hasAccess: true,
    loading: false,
    showUpgradePrompt: false,
  }
}

/**
 * Mensagens amigáveis para cada motivo de bloqueio
 */
export const FEATURE_ACCESS_MESSAGES: Record<string, string> = {
  no_subscription: 'Você precisa de um plano ativo para acessar esta funcionalidade.',
  feature_not_included: 'Esta funcionalidade não está incluída no seu plano atual. Faça upgrade para ter acesso.',
  trial_expired: 'Seu período de teste expirou. Assine um plano para continuar usando esta funcionalidade.',
  subscription_expired: 'Sua assinatura expirou. Renove para continuar usando esta funcionalidade.',
}
