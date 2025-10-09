import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-unified-auth'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface DocumentPermission {
  id: string
  document_id: string
  department_id?: string
  user_id?: string
  permission_type: 'read' | 'edit' | 'upload' | 'sign' | 'download' | 'approve' | 'reject'
  granted_by: string
  granted_at: string
  expires_at?: string
  // Relacionamentos
  department?: {
    id: string
    name: string
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
  granted_by_user?: {
    id: string
    full_name: string
    email: string
  }
}

export function useDocumentPermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<DocumentPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar permissões de um documento
  const fetchDocumentPermissions = async (documentId: string): Promise<DocumentPermission[]> => {
    try {
      const { data, error } = await supabase
        .from('document_permissions')
        .select(`
          *,
          department:departments(
            id,
            name
          ),
          user:profiles!document_permissions_user_id_fkey(
            id,
            full_name,
            email
          ),
          granted_by_user:profiles!document_permissions_granted_by_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('document_id', documentId)
        .order('granted_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Erro ao buscar permissões do documento:', err)
      return []
    }
  }

  // Buscar todas as permissões do usuário
  const fetchUserPermissions = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Buscar permissões diretas do usuário
      const { data: userPermissions, error: userError } = await supabase
        .from('document_permissions')
        .select(`
          *,
          department:departments(
            id,
            name
          ),
          user:profiles!document_permissions_user_id_fkey(
            id,
            full_name,
            email
          ),
          granted_by_user:profiles!document_permissions_granted_by_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('user_id', user.id)
        .order('granted_at', { ascending: false })

      if (userError) throw userError

      // Buscar permissões dos departamentos do usuário
      const { data: userDepartments } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', user.id)

      let departmentPermissions: any[] = []
      if (userDepartments && userDepartments.length > 0) {
        const departmentIds = userDepartments.map(ud => ud.department_id)
        
        const { data: deptPermissions, error: deptError } = await supabase
          .from('document_permissions')
          .select(`
            *,
            department:departments(
              id,
              name
            ),
            user:profiles!document_permissions_user_id_fkey(
              id,
              full_name,
              email
            ),
            granted_by_user:profiles!document_permissions_granted_by_fkey(
              id,
              full_name,
              email
            )
          `)
          .in('department_id', departmentIds)
          .order('granted_at', { ascending: false })

        if (deptError) throw deptError
        departmentPermissions = deptPermissions || []
      }

      // Combinar e remover duplicatas
      const allPermissions = [...(userPermissions || []), ...departmentPermissions]
      const uniquePermissions = allPermissions.filter((permission, index, self) => 
        index === self.findIndex(p => p.id === permission.id)
      )

      setPermissions(uniquePermissions)
    } catch (err) {
      console.error('Erro ao buscar permissões do usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar permissões')
    } finally {
      setLoading(false)
    }
  }

  // Conceder permissão
  const grantPermission = async (permissionData: {
    document_id: string
    department_id?: string
    user_id?: string
    permission_type: DocumentPermission['permission_type']
    expires_at?: string
  }): Promise<DocumentPermission | null> => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const { data, error } = await supabase
        .from('document_permissions')
        .insert({
          ...permissionData,
          granted_by: user.id
        })
        .select(`
          *,
          department:departments(
            id,
            name
          ),
          user:profiles!document_permissions_user_id_fkey(
            id,
            full_name,
            email
          ),
          granted_by_user:profiles!document_permissions_granted_by_fkey(
            id,
            full_name,
            email
          )
        `)
        .single()

      if (error) throw error

      setPermissions(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Erro ao conceder permissão:', err)
      throw err
    }
  }

  // Revogar permissão
  const revokePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('document_permissions')
        .delete()
        .eq('id', permissionId)

      if (error) throw error

      setPermissions(prev => prev.filter(p => p.id !== permissionId))
    } catch (err) {
      console.error('Erro ao revogar permissão:', err)
      throw err
    }
  }

  // Verificar se usuário tem permissão específica
  const checkPermission = async (
    documentId: string, 
    permissionType: DocumentPermission['permission_type']
  ): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('check_document_permission', {
        p_document_id: documentId,
        p_user_id: user.id,
        p_permission_type: permissionType
      })

      if (error) throw error

      return data || false
    } catch (err) {
      console.error('Erro ao verificar permissão:', err)
      return false
    }
  }

  // Verificar múltiplas permissões
  const checkMultiplePermissions = async (
    documentId: string, 
    permissionTypes: DocumentPermission['permission_type'][]
  ): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {}
    
    for (const permissionType of permissionTypes) {
      results[permissionType] = await checkPermission(documentId, permissionType)
    }
    
    return results
  }

  // Buscar documentos que o usuário tem permissão específica
  const fetchDocumentsWithPermission = async (
    permissionType: DocumentPermission['permission_type']
  ): Promise<any[]> => {
    if (!user) return []

    try {
      // Buscar permissões diretas do usuário
      const { data: userPermissions, error: userError } = await supabase
        .from('document_permissions')
        .select(`
          document_id,
          documents!inner(
            id,
            title,
            status,
            created_at,
            author_id,
            author:profiles!documents_author_id_fkey(
              id,
              full_name,
              email
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('permission_type', permissionType)

      if (userError) throw userError

      // Buscar permissões dos departamentos do usuário
      const { data: userDepartments } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', user.id)

      let departmentPermissions: any[] = []
      if (userDepartments && userDepartments.length > 0) {
        const departmentIds = userDepartments.map(ud => ud.department_id)
        
        const { data: deptPermissions, error: deptError } = await supabase
          .from('document_permissions')
          .select(`
            document_id,
            documents!inner(
              id,
              title,
              status,
              created_at,
              author_id,
              author:profiles!documents_author_id_fkey(
                id,
                full_name,
                email
              )
            )
          `)
          .in('department_id', departmentIds)
          .eq('permission_type', permissionType)

        if (deptError) throw deptError
        departmentPermissions = deptPermissions || []
      }

      // Combinar e remover duplicatas
      const allPermissions = [...(userPermissions || []), ...departmentPermissions]
      const uniquePermissions = allPermissions.filter((permission, index, self) => 
        index === self.findIndex(p => p.document_id === permission.document_id)
      )

      return uniquePermissions.map(p => p.documents)
    } catch (err) {
      console.error('Erro ao buscar documentos com permissão:', err)
      return []
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserPermissions()
    }
  }, [user])

  return {
    permissions,
    loading,
    error,
    fetchDocumentPermissions,
    fetchUserPermissions,
    grantPermission,
    revokePermission,
    checkPermission,
    checkMultiplePermissions,
    fetchDocumentsWithPermission
  }
}
