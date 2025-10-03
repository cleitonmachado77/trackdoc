import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'expired' | 'trial'
  start_date: string
  end_date?: string
  trial_end_date?: string
  created_at: string
  updated_at: string
  plan?: {
    id: string
    name: string
    price: number
    interval: string
    features: string[]
  }
}

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
 * Cria uma subscription básica para usuários sem subscription
 */
export async function createBasicSubscription(userId: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    // Verificar se existe um plano básico
    const { data: basicPlan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('name', 'Básico')
      .or('name.eq.Gratuito,name.eq.Free,name.eq.Basic')
      .limit(1)
      .single()

    if (planError || !basicPlan) {
      return {
        success: false,
        error: 'Nenhum plano básico encontrado'
      }
    }

    // Criar subscription básica
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: basicPlan.id,
        status: 'active',
        start_date: new Date().toISOString(),
        is_trial: true,
        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      })

    if (subscriptionError) {
      return {
        success: false,
        error: `Erro ao criar subscription: ${subscriptionError.message}`
      }
    }

    return {
      success: true,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      error: `Erro geral: ${err}`
    }
  }
}
