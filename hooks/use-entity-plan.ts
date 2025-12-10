import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export interface EntityPlanInfo {
  canCreateUser: boolean
  currentUsers: number
  maxUsers: number
  remainingUsers: number
  planType: string
  planName: string
  adminUserId: string
  subscriptionId: string
  features: Record<string, boolean>
}

export interface EntityPlanStatus {
  planInfo: EntityPlanInfo | null
  loading: boolean
  error: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

/**
 * Hook para gerenciar informações do plano de uma entidade
 */
export function useEntityPlan(entityId?: string): EntityPlanStatus & {
  refreshPlanInfo: () => Promise<void>
  checkCanCreateUser: () => boolean
  getRemainingUsers: () => number
  hasFeature: (feature: string) => boolean
} {
  const [planInfo, setPlanInfo] = useState<EntityPlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlanInfo = useCallback(async () => {
    if (!entityId) {
      setPlanInfo(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar informações do plano usando a função SQL
      const { data, error: rpcError } = await supabase
        .rpc('check_entity_user_limit', { p_entity_id: entityId })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhuma informação de plano encontrada para esta entidade')
      }

      const planData = data[0]

      // Se não encontrou subscription, retornar erro mais específico
      if (!planData.subscription_id) {
        throw new Error('Admin da entidade não possui plano ativo')
      }

      // Buscar detalhes do plano e features
      const { data: planDetails, error: planError } = await supabase
        .from('plans')
        .select('name, features')
        .eq('type', planData.plan_type)
        .single()

      if (planError) {
        console.warn('Erro ao buscar detalhes do plano:', planError)
      }

      const result: EntityPlanInfo = {
        canCreateUser: planData.can_create_user,
        currentUsers: planData.current_users,
        maxUsers: planData.max_users,
        remainingUsers: planData.remaining_users,
        planType: planData.plan_type,
        planName: planDetails?.name || planData.plan_type,
        adminUserId: planData.admin_user_id,
        subscriptionId: planData.subscription_id,
        features: planDetails?.features || {}
      }

      setPlanInfo(result)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar informações do plano'
      setError(errorMessage)
      setPlanInfo(null)
    } finally {
      setLoading(false)
    }
  }, [entityId])

  const refreshPlanInfo = useCallback(async () => {
    await fetchPlanInfo()
  }, [fetchPlanInfo])

  const checkCanCreateUser = useCallback((): boolean => {
    return planInfo?.canCreateUser || false
  }, [planInfo])

  const getRemainingUsers = useCallback((): number => {
    return planInfo?.remainingUsers || 0
  }, [planInfo])

  const hasFeature = useCallback((feature: string): boolean => {
    return planInfo?.features?.[feature] || false
  }, [planInfo])

  useEffect(() => {
    fetchPlanInfo()
  }, [fetchPlanInfo])

  return {
    planInfo,
    loading,
    error,
    refreshPlanInfo,
    checkCanCreateUser,
    getRemainingUsers,
    hasFeature
  }
}

/**
 * Hook simplificado para verificar apenas se pode criar usuários
 */
export function useCanCreateEntityUser(entityId?: string) {
  const { planInfo, loading, error, refreshPlanInfo } = useEntityPlan(entityId)

  return {
    canCreate: planInfo?.canCreateUser || false,
    remainingUsers: planInfo?.remainingUsers || 0,
    currentUsers: planInfo?.currentUsers || 0,
    maxUsers: planInfo?.maxUsers || 0,
    loading,
    error,
    refresh: refreshPlanInfo
  }
}

/**
 * Hook para verificar features do plano da entidade
 */
export function useEntityPlanFeatures(entityId?: string) {
  const { planInfo, loading, error, hasFeature } = useEntityPlan(entityId)

  return {
    features: planInfo?.features || {},
    planType: planInfo?.planType || '',
    planName: planInfo?.planName || '',
    hasFeature,
    loading,
    error
  }
}