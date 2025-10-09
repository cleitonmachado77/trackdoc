import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

export interface AccessStatus {
  access_granted: boolean
  message: string
  status: 'active' | 'expired' | 'registration_incomplete' | 'no_active_subscription' | 'not_found'
  plan_name?: string
  plan_id?: string
  is_trial?: boolean
  days_remaining?: number
  period_end?: string
  features?: string[]
  limits?: {
    max_users: number
    max_storage_gb: number
    max_documents: number
  }
  // Novos campos para entidades
  entity_access?: boolean
  entity_id?: string
}

export function useAccessStatus() {
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Verificar se as variáveis de ambiente estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      accessStatus: {
        access_granted: false,
        message: 'Supabase não configurado',
        status: 'not_found' as const
      },
      loading: false,
      error: 'Variáveis de ambiente do Supabase não configuradas'
    }
  }
  
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    let mounted = true

    async function checkAccess() {
      if (!user) {
        if (mounted) {
          setAccessStatus({
            access_granted: false,
            message: 'Usuário não autenticado',
            status: 'not_found'
          })
          setLoading(false)
        }
        return
      }

      try {
        if (mounted) {
          setLoading(true)
          setError(null)
        }

        const { data, error } = await supabase.rpc('check_user_access_status', {
          p_user_id: user.id
        })

        if (!mounted) return

        if (error) {
          console.error('Erro ao verificar acesso:', error)
          setError('Erro ao verificar status de acesso')
          return
        }


        
        setAccessStatus(data)
      } catch (err) {
        if (!mounted) return
        console.error('Erro ao verificar acesso:', err)
        setError('Erro interno ao verificar acesso')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAccess()

    return () => {
      mounted = false
    }
  }, [user?.id]) // Só dependência do user.id, não do objeto user inteiro

  return { accessStatus, loading, error }
}
