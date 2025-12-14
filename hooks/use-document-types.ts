import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from '@/lib/hooks/use-auth-final'

interface DocumentType {
  id: string
  name: string
  description: string | null
  prefix: string
  color: string
  requiredFields: string[]
  approvalRequired: boolean
  retentionPeriod: number
  status: "active" | "inactive"
  template: string | null
}

export function useDocumentTypes() {
  const { user } = useAuth()
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Função para forçar recarregamento
  const refetch = useCallback(() => {
    console.log("🔄 [useDocumentTypes] Forçando recarregamento...")
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const fetchDocumentTypes = useCallback(async () => {
      if (!user?.id) {
        setDocumentTypes([])
        setLoading(false)
        return
      }

      console.log("🔄 [useDocumentTypes] Carregando tipos de documento... (trigger:", refreshTrigger, ")")

      try {
        setLoading(true)
        setError(null)

        // Buscar a entidade do usuário
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("entity_id")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Erro ao buscar perfil do usuário:", profileError)
          throw profileError
        }

        // Buscar tipos de documento da entidade do usuário OU sem entidade (criados por usuários únicos)
        let query = supabase
          .from("document_types")
          .select(`
            id,
            name,
            description,
            prefix,
            color,
            required_fields,
            approval_required,
            retention_period,
            status,
            template
          `)
          .eq("status", "active")
          .order("name")

        // Se o usuário tem entidade, buscar apenas os tipos da sua entidade
        if (profileData?.entity_id) {
          query = query.eq("entity_id", profileData.entity_id)
        } else {
          // Se o usuário não tem entidade, buscar apenas os tipos criados por ele
          query = query.is("entity_id", null).eq("created_by", user.id)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        console.log("🔍 [useDocumentTypes] Dados do banco:", data)
        
        // Mapear os campos do banco para o formato esperado
        const mappedData = data?.map(item => {
          console.log(`🔍 [useDocumentTypes] Tipo "${item.name}" - retention_period:`, item.retention_period, typeof item.retention_period)
          
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            prefix: item.prefix || 'DOC',
            color: item.color || '#10B981',
            requiredFields: item.required_fields || ['title', 'author'],
            approvalRequired: item.approval_required || false,
            retentionPeriod: item.retention_period, // ✅ NÃO usar fallback - preservar null
            status: item.status || 'active',
            template: item.template,
          }
        }) || []
        
        console.log("🔍 [useDocumentTypes] Dados mapeados:", mappedData.map(t => ({ name: t.name, retentionPeriod: t.retentionPeriod })))
        setDocumentTypes(mappedData)
      } catch (err) {
        console.error("Erro ao buscar tipos de documento:", err)
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
  }, [user?.id, refreshTrigger, supabase])

  useEffect(() => {
    fetchDocumentTypes()
  }, [fetchDocumentTypes])

  const validateFile = (file: File, documentType: DocumentType): string[] => {
    const errors: string[] = []

    // Validar tamanho do arquivo (50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB em bytes
    if (file.size > maxSize) {
      errors.push(`Arquivo muito grande. Tamanho máximo: 50MB`)
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      errors.push(`Tipo de arquivo não suportado: ${file.type}`)
    }

    // Validações específicas do tipo de documento
    // Garantir que requiredFields existe antes de usar includes
    const requiredFields = documentType.requiredFields || []
    if (requiredFields.includes('file_size') && file.size === 0) {
      errors.push('Arquivo não pode estar vazio')
    }

    // Validar extensão do arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif']
    
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      errors.push(`Extensão de arquivo não suportada: .${fileExtension}`)
    }

    return errors
  }

  return { documentTypes, loading, error, validateFile, refetch }
}
