import { useCallback, useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Document {
  id: string
  title: string
  description?: string
  file_path: string
  file_name?: string
  file_type?: string
  file_size: number
  document_number?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  is_public: boolean
  version: number
  created_at: string
  updated_at: string
  author_id: string
  category_id?: string
  document_type_id?: string
  department_id?: string
  entity_id?: string
  download_url?: string
  retention_period?: number
  retention_end_date?: string
  approval_required?: boolean
  can_delete?: boolean
  author?: { full_name: string }
  category?: { name: string; color: string }
  document_type?: { name: string; color: string }
  department?: { name: string }
  entity?: { name: string; legal_name?: string }
}

export interface DocumentFilters {
  search?: string
  status?: string
  category_id?: string
  document_type_id?: string
  department_id?: string
  author_id?: string
  is_public?: boolean
  date_from?: string
  date_to?: string
}

export interface DocumentStats {
  total: number
  by_status: Array<{ status: string; count: number }>
  by_category: Array<{ category: string; count: number }>
  by_type: Array<{ type: string; count: number }>
  by_department: Array<{ department: string; count: number }>
  by_author: Array<{ author: string; count: number }>
}

export function useDocuments(filters: DocumentFilters = {}) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEntityId, setUserEntityId] = useState<string | null | undefined>(undefined)

  const getUserEntityId = useCallback(async (): Promise<string | null> => {
    if (!user?.id) {
      return null
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.warn('Erro ao buscar entity_id do perfil:', profileError)
        return null
      }

      return profileData?.entity_id ?? null
    } catch (err) {
      console.warn('Erro inesperado ao buscar entity_id do perfil:', err)
      return null
    }
  }, [user?.id])

  const filterDocumentsByPermissions = useCallback(async (documents: any[], userId: string, entityId: string | null): Promise<any[]> => {
    try {
      // Se o usuário não tem entidade, só pode ver seus próprios documentos
      if (!entityId) {
        return documents.filter(doc => doc.author_id === userId)
      }

      // Otimização: Buscar dados do usuário em uma única query
      const [userProfileResult, userDepartmentsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('department_id')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_departments')
          .select('department_id')
          .eq('user_id', userId)
      ])

      // Combinar departamentos
      let userDepartmentIds = userDepartmentsResult.data?.map(ud => ud.department_id) || []
      if (userProfileResult.data?.department_id) {
        userDepartmentIds.push(userProfileResult.data.department_id)
      }
      userDepartmentIds = [...new Set(userDepartmentIds)]

      // Separar documentos por tipo
      const userDocuments = documents.filter(doc => doc.author_id === userId)
      const publicDocuments = documents.filter(doc => doc.is_public && doc.author_id !== userId)
      const privateDocuments = documents.filter(doc => !doc.is_public && doc.author_id !== userId)

      // Se não há documentos privados, retornar rapidamente
      if (privateDocuments.length === 0) {
        return [...userDocuments, ...publicDocuments]
      }

      // Buscar RESTRIÇÕES para documentos privados (não permissões)
      // A lógica é: documentos da entidade são visíveis por padrão, 
      // EXCETO se houver restrições específicas que excluam o usuário
      const privateDocIds = privateDocuments.map(doc => doc.id)
      
      // Buscar todas as permissões de leitura para esses documentos
      const { data: allPermissions } = await supabase
        .from('document_permissions')
        .select('document_id, user_id, department_id')
        .in('document_id', privateDocIds)
        .eq('permission_type', 'read')

      // Criar mapa de documentos que TÊM restrições (possuem permissões específicas)
      const docsWithRestrictions = new Set<string>()
      const allowedRestrictedDocs = new Set<string>()

      if (allPermissions && allPermissions.length > 0) {
        // Agrupar permissões por documento
        const permissionsByDoc = new Map<string, typeof allPermissions>()
        allPermissions.forEach(perm => {
          if (!permissionsByDoc.has(perm.document_id)) {
            permissionsByDoc.set(perm.document_id, [])
          }
          permissionsByDoc.get(perm.document_id)!.push(perm)
        })

        // Para cada documento com permissões, verificar se o usuário tem acesso
        permissionsByDoc.forEach((perms, docId) => {
          docsWithRestrictions.add(docId)
          
          // Verificar se o usuário tem permissão direta ou por departamento
          const hasAccess = perms.some(perm => 
            perm.user_id === userId || 
            (perm.department_id && userDepartmentIds.includes(perm.department_id))
          )
          
          if (hasAccess) {
            allowedRestrictedDocs.add(docId)
          }
        })
      }

      // Filtrar documentos privados:
      // - Se não tem restrições (não está em docsWithRestrictions): permitir (visível para toda entidade)
      // - Se tem restrições: só permitir se está em allowedRestrictedDocs
      const allowedPrivateDocuments = privateDocuments.filter(doc => 
        !docsWithRestrictions.has(doc.id) || allowedRestrictedDocs.has(doc.id)
      )

      return [...userDocuments, ...publicDocuments, ...allowedPrivateDocuments]
    } catch (error) {
      console.error('Erro ao filtrar documentos por permissões:', error)
      return documents // Em caso de erro, retornar todos os documentos
    }
  }, [])

  const fetchDocuments = useCallback(async () => {
    if (!user?.id) {
      setDocuments([])
      setStats(null)
      setLoading(false)
      setUserEntityId(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const entityId = await getUserEntityId()
      setUserEntityId(entityId)

      // Buscar documentos (sem excluir automaticamente os que fazem parte de processos)
      let query = supabase
        .from('documents')
        .select(`
          *,
          author:profiles!documents_author_id_fkey(full_name),
          category:categories!documents_category_id_fkey(name, color),
          document_type:document_types!documents_document_type_id_fkey(name, color),
          department:departments!documents_department_id_fkey(name),
          entity:entities!documents_entity_id_fkey(name, legal_name)
        `)
        .order('created_at', { ascending: false })

        if (entityId) {
          query = query.eq('entity_id', entityId)
        } else {
          // Usuários individuais só veem seus próprios documentos
          query = query.eq('author_id', user.id)
        }

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`)
        }
        if (filters.status) {
          if (filters.status === 'no_approval') {
            // Filtrar documentos que não requerem aprovação
            query = query.eq('approval_required', false)
          } else {
            query = query.eq('status', filters.status)
          }
        }
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id)
        }
        if (filters.document_type_id) {
          query = query.eq('document_type_id', filters.document_type_id)
        }
        if (filters.department_id) {
          query = query.eq('department_id', filters.department_id)
        }
        if (filters.author_id) {
          query = query.eq('author_id', filters.author_id)
        }
        if (filters.is_public !== undefined) {
          query = query.eq('is_public', filters.is_public)
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from)
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to)
        }

      const { data, error } = await query

      if (error) throw error

      // Filtrar documentos baseado em permissões
      const filteredData = await filterDocumentsByPermissions(data || [], user.id, entityId)

      // Otimização: Processar documentos sem gerar URLs desnecessariamente
      // URLs serão geradas apenas quando necessário (no download)
      const processedDocuments = filteredData.map((doc) => {
        // Calcular se o documento pode ser deletado baseado no período de retenção
        let canDelete = true
        
        if (!doc.document_type_id) {
          canDelete = true
        } else if (doc.retention_end_date) {
          const retentionEndDate = new Date(doc.retention_end_date)
          const now = new Date()
          canDelete = now > retentionEndDate
        } else if (doc.retention_period && doc.retention_period > 0) {
          const createdDate = new Date(doc.created_at)
          const retentionEndDate = new Date(createdDate.getTime() + doc.retention_period * 30 * 24 * 60 * 60 * 1000)
          const now = new Date()
          canDelete = now > retentionEndDate
        } else if (doc.retention_period === 0 || doc.retention_period === null) {
          canDelete = true
        }

        return {
          ...doc,
          can_delete: canDelete
        }
      })

      setDocuments(processedDocuments)

      const stats: DocumentStats = {
        total: processedDocuments.length,
        by_status: [
          { status: 'draft', count: processedDocuments.filter(d => d.status === 'draft').length },
          { status: 'pending_approval', count: processedDocuments.filter(d => d.status === 'pending_approval').length },
          { status: 'approved', count: processedDocuments.filter(d => d.status === 'approved').length },
          { status: 'rejected', count: processedDocuments.filter(d => d.status === 'rejected').length },
        ],
        by_category: [],
        by_type: [],
        by_department: [],
        by_author: []
      }

      setStats(stats)

    } catch (err: any) {
      console.error('Erro ao buscar documentos:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [
    user?.id,
    getUserEntityId,
    filters.search,
    filters.status,
    filters.category_id,
    filters.document_type_id,
    filters.department_id,
    filters.author_id,
    filters.is_public,
    filters.date_from,
    filters.date_to
  ])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Função sobrecarregada para criar documento com arquivo
  const createDocument = async (documentData: Partial<Document>, file?: File) => {
    try {
      console.log('🚀 [CREATE_DOCUMENT] Iniciando criação de documento:', { documentData, hasFile: !!file })

      let filePath = documentData.file_path || ''
      let fileName = documentData.file_name || ''
      let fileSize = documentData.file_size || 0
      let fileType = documentData.file_type || ''

      // Se há arquivo, fazer upload primeiro
      if (file) {
        console.log('📁 [CREATE_DOCUMENT] Fazendo upload do arquivo:', file.name)
        
        // Gerar nome único para o arquivo
        const fileExtension = file.name.split('.').pop()
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
        filePath = `documents/${user?.id}/${uniqueFileName}`
        
        // Fazer upload do arquivo
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) {
          console.error('❌ [CREATE_DOCUMENT] Erro no upload:', uploadError)
          throw uploadError
        }

        console.log('✅ [CREATE_DOCUMENT] Upload concluído:', filePath)
        
        fileName = file.name
        fileSize = file.size
        fileType = file.type
      }

      // Criar documento no banco
      let entityId = userEntityId

      if (entityId === undefined) {
        entityId = await getUserEntityId()
        setUserEntityId(entityId)
      }

      const documentToCreate: Partial<Document> & {
        author_id?: string
        file_path: string
        file_name: string
        file_size: number
        file_type: string
      } = {
        ...documentData,
        author_id: user?.id,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType
      }

      if (!documentToCreate.entity_id && entityId) {
        documentToCreate.entity_id = entityId
      }

      console.log('💾 [CREATE_DOCUMENT] Criando documento no banco:', documentToCreate)

      // Remover document_number se foi fornecido, pois será gerado automaticamente pelo banco
      const { document_number, ...documentWithoutNumber } = documentToCreate as any
      
      const { data, error } = await supabase
        .from('documents')
        .insert(documentWithoutNumber)
        .select()
        .single()

      if (error) {
        console.error('❌ [CREATE_DOCUMENT] Erro ao criar documento:', error)
        console.error('❌ [CREATE_DOCUMENT] Código do erro:', error.code)
        console.error('❌ [CREATE_DOCUMENT] Mensagem:', error.message)
        console.error('❌ [CREATE_DOCUMENT] Detalhes:', error.details)
        console.error('❌ [CREATE_DOCUMENT] Hint:', error.hint)
        
        // Se for erro 409 (conflict), pode ser problema com document_number
        if (error.code === '23505') { // Unique violation
          throw new Error('Já existe um documento com este número. Por favor, tente novamente.')
        }
        
        throw error
      }

      console.log('✅ [CREATE_DOCUMENT] Documento criado com sucesso:', data.id, 'Número:', data.document_number)

      // Garantir que o documento recém-criado mantenha os relacionamentos e filtros de entidade
      const normalizedDocument: Document = {
        ...(data as Document),
        author: data.author ?? undefined,
        category: data.category ?? undefined,
        document_type: data.document_type ?? undefined,
        department: data.department ?? undefined,
        entity: data.entity ?? undefined
      }

      setDocuments(prev => [normalizedDocument, ...prev])
      return data
    } catch (error: any) {
      console.error('❌ [CREATE_DOCUMENT] Erro ao criar documento:', error)
      throw error
    }
  }

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setDocuments(prev => prev.map(doc => doc.id === id ? data : doc))
      return data
    } catch (error: any) {
      console.error('Erro ao atualizar documento:', error)
      throw error
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDocuments(prev => prev.filter(doc => doc.id !== id))
    } catch (error: any) {
      console.error('Erro ao excluir documento:', error)
      throw error
    }
  }

  const changeDocumentStatus = async (id: string, status: Document['status']) => {
    return updateDocument(id, { status })
  }

  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600)

      if (error) throw error

      if (data?.signedUrl) {
        // Debug: verificar dados do documento
        console.log('🔍 Debug download:', {
          title: doc.title,
          file_name: doc.file_name,
          file_path: doc.file_path
        })
        
        // Obter a extensão do arquivo original
        const fileExtension = doc.file_name?.split('.').pop() || 'pdf'
        const fileName = `${doc.title}.${fileExtension}`
        
        console.log('📥 Nome do arquivo para download:', fileName)
        
        // Tentar download direto primeiro
        try {
          const response = await fetch(data.signedUrl)
          const blob = await response.blob()
          
          // Criar URL do blob
          const blobUrl = window.URL.createObjectURL(blob)
          
          // Criar link para download
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = fileName
          link.style.display = 'none'
          
          // Adicionar ao DOM, clicar e remover
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // Limpar URL do blob
          window.URL.revokeObjectURL(blobUrl)
          
        } catch (fetchError) {
          console.warn('Fetch falhou, tentando método alternativo:', fetchError)
          
          // Fallback: abrir em nova aba
          window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
        }
        
        console.log('📥 Download iniciado:', fileName)
      }
    } catch (error: any) {
      console.error('Erro ao baixar documento:', error)
      throw error
    }
  }

  const refetch = fetchDocuments

  return {
    documents,
    stats,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    changeDocumentStatus,
    downloadDocument,
    refetch
  }
}
