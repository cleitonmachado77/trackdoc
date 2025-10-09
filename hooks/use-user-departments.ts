import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

export interface UserDepartment {
  id: string
  user_id: string
  department_id: string
  role_in_department: 'member' | 'manager' | 'supervisor'
  is_primary: boolean
  assigned_at: string
  assigned_by?: string
  notes?: string
  // Dados do usuário
  user: {
    id: string
    full_name: string
    email: string
    role: string
    entity_id?: string
    created_at: string
    updated_at: string
  }
  // Dados do departamento
  department: {
    id: string
    name: string
    description?: string
    entity_id: string
    created_at: string
    updated_at: string
  }
}

export function useUserDepartments() {
  const { user } = useAuth()
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchUserDepartments()
    }
  }, [user?.id])

  const fetchUserDepartments = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

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

      const { data, error } = await supabase
        .from('user_departments')
        .select(`
          *,
          user:profiles!user_departments_user_id_fkey(
            id,
            full_name,
            email,
            role,
            entity_id,
            created_at,
            updated_at
          ),
          department:departments!user_departments_department_id_fkey(
            id,
            name,
            description,
            entity_id,
            created_at,
            updated_at
          )
        `)
        .eq('user.entity_id', entityId)

      if (error) throw error

      setUserDepartments(data || [])
    } catch (err) {
      console.error('Erro ao buscar usuários por departamento:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar usuários de um departamento específico
  const getUsersByDepartment = (departmentId: string) => {
    return userDepartments
      .filter(ud => ud.department_id === departmentId)
      .map(ud => ud.user)
  }

  // Função para buscar departamentos de um usuário específico
  const getDepartmentsByUser = (userId: string) => {
    return userDepartments
      .filter(ud => ud.user_id === userId)
      .map(ud => ud.department)
  }

  // Função para verificar se um usuário pertence a um departamento
  const isUserInDepartment = (userId: string, departmentId: string) => {
    return userDepartments.some(ud => 
      ud.user_id === userId && ud.department_id === departmentId
    )
  }

  return {
    userDepartments,
    loading,
    error,
    fetchUserDepartments,
    getUsersByDepartment,
    getDepartmentsByUser,
    isUserInDepartment
  }
}
