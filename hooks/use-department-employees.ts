import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface DepartmentEmployee {
  id: string
  full_name: string
  email: string
  role: string
  entity_id: string
  department_id?: string
  created_at: string
  updated_at: string
  is_manager?: boolean
  role_in_department?: string
  is_primary?: boolean
  assigned_at?: string
}

export function useDepartmentEmployees(departmentId?: string) {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<DepartmentEmployee[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<DepartmentEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityId, setEntityId] = useState<string | null | undefined>(undefined)

  // Buscar entity_id do perfil do usuário
  useEffect(() => {
    const fetchUserEntityId = async () => {
      if (!user?.id) {
        setEntityId(null)
        return
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('entity_id')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setEntityId(null)
          return
        }

        setEntityId(profileData?.entity_id || null)
      } catch {
        setEntityId(null)
      }
    }

    fetchUserEntityId()
  }, [user?.id])

  useEffect(() => {
    if (user?.id && entityId !== undefined) {
      fetchEmployees()
      fetchAvailableEmployees()
    }
  }, [user?.id, departmentId, entityId])

  const fetchEmployees = useCallback(async () => {
    if (!departmentId) {
      setEmployees([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: userDepartmentsData, error: userDeptError } = await supabase
        .from('user_departments')
        .select('*')
        .eq('department_id', departmentId)

      if (userDeptError) throw userDeptError

      if (!userDepartmentsData || userDepartmentsData.length === 0) {
        setEmployees([])
        setLoading(false)
        return
      }

      const userIds = userDepartmentsData.map(ud => ud.user_id)
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (entityId) {
        profilesQuery = profilesQuery.eq('entity_id', entityId)
      } else {
        profilesQuery = profilesQuery.is('entity_id', null)
      }

      const { data: profilesData, error: profilesError } = await profilesQuery

      if (profilesError) throw profilesError

      const { data: departmentData, error: departmentError } = await supabase
        .from('departments')
        .select('manager_id')
        .eq('id', departmentId)
        .single()

      if (departmentError) throw departmentError

      const employeesWithManager: DepartmentEmployee[] = profilesData.map(profile => {
        const userDept = userDepartmentsData.find(ud => ud.user_id === profile.id)
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          entity_id: profile.entity_id,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          department_id: departmentId,
          role_in_department: userDept?.role_in_department || 'member',
          is_primary: userDept?.is_primary || false,
          assigned_at: userDept?.assigned_at || null,
          is_manager: profile.id === departmentData?.manager_id
        }
      })

      employeesWithManager.sort((a, b) => a.full_name.localeCompare(b.full_name))
      setEmployees(employeesWithManager)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionários')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [departmentId, entityId])

  const fetchAvailableEmployees = useCallback(async () => {
    try {
      let availableQuery = supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (entityId) {
        availableQuery = availableQuery.eq('entity_id', entityId)
      } else {
        availableQuery = availableQuery.is('entity_id', null)
      }

      const { data, error } = await availableQuery

      if (error) throw error

      let filteredData = data || []
      if (entityId && filteredData.length > 0) {
        filteredData = filteredData.filter(profile => profile.entity_id === entityId)
      }

      if (departmentId && filteredData.length > 0) {
        const { data: departmentUsers, error: deptError } = await supabase
          .from('user_departments')
          .select('user_id')
          .eq('department_id', departmentId)

        if (deptError) throw deptError

        const userIdsInDepartment = (departmentUsers || []).map(u => u.user_id)
        const availableUsers = filteredData.filter(profile => !userIdsInDepartment.includes(profile.id))
        
        setAvailableEmployees(availableUsers)
      } else {
        setAvailableEmployees(filteredData)
      }
    } catch {
      setAvailableEmployees([])
    }
  }, [departmentId, entityId])


  const addEmployeeToDepartment = async (
    employeeId: string,
    role: string = 'member',
    isPrimary: boolean = false
  ) => {
    if (!departmentId) throw new Error('ID do departamento não fornecido')

    const { error } = await supabase.rpc('add_user_to_department', {
      p_user_id: employeeId,
      p_department_id: departmentId,
      p_role_in_department: role,
      p_is_primary: isPrimary,
      p_assigned_by: user?.id || null
    })

    if (error) throw error
  }

  const removeEmployeeFromDepartment = async (employeeId: string) => {
    if (!departmentId) throw new Error('ID do departamento não fornecido')

    const { error } = await supabase.rpc('remove_user_from_department', {
      p_user_id: employeeId,
      p_department_id: departmentId
    })

    if (error) throw error
  }

  const assignManager = async (employeeId: string) => {
    if (!departmentId) throw new Error('ID do departamento não fornecido')

    const { error } = await supabase
      .from('departments')
      .update({ manager_id: employeeId })
      .eq('id', departmentId)

    if (error) throw error
  }

  return {
    employees,
    availableEmployees,
    loading,
    error,
    addEmployeeToDepartment,
    removeEmployeeFromDepartment,
    assignManager,
    refetch: fetchEmployees
  }
}
