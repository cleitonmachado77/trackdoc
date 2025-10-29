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

  by_type: Array<{ type: string; count: number }>
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
          query = query.eq('status', filters.status)
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

      // Processar documentos para incluir URLs de download e lógica de retenção
      const processedDocuments = await Promise.all(
        (data || []).map(async (doc) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('documents')
              .createSignedUrl(doc.file_path, 3600) // 1 hora

            // Calcular se o documento pode ser deletado baseado no período de retenção
            let canDelete = true
            
            // Se o documento não tem tipo de documento associado, pode ser excluído
            if (!doc.document_type_id) {
              canDelete = true
            } else if (doc.retention_end_date) {
              const retentionEndDate = new Date(doc.retention_end_date)
              const now = new Date()
              canDelete = now > retentionEndDate
            } else if (doc.retention_period && doc.retention_period > 0) {
              // Calcular baseado na data de criação + período de retenção
              const createdDate = new Date(doc.created_at)
              const retentionEndDate = new Date(createdDate.getTime() + doc.retention_period * 30 * 24 * 60 * 60 * 1000)
              const now = new Date()
              canDelete = now > retentionEndDate
            } else if (doc.retention_period === 0 || doc.retention_period === null) {
              // Se retention_period é 0 ou null, documento pode ser excluído
              canDelete = true
            }

            return {
              ...doc,
              download_url: urlData?.signedUrl,
              can_delete: canDelete
            }
          } catch (error) {
            console.warn(`Erro ao gerar URL para documento ${doc.id}:`, error)
            return {
              ...doc,
              can_delete: true // Se houver erro, permitir deleção por padrão
            }
          }
        })
      )

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

      let filePath = ''
      let fileName = ''
      let fileSize = 0
      let fileType = ''

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

      const { data, error } = await supabase
        .from('documents')
        .insert(documentToCreate)
        .select()
        .single()

      if (error) {
        console.error('❌ [CREATE_DOCUMENT] Erro ao criar documento:', error)
        throw error
      }

      console.log('✅ [CREATE_DOCUMENT] Documento criado com sucesso:', data.id)

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
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = doc.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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
