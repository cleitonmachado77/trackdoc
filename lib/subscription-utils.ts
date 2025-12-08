import { createBrowserClient } from '@supabase/ssr'
import type { Subscription, Plan, PlanType } from '@/types/subscription'
import { TRIAL_PERIOD_DAYS } from '@/types/subscription'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Verifica se as tabelas necessárias existem
 */
export async function checkSubscriptionTables(): Promise<{
  subscriptionsExists: boolean
  plansExists: boolean
  errors: string[]
}> {
  const errors: string[] = []
  let subscriptionsExists = false
  let plansExists = false

  try {
    // Verificar se a tabela subscriptions existe
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1)

    if (subscriptionsError) {
      errors.push(`Tabela subscriptions: ${subscriptionsError.message}`)
    } else {
      subscriptionsExists = true
    }
  } catch (err) {
    errors.push(`Erro ao verificar tabela subscriptions: ${err}`)
  }

  try {
    // Verificar se a tabela plans existe
    const { error: plansError } = await supabase
      .from('plans')
      .select('id')
      .limit(1)

    if (plansError) {
      errors.push(`Tabela plans: ${plansError.message}`)
    } else {
      plansExists = true
    }
  } catch (err) {
    errors.push(`Erro ao verificar tabela plans: ${err}`)
  }

  return { subscriptionsExists, plansExists, errors }
}

/**
 * Busca subscription do usuário com fallbacks
 */
export async function getUserActiveSubscription(userId: string): Promise<{
  subscription: Subscription | null
  error: string | null
  method: 'rpc' | 'direct' | 'fallback'
}> {
  // Primeiro, verificar se as tabelas existem
  const { subscriptionsExists, plansExists, errors } = await checkSubscriptionTables()
  
  if (!subscriptionsExists) {
    return {
      subscription: null,
      error: 'Tabela subscriptions não existe',
      method: 'fallback'
    }
  }

  // Tentar função RPC primeiro
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_active_subscription', {
      p_user_id: userId
    })

    if (!rpcError && rpcData && rpcData.length > 0) {
      return {
        subscription: rpcData[0],
        error: null,
        method: 'rpc'
      }
    }

    if (rpcError) {
      console.warn('Função RPC falhou:', rpcError)
    }
  } catch (err) {
    console.warn('Erro ao chamar função RPC:', err)
  }

  // Fallback para consulta direta
  try {
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')

    // Se a tabela plans existe, incluir o relacionamento
    if (plansExists) {
      query = query.select(`
        *,
        plan:plans(*)
      `)
    }

    const { data: directData, error: directError } = await query.single()

    if (!directError && directData) {
      return {
        subscription: directData,
        error: null,
        method: 'direct'
      }
    }

    if (directError && directError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, é normal
      return {
        subscription: null,
        error: `Erro na consulta direta: ${directError.message}`,
        method: 'direct'
      }
    }

    // Sem subscription ativa (normal)
    return {
      subscription: null,
      error: null,
      method: 'direct'
    }
  } catch (err) {
    return {
      subscription: null,
      error: `Erro geral: ${err}`,
      method: 'fallback'
    }
  }
}

/**
 * Cria uma subscription trial de 14 dias
 */
export async function createTrialSubscription(
  userId: string, 
  planType: PlanType = 'profissional'
): Promise<{
  success: boolean
  subscriptionId?: string
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .rpc('create_trial_subscription', {
        p_user_id: userId,
        p_plan_type: planType
      })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      subscriptionId: data,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      error: `Erro ao criar trial: ${err}`
    }
  }
}

/**
 * Busca todos os planos disponíveis
 */
export async function getAvailablePlans(): Promise<{
  plans: Plan[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .eq('interval', 'monthly')
      .order('price', { ascending: true })

    if (error) {
      return {
        plans: [],
        error: error.message
      }
    }

    return {
      plans: data || [],
      error: null
    }
  } catch (err) {
    return {
      plans: [],
      error: `Erro ao buscar planos: ${err}`
    }
  }
}

/**
 * Atualiza o uso de recursos da subscription
 */
export async function updateSubscriptionUsage(
  subscriptionId: string,
  usage: {
    current_users?: number
    current_storage_gb?: number
  }
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update(usage)
      .eq('id', subscriptionId)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      error: `Erro ao atualizar uso: ${err}`
    }
  }
}

/**
 * Cancela uma subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      error: `Erro ao cancelar subscription: ${err}`
    }
  }
}
