'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Subscription, PlanFeatures } from '@/types/subscription'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  loading: boolean
  error: string | null
  hasFeature: (feature: keyof PlanFeatures) => boolean
  isWithinLimit: (limit: 'users' | 'storage') => boolean
  isTrialActive: boolean
  isTrialExpired: boolean
  daysUntilTrialEnd: number | null
  getRemainingUsers: () => number
  getRemainingStorage: () => number
  getUsagePercentage: (limit: 'users' | 'storage') => number
  getCurrentUsage: () => { users: number; storage: number }
  refetch: () => Promise<void>
}

export function useSubscription(userId?: string): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClientSupabaseClient()
      
      const { data, error: fetchError } = await supabase
        .rpc('get_user_active_subscription', { p_user_id: userId })
        .single()

      if (fetchError) {
        // Se não encontrou subscription, não é erro
        if (fetchError.code === 'PGRST116') {
          setSubscription(null)
          setError(null)
        } else {
          throw fetchError
        }
      } else if (data) {
        // Transformar dados do RPC para o formato Subscription
        // Todos os dados vêm diretamente do plano cadastrado no banco
        const sub: Subscription = {
          id: data.id,
          user_id: data.user_id,
          entity_id: data.entity_id,
          plan_id: data.plan_id,
          status: data.status,
          start_date: data.start_date,
          end_date: data.end_date,
          trial_start_date: data.trial_start_date,
          trial_end_date: data.trial_end_date,
          current_users: data.current_users,
          current_storage_gb: data.current_storage_gb,
          created_at: data.start_date,
          updated_at: data.start_date,
          plan: {
            id: data.plan_id,
            name: data.plan_name,
            type: data.plan_type,
            price: data.plan_price,
            interval: data.plan_interval || 'monthly',
            features: data.plan_features || {},
            limits: {
              max_usuarios: data.max_usuarios,
              armazenamento_gb: data.armazenamento_gb,
              usuario_adicional_preco: data.usuario_adicional_preco,
              armazenamento_extra_preco: data.armazenamento_extra_preco,
            },
            created_at: '',
            updated_at: '',
          },
        }
        setSubscription(sub)
      }
    } catch (err) {
      console.error('Erro ao buscar subscription:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [userId])

  // Verificar se tem acesso a uma funcionalidade
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!subscription?.plan?.features) return false
    return subscription.plan.features[feature] === true
  }

  // Verificar se está dentro dos limites
  const isWithinLimit = (limit: 'users' | 'storage'): boolean => {
    if (!subscription?.plan?.limits) return false
    
    if (limit === 'users') {
      return subscription.current_users < subscription.plan.limits.max_usuarios
    }
    
    if (limit === 'storage') {
      return subscription.current_storage_gb < subscription.plan.limits.armazenamento_gb
    }
    
    return false
  }

  // Verificar se trial está ativo (usando trialEndDate calculado)
  const isTrialActive = subscription?.status === 'trial' && trialEndDate 
    ? trialEndDate > new Date() 
    : false

  // Verificar se trial expirou (usando trialEndDate calculado)
  const isTrialExpired = subscription?.status === 'trial' && trialEndDate 
    ? trialEndDate <= new Date() 
    : false

  // Dias até o fim do trial
  // Se trial_end_date não estiver definido, calcula baseado em start_date + 14 dias
  const calculateTrialEndDate = () => {
    if (subscription?.trial_end_date) {
      return new Date(subscription.trial_end_date)
    }
    if (subscription?.status === 'trial' && subscription?.start_date) {
      const startDate = new Date(subscription.start_date)
      startDate.setDate(startDate.getDate() + 14)
      return startDate
    }
    return null
  }
  
  const trialEndDate = calculateTrialEndDate()
  const daysUntilTrialEnd = trialEndDate 
    ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Calcular usuários restantes
  const getRemainingUsers = (): number => {
    if (!subscription?.plan?.limits) return 0
    return Math.max(0, subscription.plan.limits.max_usuarios - subscription.current_users)
  }

  // Calcular armazenamento restante (em GB)
  const getRemainingStorage = (): number => {
    if (!subscription?.plan?.limits) return 0
    return Math.max(0, subscription.plan.limits.armazenamento_gb - subscription.current_storage_gb)
  }

  // Calcular percentual de uso
  const getUsagePercentage = (limit: 'users' | 'storage'): number => {
    if (!subscription?.plan?.limits) return 0
    
    if (limit === 'users') {
      const max = subscription.plan.limits.max_usuarios
      return max > 0 ? Math.round((subscription.current_users / max) * 100) : 0
    }
    
    if (limit === 'storage') {
      const max = subscription.plan.limits.armazenamento_gb
      return max > 0 ? Math.round((subscription.current_storage_gb / max) * 100) : 0
    }
    
    return 0
  }

  // Obter uso atual
  const getCurrentUsage = () => ({
    users: subscription?.current_users || 0,
    storage: subscription?.current_storage_gb || 0,
  })

  return {
    subscription,
    loading,
    error,
    hasFeature,
    isWithinLimit,
    isTrialActive,
    isTrialExpired,
    daysUntilTrialEnd,
    getRemainingUsers,
    getRemainingStorage,
    getUsagePercentage,
    getCurrentUsage,
    refetch: fetchSubscription,
  }
}
