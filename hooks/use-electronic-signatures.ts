import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Document {
  id: string
  title: string
  file_path: string
  created_at: string
}

interface Signature {
  id: string
  document_id: string | null
  arqsign_document_id: string
  status: string
  signature_url: string | null
  created_at: string
  verification_code?: string
  verification_url?: string
  qr_code_data?: string
  document_hash?: string
  signature_hash?: string
}

interface SignatureResult {
  success: boolean
  data?: {
    signatureId: string
    documentName: string
    downloadUrl: string
    signature: any
    metadata: any
  }
  error?: string
  message?: string
}

interface MultiSignatureRequest {
  users: Array<{
    id: string
    full_name: string
    email: string
  }>
  documentId?: string
  file?: File
  signatureTemplate?: any
}

interface MultiSignatureResult {
  success: boolean
  data?: {
    signatureId: string
    documentName: string
    downloadUrl: string
    signatures: any[]
    metadata: any
    pendingSignatures: number
    totalSignatures: number
  }
  error?: string
  message?: string
}

export function useElectronicSignatures() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadSignatures = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      // Buscar assinaturas do usuário
      const { data, error: fetchError } = await supabase
        .from('document_signatures')
        .select(`
          *,
          document:documents(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.warn('Erro ao carregar assinaturas (tabela pode não existir):', fetchError)
        setSignatures([])
        return
      }

      setSignatures(data || [])
    } catch (err) {
      console.warn('Erro ao carregar assinaturas:', err)
      setSignatures([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const loadDocuments = useCallback(async () => {
    try {
      console.log('🔄 Iniciando carregamento de documentos...')
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ Usuário não autenticado')
        setError('Usuário não autenticado')
        return
      }



      // Buscar documentos através da relação: usuário → perfil → entidade
      // Primeiro, buscar o perfil do usuário para obter o entity_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.entity_id) {
        console.warn('⚠️ Perfil não encontrado ou sem entity_id, buscando documentos por author_id')
        // Fallback: buscar documentos onde o usuário é o autor
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('id, title, file_path, created_at')
          .eq('author_id', user.id)
          .like('file_path', '%.pdf')
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('❌ Erro ao carregar documentos por author_id:', fetchError)
          setDocuments([])
          return
        }

        setDocuments(data || [])
        return
      }



      // Buscar documentos da entidade do usuário
      const { data: entityDocs, error: entityError } = await supabase
        .from('documents')
        .select('id, title, file_path, created_at')
        .eq('entity_id', profile.entity_id)
        .like('file_path', '%.pdf')
        .order('created_at', { ascending: false })

      if (entityError) {
        console.error('❌ Erro ao carregar documentos por entity_id:', entityError)
      }

      // Buscar também documentos onde o usuário é o autor (fallback)
      const { data: authorDocs, error: authorError } = await supabase
        .from('documents')
        .select('id, title, file_path, created_at')
        .eq('author_id', user.id)
        .like('file_path', '%.pdf')
        .order('created_at', { ascending: false })

      if (authorError) {
        console.error('❌ Erro ao carregar documentos por author_id:', authorError)
      }

      // Combinar e remover duplicatas
      const allDocs = [...(entityDocs || []), ...(authorDocs || [])]
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      )

      console.log('✅ Documentos carregados com sucesso:', uniqueDocs.length, 'documentos')
      if (uniqueDocs.length > 0) {
        console.log('📄 Primeiros documentos:', uniqueDocs.slice(0, 3))
      } else {
        console.log('⚠️ Nenhum documento encontrado!')

        console.log('   - Documentos por autor:', authorDocs?.length || 0)
      }
      
      setDocuments(uniqueDocs)
    } catch (err) {
      console.error('💥 Erro interno ao carregar documentos:', err)
      setError('Erro interno ao carregar documentos')
    } finally {
      setLoading(false)
      console.log('🏁 Carregamento de documentos finalizado')
    }
  }, [supabase])

  const sendForSignature = useCallback(async (formData: FormData): Promise<SignatureResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/arsign', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSignatureStatus = useCallback(async (signatureId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('document_signatures')
        .update({ status })
        .eq('id', signatureId)

      if (error) {
        console.error('Erro ao atualizar status:', error)
        return false
      }

      // Recarregar assinaturas
      await loadSignatures()
      return true
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      return false
    }
  }, [supabase, loadSignatures])

  const sendForMultiSignature = useCallback(async (request: MultiSignatureRequest): Promise<MultiSignatureResult> => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('action', 'multi_signature')
      formData.append('users', JSON.stringify(request.users))
      
      if (request.documentId) {
        formData.append('documentId', request.documentId)
      }
      
      if (request.file) {
        formData.append('file', request.file)
      }
      
      if (request.signatureTemplate) {
        formData.append('signature_template', JSON.stringify(request.signatureTemplate))
      }

      const response = await fetch('/api/arsign', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    signatures,
    documents,
    loading,
    error,
    loadSignatures,
    loadDocuments,
    sendForSignature,
    sendForMultiSignature,
    updateSignatureStatus
  }
}
