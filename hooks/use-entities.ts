import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export interface Entity {
  id: string
  name: string
  legal_name?: string
  cnpj?: string
  email: string
  phone?: string
  address?: any
  logo_url?: string
  status: 'active' | 'inactive' | 'suspended'
  subscription_plan_id?: string
  max_users: number
  current_users: number
  created_at: string
  updated_at: string
}

export interface EntityInvitation {
  id: string
  entity_id: string
  email: string
  role: 'user' | 'admin' | 'manager' | 'viewer'
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  invited_by: string
  token: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface EntitySubscription {
  id: string
  entity_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'expired' | 'trial'
  current_period_start?: string
  current_period_end?: string
  trial_start?: string
  trial_end?: string
  is_trial: boolean
  auto_renew: boolean
  payment_method_id?: string
  next_billing_date?: string
  created_at: string
  updated_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export function useEntities() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntities = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntities(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar entidades')
    } finally {
      setLoading(false)
    }
  }

  const createEntity = async (entityData: Omit<Entity, 'id' | 'created_at' | 'updated_at' | 'current_users'>) => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .insert([entityData])
        .select()
        .single()

      if (error) throw error
      
      setEntities(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar entidade'
      setError(errorMessage)
      return { data: null, error: { message: errorMessage } }
    }
  }

  const updateEntity = async (id: string, updates: Partial<Entity>) => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setEntities(prev => prev.map(entity => entity.id === id ? data : entity))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar entidade'
      setError(errorMessage)
      return { data: null, error: { message: errorMessage } }
    }
  }

  const deleteEntity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setEntities(prev => prev.filter(entity => entity.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir entidade'
      setError(errorMessage)
      return { error: { message: errorMessage } }
    }
  }

  useEffect(() => {
    fetchEntities()
  }, [])

  return {
    entities,
    loading,
    error,
    fetchEntities,
    createEntity,
    updateEntity,
    deleteEntity
  }
}

export function useEntityInvitations(entityId?: string) {
  const [invitations, setInvitations] = useState<EntityInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = async () => {
    if (!entityId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('entity_invitations')
        .select('*')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar convites')
    } finally {
      setLoading(false)
    }
  }

  const createInvitation = async (invitationData: {
    entity_id: string
    email: string
    role: 'user' | 'admin' | 'manager' | 'viewer'
    invited_by: string
  }) => {
    try {
      const token = await supabase.rpc('generate_invitation_token')
      const expires_at = new Date()
      expires_at.setDate(expires_at.getDate() + 7) // 7 dias de validade

      const { data, error } = await supabase
        .from('entity_invitations')
        .insert([{
          ...invitationData,
          token: token.data,
          expires_at: expires_at.toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      setInvitations(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar convite'
      setError(errorMessage)
      return { data: null, error: { message: errorMessage } }
    }
  }

  const cancelInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entity_invitations')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (error) throw error
      
      setInvitations(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'cancelled' } : inv))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar convite'
      setError(errorMessage)
      return { error: { message: errorMessage } }
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [entityId])

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    createInvitation,
    cancelInvitation
  }
}

export function useEntitySubscription(entityId?: string) {
  const [subscription, setSubscription] = useState<EntitySubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!entityId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('entity_subscriptions')
        .select('*')
        .eq('entity_id', entityId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      setSubscription(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura')
    } finally {
      setLoading(false)
    }
  }

  const createSubscription = async (subscriptionData: {
    entity_id: string
    plan_id: string
    is_trial?: boolean
  }) => {
    try {
      const { data, error } = await supabase
        .from('entity_subscriptions')
        .insert([subscriptionData])
        .select()
        .single()

      if (error) throw error
      
      setSubscription(data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar assinatura'
      setError(errorMessage)
      return { data: null, error: { message: errorMessage } }
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [entityId])

  return {
    subscription,
    loading,
    error,
    fetchSubscription,
    createSubscription
  }
}
