import { createClient } from '@supabase/supabase-js'

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface EntityAdminSubscription {
  id: string
  user_id: string
  entity_id: string
  plan_id: string
  status: string
  current_users: number
  current_storage_gb: number
  plan: {
    id: string
    name: string
    type: string
    max_users: number
    max_storage_gb: number
    features: Record<string, boolean>
  }
}

/**
 * Busca a subscription do administrador de uma entidade
 * Funciona com a estrutura real das tabelas
 */
export async function getEntityAdminSubscription(entityId: string): Promise<{
  data: EntityAdminSubscription | null
  error: string | null
}> {
  try {
    // 1. Buscar o admin da entidade
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, entity_id, entity_role')
      .eq('entity_id', entityId)
      .eq('entity_role', 'admin')
      .in('status', ['active', 'pending_confirmation'])
      .single()

    if (adminError || !adminProfile) {
      return {
        data: null,
        error: 'Admin da entidade não encontrado ou inativo'
      }
    }

    // 2. Primeiro tentar buscar subscription individual do admin
    let subscription = null
    let subscriptionError = null

    const { data: individualSub, error: individualError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        user_id,
        entity_id,
        plan_id,
        status,
        current_users,
        current_storage_gb
      `)
      .eq('user_id', adminProfile.id)
      .eq('status', 'active')
      .single()

    if (!individualError && individualSub) {
      subscription = individualSub
    } else {
      // 3. Se não encontrou subscription individual, buscar entity_subscription
      const { data: entitySub, error: entityError } = await supabaseAdmin
        .from('entity_subscriptions')
        .select(`
          id,
          entity_id,
          plan_id,
          status
        `)
        .eq('entity_id', entityId)
        .eq('status', 'active')
        .single()

      if (entityError || !entitySub) {
        return {
          data: null,
          error: 'Nenhuma subscription ativa encontrada para a entidade ou admin'
        }
      }

      // Converter entity_subscription para formato compatível
      subscription = {
        id: entitySub.id,
        user_id: adminProfile.id,
        entity_id: entitySub.entity_id,
        plan_id: entitySub.plan_id,
        status: entitySub.status,
        current_users: 0, // Será calculado abaixo
        current_storage_gb: 0
      }
    }

    // 4. Buscar detalhes do plano
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id, name, type, max_users, max_storage_gb, features')
      .eq('id', subscription.plan_id)
      .single()

    if (planError || !planData) {
      return {
        data: null,
        error: 'Plano não encontrado'
      }
    }

    // 5. Calcular current_users se não estiver definido
    let currentUsers = subscription.current_users || 0
    if (currentUsers === 0) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', entityId)
        .in('status', ['active', 'pending_confirmation'])
        .is('deleted_at', null)

      currentUsers = count || 0
    }

    // 6. Formatar resposta
    const result: EntityAdminSubscription = {
      id: subscription.id,
      user_id: subscription.user_id,
      entity_id: subscription.entity_id || entityId,
      plan_id: subscription.plan_id,
      status: subscription.status,
      current_users: currentUsers,
      current_storage_gb: subscription.current_storage_gb || 0,
      plan: {
        id: planData.id,
        name: planData.name,
        type: planData.type,
        max_users: planData.max_users,
        max_storage_gb: planData.max_storage_gb,
        features: planData.features || {}
      }
    }

    return {
      data: result,
      error: null
    }

  } catch (error) {
    console.error('Erro ao buscar subscription do admin da entidade:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Verifica se o admin da entidade pode criar mais usuários
 */
export async function canCreateMoreUsers(entityId: string): Promise<{
  canCreate: boolean
  remainingUsers: number
  currentUsers: number
  maxUsers: number
  error: string | null
}> {
  const { data: subscription, error } = await getEntityAdminSubscription(entityId)

  if (error || !subscription) {
    return {
      canCreate: false,
      remainingUsers: 0,
      currentUsers: 0,
      maxUsers: 0,
      error: error || 'Subscription não encontrada'
    }
  }

  const currentUsers = subscription.current_users
  const maxUsers = subscription.plan.max_users
  const remainingUsers = Math.max(0, maxUsers - currentUsers)
  const canCreate = remainingUsers > 0

  return {
    canCreate,
    remainingUsers,
    currentUsers,
    maxUsers,
    error: null
  }
}

/**
 * Incrementa o contador de usuários da subscription do admin da entidade
 */
export async function incrementEntityUserCount(entityId: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const { data: subscription, error } = await getEntityAdminSubscription(entityId)

    if (error || !subscription) {
      return {
        success: false,
        error: error || 'Subscription não encontrada'
      }
    }

    // Atualizar contador diretamente na tabela subscriptions se existir
    if (subscription.user_id) {
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          current_users: subscription.current_users + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', subscription.user_id)
        .eq('status', 'active')

      if (updateError) {
        console.warn('Erro ao atualizar subscription individual:', updateError.message)
      }
    }

    // Também atualizar contador na tabela entities
    const { error: entityUpdateError } = await supabaseAdmin
      .from('entities')
      .update({
        current_users: subscription.current_users + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId)

    if (entityUpdateError) {
      console.warn('Erro ao atualizar contador da entidade:', entityUpdateError.message)
    }

    return {
      success: true,
      error: null
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Decrementa o contador de usuários da subscription do admin da entidade
 */
export async function decrementEntityUserCount(entityId: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const { data: subscription, error } = await getEntityAdminSubscription(entityId)

    if (error || !subscription) {
      return {
        success: false,
        error: error || 'Subscription não encontrada'
      }
    }

    const newCount = Math.max(0, subscription.current_users - 1)

    // Atualizar contador diretamente na tabela subscriptions se existir
    if (subscription.user_id) {
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          current_users: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', subscription.user_id)
        .eq('status', 'active')

      if (updateError) {
        console.warn('Erro ao atualizar subscription individual:', updateError.message)
      }
    }

    // Também atualizar contador na tabela entities
    const { error: entityUpdateError } = await supabaseAdmin
      .from('entities')
      .update({
        current_users: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId)

    if (entityUpdateError) {
      console.warn('Erro ao atualizar contador da entidade:', entityUpdateError.message)
    }

    return {
      success: true,
      error: null
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Busca as features do plano do admin da entidade para herança
 */
export async function getEntityPlanFeatures(entityId: string): Promise<{
  features: Record<string, boolean>
  planType: string
  error: string | null
}> {
  const { data: subscription, error } = await getEntityAdminSubscription(entityId)

  if (error || !subscription) {
    return {
      features: {},
      planType: '',
      error: error || 'Subscription não encontrada'
    }
  }

  return {
    features: subscription.plan.features,
    planType: subscription.plan.type,
    error: null
  }
}