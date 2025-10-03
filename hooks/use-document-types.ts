import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

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
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchDocumentTypes() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
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

        if (error) {
          throw error
        }

        // Mapear os campos do banco para o formato esperado
        const mappedData = data?.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          prefix: item.prefix || 'DOC',
          color: item.color || '#10B981',
          requiredFields: item.required_fields || ['title', 'author'],
          approvalRequired: item.approval_required || false,
          retentionPeriod: item.retention_period || 24,
          status: item.status || 'active',
          template: item.template,
        })) || []
        setDocumentTypes(mappedData)
      } catch (err) {
        console.error("Erro ao buscar tipos de documento:", err)
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentTypes()
  }, []) // Removida a dependência do supabase para evitar re-renders infinitos

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
    if (documentType.requiredFields.includes('file_size') && file.size === 0) {
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

  return { documentTypes, loading, error, validateFile }
}
