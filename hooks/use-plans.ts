import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_storage_gb: number
  max_documents: number
  trial_days: number
  is_trial: boolean
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Verificar se as variáveis de ambiente estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      plans: [],
      loading: false,
      error: 'Variáveis de ambiente do Supabase não configuradas'
    }
  }
  
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true })

        if (error) {
          console.error('Erro ao buscar planos:', error)
          setError('Erro ao carregar planos')
          return
        }

        // Converter features de JSON para array se necessário
        const formattedPlans = data?.map(plan => ({
          ...plan,
          features: typeof plan.features === 'string' 
            ? JSON.parse(plan.features) 
            : plan.features
        })) || []

        setPlans(formattedPlans)
      } catch (err) {
        console.error('Erro ao buscar planos:', err)
        setError('Erro interno ao carregar planos')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [supabase])

  return { plans, loading, error }
}
