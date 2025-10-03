import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/auth-context'

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
  // Relacionamentos
  plan?: {
    id: string
    name: string
    price: number
    interval: string
    features: string[]
  }
}

export interface Invoice {
  id: string
  subscription_id: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'canceled'
  description?: string
  created_at: string
  paid_at?: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  type: 'card' | 'pix' | 'bank_transfer'
  last_four?: string
  brand?: string
  is_default: boolean
  created_at: string
}

export function useUserSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            plan:plans(*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (isMounted) {
          setSubscription(data)
        }
      } catch (err) {
        console.error('Erro ao buscar assinatura:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSubscription()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  return { subscription, loading, error }
}

export function useUserInvoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setInvoices([])
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchInvoices = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar se a tabela invoices existe
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('Tabela invoices não implementada ainda, retornando array vazio')
          if (isMounted) {
            setInvoices([])
          }
          return
        }

        if (isMounted) {
          setInvoices(data || [])
        }
      } catch (err) {
        console.error('Erro ao buscar faturas:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar faturas')
          setInvoices([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchInvoices()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  return { invoices, loading, error }
}

export function useUserPaymentMethods() {
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setPaymentMethods([])
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchPaymentMethods = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar se a tabela payment_methods existe
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('Tabela payment_methods não implementada ainda, retornando array vazio')
          if (isMounted) {
            setPaymentMethods([])
          }
          return
        }

        if (isMounted) {
          setPaymentMethods(data || [])
        }
      } catch (err) {
        console.error('Erro ao buscar métodos de pagamento:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar métodos de pagamento')
          setPaymentMethods([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPaymentMethods()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  return { paymentMethods, loading, error }
}
