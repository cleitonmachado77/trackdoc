/**
 * Hook para obter o cliente Supabase correto (com proxy se necessário)
 */

import { useAuth } from '@/lib/contexts/hybrid-auth-context'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'

export function useSupabase() {
  const { connectionStatus } = useAuth()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initClient = async () => {
      try {
        if (connectionStatus.connected) {
          const { client: supabaseClient } = await getSupabaseClient()
          setClient(supabaseClient)
        }
      } catch (error) {
        console.error('Erro ao inicializar cliente Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    initClient()
  }, [connectionStatus.connected])

  return {
    supabase: client,
    loading,
    isConnected: connectionStatus.connected,
    usingProxy: connectionStatus.usingProxy
  }
}