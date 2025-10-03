import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/auth-context'

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
  // Relacionamentos
  manager_name?: string
  document_count?: number
  user_count?: number
}

export function useDepartments() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchDepartments()
    }
  }, [user?.id])

  // Escutar evento global de atualização de departamentos
  useEffect(() => {
    let isUpdating = false // ✅ Prevenir múltiplas execuções simultâneas
    let updateTimeout: NodeJS.Timeout | null = null // ✅ Debounce para eventos
    let isMounted = true // ✅ Prevenir operações em componentes desmontados
    
    const handleDepartmentsUpdate = () => {
      if (!isMounted || isUpdating) {
        return
      }
      
      // ✅ Debounce: cancelar timeout anterior e aguardar 300ms (aumentado)
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      
      updateTimeout = setTimeout(async () => {
        if (!isMounted) return // ✅ Verificar novamente antes de executar
        
        isUpdating = true
        
        try {
          // ✅ Aguardar um pouco para garantir que operações locais terminem
          await new Promise(resolve => setTimeout(resolve, 100))
          
          if (isMounted) {
            await fetchDepartments()
          }
        } catch (error) {
          console.error('Erro ao recarregar departamentos:', error)
        } finally {
          if (isMounted) {
            isUpdating = false // ✅ Resetar flag apenas se componente ainda montado
          }
        }
      }, 500) // ✅ Aumentado para 500ms para evitar conflitos
    }

    window.addEventListener('departments-updated', handleDepartmentsUpdate)
    return () => {
      isMounted = false // ✅ Marcar como desmontado
      window.removeEventListener('departments-updated', handleDepartmentsUpdate)
      if (updateTimeout) {
        clearTimeout(updateTimeout) // ✅ Limpar timeout ao desmontar
      }
    }
  }, [])

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('departments')
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .order('name', { ascending: true })

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



      // Buscar contagem de documentos e usuários para cada departamento
      const departmentsWithCounts = await Promise.all(
        (data || []).map(async (dept) => {
          // Contar documentos
          const { count: docCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)

                     // Contar usuários do departamento (corrigido para usar user_departments)
          const { count: userCount, error: userError } = await supabase
            .from('user_departments')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)

          if (userError) {
            console.warn(`Erro ao contar usuários do departamento ${dept.name}:`, userError)
          }


          return {
            ...dept,
            manager_name: dept.manager?.full_name || '',
            document_count: docCount || 0,
            user_count: userCount || 0
          }
        })
      )

      setDepartments(departmentsWithCounts)
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar departamentos')
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [user?.id]) // ✅ Dependências do useCallback

  const createDepartment = async (departmentData: Partial<Department>) => {
    try {
      setError(null)

      // ✅ Buscar o profile do usuário para obter entity_id
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

      // ✅ Criar o departamento
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

      // ✅ Se um gerente foi definido, adicionar automaticamente como funcionário
      if (departmentData.manager_id) {
        try {
          // ✅ Tentar usar a função SQL primeiro
          const { error: addManagerError } = await supabase
            .rpc('add_manager_to_department', {
              p_department_id: department.id,
              p_manager_id: departmentData.manager_id
            })

          if (addManagerError) {
            console.warn('⚠️ Aviso: Função SQL não encontrada, usando inserção direta:', addManagerError.message)
            
            // ✅ SOLUÇÃO ALTERNATIVA: Inserir diretamente na tabela user_departments
            const { error: insertError } = await supabase
              .from('user_departments')
              .insert({
                user_id: departmentData.manager_id,
                department_id: department.id,
                role_in_department: 'manager',
                is_primary: true,
                assigned_at: new Date().toISOString()
              })

            if (insertError) {
              console.warn('⚠️ Aviso: Não foi possível adicionar gerente como funcionário:', insertError.message)
            } else {
              console.log('✅ Gerente adicionado como funcionário via inserção direta')
            }
          }
        } catch (managerError) {
          console.warn('⚠️ Aviso: Erro ao adicionar gerente como funcionário:', managerError)
          
          // ✅ SOLUÇÃO ALTERNATIVA: Inserir diretamente na tabela user_departments
          try {
            const { error: insertError } = await supabase
              .from('user_departments')
              .insert({
                user_id: departmentData.manager_id,
                department_id: department.id,
                role_in_department: 'manager',
                is_primary: true,
                assigned_at: new Date().toISOString()
              })

            if (insertError) {
              console.warn('⚠️ Aviso: Não foi possível adicionar gerente como funcionário:', insertError.message)
            } else {
              console.log('✅ Gerente adicionado como funcionário via inserção direta')
            }
          } catch (fallbackError) {
            console.error('❌ Erro crítico: Não foi possível adicionar gerente como funcionário:', fallbackError)
          }
        }
      }

      // ✅ Recarregar departamentos para atualizar contadores
      await fetchDepartments()
      
      return department
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar departamento')
      throw err
    }
  }

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      setError(null)

      // ✅ Atualizar o departamento
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

      // ✅ Se um novo gerente foi definido, adicionar automaticamente como funcionário
      if (updates.manager_id && updates.manager_id !== department.manager_id) {
        try {
          // ✅ Tentar usar a função SQL primeiro
          const { error: addManagerError } = await supabase
            .rpc('add_manager_to_department', {
              p_department_id: id,
              p_manager_id: updates.manager_id
            })

          if (addManagerError) {
            console.warn('⚠️ Aviso: Função SQL não encontrada, usando inserção direta:', addManagerError.message)
            
            // ✅ SOLUÇÃO ALTERNATIVA: Inserir diretamente na tabela user_departments
            const { error: insertError } = await supabase
              .from('user_departments')
              .insert({
                user_id: updates.manager_id,
                department_id: id,
                role_in_department: 'manager',
                is_primary: true,
                assigned_at: new Date().toISOString()
              })

            if (insertError) {
              console.warn('⚠️ Aviso: Não foi possível adicionar novo gerente como funcionário:', insertError.message)
            } else {
              console.log('✅ Novo gerente adicionado como funcionário via inserção direta')
            }
          }
        } catch (managerError) {
          console.warn('⚠️ Aviso: Erro ao adicionar novo gerente como funcionário:', managerError)
          
          // ✅ SOLUÇÃO ALTERNATIVA: Inserir diretamente na tabela user_departments
          try {
            const { error: insertError } = await supabase
              .from('user_departments')
              .insert({
                user_id: updates.manager_id,
                department_id: id,
                role_in_department: 'manager',
                is_primary: true,
                assigned_at: new Date().toISOString()
              })

            if (insertError) {
              console.warn('⚠️ Aviso: Não foi possível adicionar novo gerente como funcionário:', insertError.message)
            } else {
              console.log('✅ Novo gerente adicionado como funcionário via inserção direta')
            }
          } catch (fallbackError) {
            console.error('❌ Erro crítico: Não foi possível adicionar novo gerente como funcionário:', fallbackError)
          }
        }
      }

      // ✅ Recarregar departamentos para atualizar contadores
      await fetchDepartments()
      
      return department
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar departamento')
      throw err
    }
  }

  const deleteDepartment = async (id: string) => {
    try {
      setError(null)

      // Verificar se há documentos usando este departamento
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id)

      if (docCount && docCount > 0) {
        throw new Error('Não é possível deletar um departamento que possui documentos')
      }

      // Nota: Não verificamos usuários pois profiles não tem department_id
      // Se você quiser adicionar essa funcionalidade, precisará adicionar department_id à tabela profiles

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
  }

  const toggleDepartmentStatus = async (id: string) => {
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
  }

  const assignManager = async (id: string, managerId: string) => {
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
  }

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
