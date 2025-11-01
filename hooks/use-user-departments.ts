import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface UserDepartment {
  id: string
  name: string
  description?: string
  isPrimary: boolean
  roleInDepartment?: string
}



export function useUserDepartments() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState<UserDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchUserDepartments()
    } else {
      setDepartments([])
      setLoading(false)
    }
  }, [user?.id])

  const fetchUserDepartments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar departamento primário do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          department_id,
          department:departments!profiles_department_id_fkey(
            id,
            name,
            description
          )
        `)
        .eq('id', user!.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // Buscar departamentos adicionais do usuário
      const { data: userDepartments, error: deptError } = await supabase
        .from('user_departments')
        .select(`
          role_in_department,
          department:departments(
            id,
            name,
            description
          )
        `)
        .eq('user_id', user!.id)

      if (deptError) throw deptError

      // Combinar departamentos
      const allDepartments: UserDepartment[] = []

      // Adicionar departamento primário
      if (userProfile?.department) {
        const dept = userProfile.department as any
        allDepartments.push({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          isPrimary: true
        })
      }

      // Adicionar departamentos adicionais
      if (userDepartments) {
        for (const ud of userDepartments) {
          if (ud.department) {
            const dept = ud.department as any
            // Verificar se já não foi adicionado como primário
            const exists = allDepartments.find(d => d.id === dept.id)
            if (!exists) {
              allDepartments.push({
                id: dept.id,
                name: dept.name,
                description: dept.description,
                isPrimary: false,
                roleInDepartment: ud.role_in_department
              })
            } else {
              // Se já existe como primário, adicionar o papel
              exists.roleInDepartment = ud.role_in_department
            }
          }
        }
      }

      setDepartments(allDepartments)
    } catch (err) {
      console.error('Erro ao buscar departamentos do usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar departamentos')
    } finally {
      setLoading(false)
    }
  }

  const getDepartmentIds = () => {
    return departments.map(d => d.id)
  }

  const getPrimaryDepartment = () => {
    return departments.find(d => d.isPrimary)
  }

  const getAdditionalDepartments = () => {
    return departments.filter(d => !d.isPrimary)
  }

  const isInDepartment = (departmentId: string) => {
    return departments.some(d => d.id === departmentId)
  }

  const getDepartmentRole = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId)
    return dept?.roleInDepartment
  }

  return {
    departments,
    loading,
    error,
    getDepartmentIds,
    getPrimaryDepartment,
    getAdditionalDepartments,
    isInDepartment,
    getDepartmentRole,
    refetch: fetchUserDepartments
  }
}