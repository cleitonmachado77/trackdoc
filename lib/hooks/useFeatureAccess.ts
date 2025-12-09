'use client'

import { useSubscription } from './useSubscription'
import type { PlanFeatures, PlanType } from '@/types/subscription'

interface UseFeatureAccessReturn {
  hasAccess: boolean
  loading: boolean
  reason?: 'no_subscription' | 'feature_not_included' | 'trial_expired' | 'subscription_expired'
  showUpgradePrompt: boolean
  requiredPlan?: PlanType
  currentPlan?: PlanType
}

/**
 * Determina qual plano é necessário para acessar uma funcionalidade
 */
function getRequiredPlan(feature: keyof PlanFeatures): PlanType {
  // Funcionalidades do Básico
  if (['dashboard_gerencial', 'upload_documentos', 'solicitacao_aprovacoes', 
       'suporte_email', 'biblioteca_publica'].includes(feature)) {
    return 'basico'
  }
  
  // Funcionalidades do Profissional
  if (feature === 'assinatura_eletronica_simples') {
    return 'profissional'
  }
  
  // Funcionalidades exclusivas do Enterprise
  if (['assinatura_eletronica_multipla', 'chat_nativo', 'auditoria_completa',
       'backup_automatico_diario', 'suporte_tecnico_dedicado'].includes(feature)) {
    return 'enterprise'
  }
  
  // Padrão: Enterprise
  return 'enterprise'
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

  // Obter plano atual e plano necessário
  const currentPlan = subscription?.plan?.type
  const requiredPlan = getRequiredPlan(feature)

  // Verificar se o plano inclui a funcionalidade
  const hasFeatureAccess = hasFeature(feature)

  if (!hasFeatureAccess) {
    return {
      hasAccess: false,
      loading: false,
      reason: 'feature_not_included',
      showUpgradePrompt: true,
      requiredPlan,
      currentPlan,
    }
  }

  // Tem acesso!
  return {
    hasAccess: true,
    loading: false,
    showUpgradePrompt: false,
    currentPlan,
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
