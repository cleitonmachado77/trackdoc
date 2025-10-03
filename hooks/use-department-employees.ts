import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'

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
  const { user, entity } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<DepartmentEmployee[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<DepartmentEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entityId = entity?.id || 'ebde2fef-30e2-458b-8721-d86df2f6865b'

  // ✅ Debug: Verificar se entity está sendo carregado corretamente (apenas em dev)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DEBUG] Entity context:', {
        entity: entity,
        entityId: entity?.id,
        fallbackId: 'ebde2fef-30e2-458b-8721-d86df2f6865b',
        finalEntityId: entityId
      })
    }
  }, [entity, entityId])

  // ✅ Função auxiliar para redirecionamento com limpeza de estados
  const redirectWithCleanup = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DEBUG] Aguardando 1 segundo antes de recarregar página...')
    }
    
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Recarregando página para evitar travamento...')
      }
      
      // ✅ Limpar estados antes do redirecionamento
      setEmployees([])
      setAvailableEmployees([])
      setLoading(false)
      setError(null)
      
      // ✅ SOLUÇÃO SIMPLES: Apenas recarregar a página
      // A página principal já tem a lógica para detectar o redirecionamento
      try {
        // ✅ Definir flag no localStorage antes de recarregar
        localStorage.setItem('redirectToDepartments', 'true')
        
        // ✅ Recarregar a página
        window.location.reload()
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao recarregar página:', error)
        // ✅ Fallback: redirecionar para página principal
        window.location.href = '/'
      }
    }, 1000)
  }

  useEffect(() => {
    if (user?.id) {
      fetchEmployees()
      fetchAvailableEmployees()
    }
  }, [user?.id, departmentId])

  const fetchEmployees = async () => {
    if (!departmentId) {
      setEmployees([])
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DEBUG] fetchEmployees - Parâmetros:', {
        departmentId,
        entityId,
        user: user?.id
      })
    }

    try {
      setLoading(true)
      setError(null)

      // Primeiro: buscar os relacionamentos user_departments
      const { data: userDepartmentsData, error: userDeptError } = await supabase
        .from('user_departments')
        .select('*')
        .eq('department_id', departmentId)

      if (userDeptError) throw userDeptError

      if (!userDepartmentsData || userDepartmentsData.length === 0) {
        setEmployees([])
        return
      }

      // Segundo: buscar os perfis dos usuários
      const userIds = userDepartmentsData.map(ud => ud.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .eq('entity_id', entityId)

      if (profilesError) throw profilesError

      // Terceiro: buscar o gerente do departamento
      const { data: departmentData, error: departmentError } = await supabase
        .from('departments')
        .select('manager_id')
        .eq('id', departmentId)
        .single()

      if (departmentError) throw departmentError

      // Combinar os dados
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

      // Ordenar por nome após transformação
      employeesWithManager.sort((a, b) => a.full_name.localeCompare(b.full_name))

      setEmployees(employeesWithManager)
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionários')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableEmployees = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DEBUG] fetchAvailableEmployees - Parâmetros:', {
        entityId,
        departmentId
      })
    }

    try {
      // Buscar funcionários que não estão neste departamento específico
      // mas podem estar em outros departamentos
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('entity_id', entityId)
        .order('full_name', { ascending: true })

      if (error) throw error

      // Filtrar usuários que não estão no departamento atual
      if (departmentId && data) {
        const { data: departmentUsers, error: deptError } = await supabase
          .from('user_departments')
          .select('user_id')
          .eq('department_id', departmentId)

        if (deptError) throw deptError

        const userIdsInDepartment = (departmentUsers || []).map(u => u.user_id)
        const availableUsers = data.filter(profile => !userIdsInDepartment.includes(profile.id))
        setAvailableEmployees(availableUsers)
      } else {
        setAvailableEmployees(data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar funcionários disponíveis:', err)
      setAvailableEmployees([])
    }
  }

  const addEmployeeToDepartment = async (employeeId: string, role: string = 'member', isPrimary: boolean = false) => {
    if (!departmentId) throw new Error('ID do departamento não fornecido')

    try {
      setError(null)
      setLoading(true) // ✅ Adicionar loading específico
      
      // Usar a nova função SQL para adicionar usuário ao departamento
      const { data, error } = await supabase
        .rpc('add_user_to_department', {
          p_user_id: employeeId,
          p_department_id: departmentId,
          p_role_in_department: role,
          p_is_primary: isPrimary,
          p_assigned_by: user?.id || null
        })

      if (error) throw error

      // ✅ IMPORTANTE: Atualizar estados LOCAIS primeiro
      const newEmployee = availableEmployees.find(emp => emp.id === employeeId)
      if (newEmployee) {
        setEmployees(prev => [...prev, {
          ...newEmployee,
          department_id: departmentId,
          role_in_department: role,
          is_primary: isPrimary,
          assigned_at: new Date().toISOString(),
          is_manager: false
        }])
        
        setAvailableEmployees(prev => prev.filter(emp => emp.id !== employeeId))
      }

      // ✅ Executar operações em paralelo para melhor performance
      await Promise.all([
        fetchEmployees(),
        fetchAvailableEmployees()
      ])
      
      // ✅ Aguardar um pouco antes de disparar evento para evitar conflitos
      await new Promise(resolve => setTimeout(resolve, 200)) // ✅ Aumentado para 200ms
      
      // ✅ Disparar evento APENAS UMA VEZ
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Disparando evento departments-updated após adicionar usuário')
      }
      window.dispatchEvent(new CustomEvent('departments-updated'))
      
      // ✅ SOLUÇÃO ALTERNATIVA: Recarregar página automaticamente
      redirectWithCleanup()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar funcionário')
      throw err
    } finally {
      setLoading(false) // ✅ Sempre resetar loading
    }
  }

  const removeEmployeeFromDepartment = async (employeeId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DEBUG] Iniciando remoção de usuário:', employeeId)
    }
    
    try {
      setError(null)
      setLoading(true) // ✅ Adicionar loading específico
      
      // Usar a nova função SQL para remover usuário do departamento
      const { data, error } = await supabase
        .rpc('remove_user_from_department', {
          p_user_id: employeeId,
          p_department_id: departmentId!
        })

      if (error) throw error

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Usuário removido do backend, atualizando estados locais...')
      }

      // ✅ IMPORTANTE: Atualizar estados LOCAIS primeiro
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Estados locais atualizados, recarregando dados...')
      }
      
      // ✅ Executar operações em paralelo para melhor performance
      await Promise.all([
        fetchEmployees(),
        fetchAvailableEmployees()
      ])
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Dados recarregados, aguardando antes do evento...')
      }
      
      // ✅ Aguardar um pouco antes de disparar evento para evitar conflitos
      await new Promise(resolve => setTimeout(resolve, 200)) // ✅ Aumentado para 200ms
      
      // ✅ Disparar evento APENAS UMA VEZ
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Disparando evento departments-updated após remover usuário')
      }
      window.dispatchEvent(new CustomEvent('departments-updated'))
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] ✅ Remoção de usuário concluída com sucesso!')
      }
      
      // ✅ SOLUÇÃO ALTERNATIVA: Recarregar página automaticamente
      redirectWithCleanup()
      
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao remover usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro ao remover funcionário')
      throw err
    } finally {
      setLoading(false) // ✅ Sempre resetar loading
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Loading resetado para false')
      }
    }
  }

  const assignManager = async (employeeId: string) => {
    if (!departmentId) throw new Error('ID do departamento não fornecido')

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DEBUG] Iniciando atribuição de gerente:', employeeId)
    }
    
    try {
      setError(null)
      setLoading(true) // ✅ Adicionar loading específico

      const { error } = await supabase
        .from('departments')
        .update({ manager_id: employeeId })
        .eq('id', departmentId)

      if (error) throw error

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Gerente atribuído no backend, atualizando estado local...')
      }

      // ✅ IMPORTANTE: Atualizar estado LOCAL primeiro
      setEmployees(prev => prev.map(emp => ({
        ...emp,
        is_manager: emp.id === employeeId
      })))

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Estado local atualizado, recarregando dados...')
      }

      // ✅ Executar operações em paralelo
      await Promise.all([
        fetchEmployees(),
        fetchAvailableEmployees()
      ])
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Dados recarregados, aguardando antes do evento...')
      }
      
      // ✅ Aguardar um pouco antes de disparar evento para evitar conflitos
      await new Promise(resolve => setTimeout(resolve, 200)) // ✅ Aumentado para 200ms
      
      // ✅ Disparar evento para atualizar departamentos
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Disparando evento departments-updated após atribuir gerente')
      }
      window.dispatchEvent(new CustomEvent('departments-updated'))
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] ✅ Atribuição de gerente concluída com sucesso!')
      }
      
      // ✅ SOLUÇÃO ALTERNATIVA: Recarregar página automaticamente
      redirectWithCleanup()
      
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao atribuir gerente:', err)
      throw err
    } finally {
      setLoading(false) // ✅ Sempre resetar loading
      console.log('🔄 [DEBUG] Loading resetado para false')
    }
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
