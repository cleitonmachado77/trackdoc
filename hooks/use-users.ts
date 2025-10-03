import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/auth-context'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface User {
  id: string
  full_name: string
  email: string
  role: string
  entity_id?: string
  created_at: string
  updated_at: string
}

export function useUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchUsers()
    }
  }, [user?.id])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      // Buscar o profile do usuário para obter entity_id
      let entityId = 'ebde2fef-30e2-458b-8721-d86df2f6865b' // ID padrão da entidade
      
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('entity_id')
          .eq('id', user.id)
          .single()
        
        if (profileData?.entity_id) {
          entityId = profileData.entity_id
        }
      }

      query = query.eq('entity_id', entityId)

      const { data, error } = await query

      if (error) throw error

      setUsers(data || [])
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  }
}
