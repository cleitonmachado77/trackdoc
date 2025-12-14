import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

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
  status?: 'active' | 'inactive' | 'suspended' | 'pending_confirmation'
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

      if (!user?.id) {
        setUsers([])
        return
      }

      // Buscar o profile do usuário para obter entity_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      const entityId = profileData?.entity_id

      let data: any[] = []

      if (entityId) {
        // Usuário com entidade - buscar todos os usuários da mesma entidade
        const { data: entityUsers, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('entity_id', entityId)
          .in('status', ['active', 'inactive'])
          .order('full_name', { ascending: true })

        if (queryError) throw queryError
        data = entityUsers || []
      } else {
        // Usuário solo - retornar apenas o próprio usuário
        if (profileData) {
          data = [profileData]
        }
      }

      // Ordenar usuários: ativos primeiro, depois inativos
      const sortedUsers = data.sort((a, b) => {
        // Primeiro por status (ativos primeiro)
        if (a.status === 'active' && b.status !== 'active') return -1
        if (a.status !== 'active' && b.status === 'active') return 1
        
        // Depois por nome
        return (a.full_name || '').localeCompare(b.full_name || '')
      })

      setUsers(sortedUsers)
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
