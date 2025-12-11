import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Department {
  id: string
  name: string
  description?: string
  manager_id?: string
  entity_id?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  manager_name?: string
  document_count?: number
  user_count?: number
}

export function useDepartments() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let entityId = 'ebde2fef-30e2-458b-8721-d86df2f6865b'
      
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

      const { data, error: queryError } = await supabase
        .from('departments')
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .eq('entity_id', entityId)
        .order('name', { ascending: true })

      if (queryError) throw queryError

      // Buscar contagens em batch para melhor performance
      const deptIds = (data || []).map(d => d.id)
      
      // Buscar contagem de documentos por departamento
      const { data: docCounts } = await supabase
        .from('documents')
        .select('department_id')
        .in('department_id', deptIds)
      
      // Buscar contagem de usuários por departamento
      const { data: userCounts } = await supabase
        .from('user_departments')
        .select('department_id')
        .in('department_id', deptIds)

      // Criar mapas de contagem
      const docCountMap: Record<string, number> = {}
      const userCountMap: Record<string, number> = {}
      
      if (docCounts && Array.isArray(docCounts)) {
        docCounts.forEach((doc: { department_id: string }) => {
          docCountMap[doc.department_id] = (docCountMap[doc.department_id] || 0) + 1
        })
      }
      
      if (userCounts && Array.isArray(userCounts)) {
        userCounts.forEach((user: { department_id: string }) => {
          userCountMap[user.department_id] = (userCountMap[user.department_id] || 0) + 1
        })
      }

      const departmentsWithCounts = (data || []).map(dept => ({
        ...dept,
        manager_name: dept.manager?.full_name || '',
        document_count: docCountMap[dept.id] || 0,
        user_count: userCountMap[dept.id] || 0
      }))

      setDepartments(departmentsWithCounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar departamentos')
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Carregar departamentos quando o usuário mudar
  useEffect(() => {
    if (user?.id) {
      fetchDepartments()
    }
  }, [user?.id, fetchDepartments])

  const createDepartment = useCallback(async (departmentData: Partial<Department>) => {
    try {
      setError(null)

      let entityId = 'ebde2fef-30e2-458b-8721-d86df2f6865b'
      
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

      const { data: department, error: deptError } = await supabase
        .from('departments')
        .insert({
          ...departmentData,
          entity_id: entityId
        })
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .single()

      if (deptError) throw deptError

      if (departmentData.manager_id) {
        const { error: addManagerError } = await supabase
          .rpc('add_manager_to_department', {
            p_department_id: department.id,
            p_manager_id: departmentData.manager_id
          })

        if (addManagerError) {
          await supabase
            .from('user_departments')
            .insert({
              user_id: departmentData.manager_id,
              department_id: department.id,
              role_in_department: 'manager',
              is_primary: true,
              assigned_at: new Date().toISOString()
            })
        }
      }

      await fetchDepartments()
      return department
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar departamento')
      throw err
    }
  }, [user?.id, fetchDepartments])

  const updateDepartment = useCallback(async (id: string, updates: Partial<Department>) => {
    try {
      setError(null)

      const { data: department, error: deptError } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .single()

      if (deptError) throw deptError

      if (updates.manager_id) {
        const { error: addManagerError } = await supabase
          .rpc('add_manager_to_department', {
            p_department_id: id,
            p_manager_id: updates.manager_id
          })

        if (addManagerError) {
          await supabase
            .from('user_departments')
            .insert({
              user_id: updates.manager_id,
              department_id: id,
              role_in_department: 'manager',
              is_primary: true,
              assigned_at: new Date().toISOString()
            })
        }
      }

      await fetchDepartments()
      return department
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar departamento')
      throw err
    }
  }, [fetchDepartments])

  const deleteDepartment = useCallback(async (id: string) => {
    try {
      setError(null)

      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id)

      if (docCount && docCount > 0) {
        throw new Error('Não é possível deletar um departamento que possui documentos')
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchDepartments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar departamento')
      throw err
    }
  }, [fetchDepartments])

  const toggleDepartmentStatus = useCallback(async (id: string) => {
    try {
      setError(null)

      const department = departments.find(d => d.id === id)
      if (!department) throw new Error('Departamento não encontrado')

      const newStatus = department.status === 'active' ? 'inactive' : 'active'

      const { data, error } = await supabase
        .from('departments')
        .update({ status: newStatus })
        .eq('id', id)
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .single()

      if (error) throw error

      await fetchDepartments()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do departamento')
      throw err
    }
  }, [departments, fetchDepartments])

  const assignManager = useCallback(async (id: string, managerId: string) => {
    try {
      setError(null)

      const { data, error } = await supabase
        .from('departments')
        .update({ manager_id: managerId })
        .eq('id', id)
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .single()

      if (error) throw error

      await fetchDepartments()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir gerente')
      throw err
    }
  }, [fetchDepartments])

  return {
    departments,
    loading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus,
    assignManager,
    refetch: fetchDepartments
  }
}
