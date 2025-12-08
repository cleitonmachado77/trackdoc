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
            interval: 'monthly',
            features: data.plan_features,
            limits: {
              max_usuarios: data.max_usuarios,
              armazenamento_gb: data.armazenamento_gb,
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

  // Verificar se trial está ativo
  const isTrialActive = subscription?.status === 'trial' && 
    subscription.trial_end_date ? new Date(subscription.trial_end_date) > new Date() : false

  // Verificar se trial expirou
  const isTrialExpired = subscription?.status === 'trial' && 
    subscription.trial_end_date ? new Date(subscription.trial_end_date) <= new Date() : false

  // Dias até o fim do trial
  const daysUntilTrialEnd = subscription?.trial_end_date 
    ? Math.ceil((new Date(subscription.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return {
    subscription,
    loading,
    error,
    hasFeature,
    isWithinLimit,
    isTrialActive,
    isTrialExpired,
    daysUntilTrialEnd,
    refetch: fetchSubscription,
  }
}
