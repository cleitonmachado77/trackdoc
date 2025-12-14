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

      if (!user?.id) {
        setDepartments([])
        return
      }

      // Buscar entity_id do usuário
      let entityId: string | null = null
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()
      
      if (profileData?.entity_id) {
        entityId = profileData.entity_id
      }

      // Buscar departamentos
      let query = supabase
        .from('departments')
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
      
      if (entityId) {
        // Usuário com entidade - buscar por entity_id
        query = query.eq('entity_id', entityId)
      } else {
        // Usuário solo - buscar departamentos criados por ele
        query = query.is('entity_id', null).eq('created_by', user.id)
      }

      const { data, error: queryError } = await query.order('name', { ascending: true })

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

      console.log('🚀 [createDepartment] Iniciando criação de departamento:', departmentData)
      console.log('👤 [createDepartment] User ID:', user?.id)

      if (!user?.id) {
        throw new Error('Usuário não autenticado. Por favor, faça login novamente.')
      }

      // Buscar entity_id do usuário (pode ser null para usuários solo)
      let entityId: string | null = null
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()
      
      console.log('📋 [createDepartment] Profile data:', profileData, 'Error:', profileError)
      
      if (profileData?.entity_id) {
        entityId = profileData.entity_id
      }

      console.log('🏢 [createDepartment] Entity ID:', entityId, '(usuário solo:', !entityId, ')')

      // Verificar se já existe um departamento com o mesmo nome
      const normalizedName = (departmentData.name || '').trim().toLowerCase()
      
      // Buscar departamentos existentes
      let query = supabase
        .from('departments')
        .select('id, name, status')
      
      if (entityId) {
        // Usuário com entidade - buscar por entity_id
        query = query.eq('entity_id', entityId)
        console.log('🔍 [createDepartment] Verificando departamentos existentes para entity_id:', entityId)
      } else {
        // Usuário solo - buscar departamentos criados por ele
        query = query.is('entity_id', null).eq('created_by', user.id)
        console.log('🔍 [createDepartment] Verificando departamentos existentes para usuário solo (created_by:', user.id, ')')
      }

      const { data: existingDepartments, error: checkError } = await query

      console.log('📊 [createDepartment] Departamentos existentes:', existingDepartments)

      if (checkError) {
        console.error('❌ [createDepartment] Erro ao verificar departamentos:', checkError)
        throw checkError
      }

      // Verificar manualmente para garantir comparação case-insensitive
      const existingDepartment = existingDepartments?.find(
        dept => dept.name.toLowerCase().trim() === normalizedName
      )

      if (existingDepartment) {
        console.log('⚠️ [createDepartment] Departamento duplicado encontrado:', existingDepartment)
        if (existingDepartment.status === 'active') {
          throw new Error(`Já existe um departamento ativo com o nome "${departmentData.name}".`)
        } else {
          throw new Error(`Já existe um departamento inativo com o nome "${departmentData.name}". Para reutilizar este nome, primeiro exclua permanentemente o departamento anterior ou reative-o.`)
        }
      }

      // Preparar dados para inserção, removendo campos vazios ou inválidos
      const insertData: Record<string, any> = {
        name: departmentData.name,
        status: departmentData.status || 'active',
        created_by: user.id
      }

      // Adicionar entity_id apenas se o usuário tiver uma entidade
      if (entityId) {
        insertData.entity_id = entityId
      }
      // Para usuários solo, entity_id será NULL (permitido pela tabela)

      // Adicionar campos opcionais apenas se tiverem valor
      if (departmentData.description && departmentData.description.trim()) {
        insertData.description = departmentData.description.trim()
      }
      
      if (departmentData.manager_id && departmentData.manager_id.trim()) {
        insertData.manager_id = departmentData.manager_id
      }

      console.log('📝 [createDepartment] Inserindo departamento:', insertData)

      const { data: department, error: deptError } = await supabase
        .from('departments')
        .insert(insertData)
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .single()

      if (deptError) {
        console.error('❌ [createDepartment] Erro ao criar departamento:', {
          code: deptError.code,
          message: deptError.message,
          details: deptError.details,
          hint: deptError.hint
        })
        
        // Tratar erro de conflito (409) - nome duplicado
        if (deptError.code === '23505' || deptError.message?.includes('duplicate') || deptError.message?.includes('unique')) {
          throw new Error(`Já existe um departamento com o nome "${departmentData.name}". Por favor, escolha outro nome. (Erro: ${deptError.message})`)
        }
        throw new Error(deptError.message || 'Erro ao criar departamento')
      }
      
      console.log('✅ [createDepartment] Departamento criado:', department)

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

      // Se está atualizando o nome, verificar se já existe outro departamento com o mesmo nome
      if (updates.name && user?.id) {
        // Buscar entity_id do usuário
        let entityId: string | null = null
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('entity_id')
          .eq('id', user.id)
          .single()
        
        if (profileData?.entity_id) {
          entityId = profileData.entity_id
        }

        const normalizedName = updates.name.trim().toLowerCase()
        
        // Buscar departamentos existentes
        let query = supabase
          .from('departments')
          .select('id, name, status')
          .neq('id', id) // Excluir o próprio departamento da verificação
        
        if (entityId) {
          query = query.eq('entity_id', entityId)
        } else {
          query = query.is('entity_id', null).eq('created_by', user.id)
        }

        const { data: existingDepartments, error: checkError } = await query

        if (checkError) throw checkError

        // Verificar manualmente para garantir comparação case-insensitive
        const existingDepartment = existingDepartments?.find(
          dept => dept.name.toLowerCase().trim() === normalizedName
        )

        if (existingDepartment) {
          if (existingDepartment.status === 'active') {
            throw new Error(`Já existe um departamento ativo com o nome "${updates.name}".`)
          } else {
            throw new Error(`Já existe um departamento inativo com o nome "${updates.name}". Para reutilizar este nome, primeiro exclua permanentemente o departamento anterior ou reative-o.`)
          }
        }
      }

      // Preparar dados para atualização, tratando campos vazios
      const updateData: Record<string, any> = {}

      if (updates.name !== undefined) {
        updateData.name = updates.name
      }
      
      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null
      }
      
      if (updates.status !== undefined) {
        updateData.status = updates.status
      }
      
      // Para manager_id, string vazia significa remover o gerente (null)
      if (updates.manager_id !== undefined) {
        updateData.manager_id = updates.manager_id?.trim() || null
      }

      const { data: department, error: deptError } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .single()

      if (deptError) throw deptError

      if (updates.manager_id && updates.manager_id.trim()) {
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
