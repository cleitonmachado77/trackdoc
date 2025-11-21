import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ApprovalDocument {
  id: string
  document_id: string
  approver_id: string
  step_order: number
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approved_at?: string
  created_at: string
  updated_at?: string
  // Relacionamentos
  document_title?: string
  approver_name?: string
  document_author_name?: string
  // Campos adicionais para documentos enviados
  approval_status?: string
}

export function useApprovals() {
  const { user } = useAuth()
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalDocument[]>([])
  const [myApprovals, setMyApprovals] = useState<ApprovalDocument[]>([])
  const [sentApprovals, setSentApprovals] = useState<ApprovalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setPendingApprovals([])
      setMyApprovals([])
      setSentApprovals([])
      setLoading(false)
      return
    }

    fetchApprovals()
    
    // Configurar realtime subscription para atualização automática
    const channel = supabase
      .channel('approvals_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'approval_requests'
        },
        (payload) => {
          console.log('🔄 [REALTIME] Mudança detectada em approval_requests:', payload)
          // Recarregar aprovações quando houver mudanças
          fetchApprovals()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `author_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 [REALTIME] Mudança detectada em documents:', payload)
          // Recarregar aprovações quando documentos do usuário mudarem
          fetchApprovals()
        }
      )
      .subscribe((status) => {
        console.log('📡 [REALTIME] Status da conexão:', status)
      })

    // Polling como fallback (verificar a cada 10 segundos)
    const pollingInterval = setInterval(() => {
      console.log('🔄 [POLLING] Verificando atualizações de aprovações...')
      fetchApprovals()
    }, 10000) // 10 segundos

    // Cleanup: remover subscription e polling quando componente desmontar
    return () => {
      console.log('🔌 [REALTIME] Desconectando subscription')
      supabase.removeChannel(channel)
      clearInterval(pollingInterval)
    }
  }, [user])

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Otimização: Fazer todas as queries principais em paralelo
      const [pendingResult, myResult, sentResult] = await Promise.all([
        // Buscar aprovações pendentes
        supabase
          .from('approval_requests')
          .select('*')
          .eq('status', 'pending')
          .order('step_order', { ascending: true }),

        // Buscar aprovações do usuário
        supabase
          .from('approval_requests')
          .select('*')
          .eq('approver_id', user!.id)
          .order('created_at', { ascending: false }),

        // Buscar documentos enviados para aprovação
        supabase
          .from('documents')
          .select(`
            id,
            title,
            status,
            created_at,
            author_id,
            profiles!documents_author_id_fkey (
              full_name
            ),
            approval_requests (
              id,
              status,
              comments,
              approved_at,
              approver_id,
              profiles!approval_requests_approver_id_fkey (
                full_name
              )
            )
          `)
          .eq('author_id', user!.id)
          .in('status', ['pending_approval', 'approved', 'rejected'])
          .order('created_at', { ascending: false})
      ])

      console.log('📊 [SENT_QUERY] Buscando documentos enviados:', {
        userId: user!.id,
        pendingCount: pendingResult.data?.length,
        myCount: myResult.data?.length,
        sentCount: sentResult.data?.length,
        sentError: sentResult.error
      })

      if (pendingResult.error) throw pendingResult.error
      if (myResult.error) throw myResult.error
      if (sentResult.error) throw sentResult.error

      // Otimização: Enriquecer dados de forma mais eficiente
      const enrichApprovals = async (approvals: any[]) => {
        if (approvals.length === 0) return []

        // Buscar todos os documentos de uma vez
        const documentIds = [...new Set(approvals.map(a => a.document_id).filter(Boolean))]
        const approverIds = [...new Set(approvals.map(a => a.approver_id).filter(Boolean))]

        const [documentsResult, approversResult] = await Promise.all([
          documentIds.length > 0 ? supabase
            .from('documents')
            .select('id, title, author_id, file_path, file_name, file_type')
            .in('id', documentIds) : Promise.resolve({ data: [] }),

          approverIds.length > 0 ? supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', approverIds) : Promise.resolve({ data: [] })
        ])

        // Criar maps para busca rápida com tipagem correta
        const documentsMap = new Map<string, any>()
        const approversMap = new Map<string, any>()

        // Preencher maps de forma segura
        documentsResult.data?.forEach(doc => {
          if (doc?.id) {
            documentsMap.set(doc.id, doc)
          }
        })

        approversResult.data?.forEach(profile => {
          if (profile?.id) {
            approversMap.set(profile.id, profile)
          }
        })

        // Buscar autores dos documentos
        const authorIds = [...new Set(documentsResult.data?.map((doc: any) => doc.author_id).filter(Boolean) || [])]
        const authorsResult = authorIds.length > 0 ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', authorIds) : { data: [] }

        const authorsMap = new Map<string, any>()
        authorsResult.data?.forEach(profile => {
          if (profile?.id) {
            authorsMap.set(profile.id, profile)
          }
        })

        // Enriquecer aprovações com tipagem correta
        return approvals.map(approval => {
          const doc: any = documentsMap.get(approval.document_id)
          const approver: any = approversMap.get(approval.approver_id)
          const author: any = doc ? authorsMap.get(doc.author_id) : null

          // Construir URL do arquivo de forma otimizada
          let document_file_path = ''
          if (doc?.file_path) {
            if (doc.file_path.startsWith('http')) {
              document_file_path = doc.file_path
            } else {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
              if (supabaseUrl) {
                document_file_path = `${supabaseUrl}/storage/v1/object/public/documents/${doc.file_path}`
              }
            }
          }

          return {
            ...approval,
            document_title: doc?.title || '',
            approver_name: approver?.full_name || '',
            document_author_name: author?.full_name || '',
            document_file_path,
            document_file_name: doc?.file_name || '',
            document_file_type: doc?.file_type || ''
          }
        })
      }

      // Processar dados enviados para aprovação (otimizado)
      // Filtrar apenas documentos que realmente têm solicitações de aprovação
      const processSentApprovals = (sentResult.data || [])
        .filter(doc => doc.approval_requests && doc.approval_requests.length > 0)
        .map(doc => {
          const approvals = doc.approval_requests || []
          const latestApproval = approvals[approvals.length - 1]
          const authorName = doc.profiles?.full_name || ''

          const processedData = {
            id: doc.id,
            document_id: doc.id,
            document_title: doc.title,
            document_author_name: authorName,
            author_name: authorName,
            status: doc.status,
            created_at: doc.created_at,
            approval_requests: approvals,
            latest_approval: latestApproval,
            approver_id: latestApproval?.approver_id || '',
            approver_name: latestApproval?.profiles?.[0]?.full_name || '',
            comments: latestApproval?.comments || '',
            approved_at: latestApproval?.approved_at || '',
            step_order: approvals.length
          }

          console.log('📊 [SENT_APPROVALS] Documento processado:', {
            title: doc.title,
            status: doc.status,
            author_name: authorName,
            approved_at: latestApproval?.approved_at,
            has_approved_at: !!latestApproval?.approved_at
          })

          return processedData
        })

      // Enriquecer dados em paralelo
      const [enrichedPending, enrichedMy] = await Promise.all([
        enrichApprovals(pendingResult.data || []),
        enrichApprovals(myResult.data || [])
      ])

      console.log('📊 [APPROVALS_LOADED] Dados carregados:', {
        pending: enrichedPending.length,
        my: enrichedMy.length,
        sent: processSentApprovals.length,
        sentSample: processSentApprovals[0]
      })

      setPendingApprovals(enrichedPending)
      setMyApprovals(enrichedMy)
      setSentApprovals(processSentApprovals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar aprovações')
    } finally {
      setLoading(false)
    }
  }

  const createApprovalDocument = async (documentId: string, approvers: string[]) => {
    try {
      setError(null)

      const approvals = approvers.map((approverId, index) => ({
        document_id: documentId,
        approver_id: approverId,
        step_order: index + 1,
        status: 'pending'
      }))

      const { data, error } = await supabase
        .from('approval_requests')
        .insert(approvals)
        .select()

      if (error) throw error

      // Atualizar status do documento
      await supabase
        .from('documents')
        .update({ status: 'pending_approval' })
        .eq('id', documentId)

      await fetchApprovals()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fluxo de aprovação')
      throw err
    }
  }

  const approveDocument = async (approvalId: string, approved: boolean, comments?: string) => {
    try {
      setError(null)

      console.log('🔄 [APPROVE] Usando API route diretamente...')

      // Usar API route diretamente (comprovadamente funciona)
      const response = await fetch('/api/approve-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId,
          approved,
          comments,
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na API route')
      }

      const result = await response.json()
      const approvalData = result.data

      console.log('✅ [APPROVE] API route funcionou!', result)

      // Nota: A notificação será criada automaticamente pelo trigger do banco de dados
      // (trigger_notify_approval_processed)

      // Verificar se é o último aprovador
      const { data: remainingapprovals, error: remainingError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('document_id', approvalData.document_id)
        .eq('status', 'pending')

      if (remainingError) throw remainingError

      // Se não há mais aprovações pendentes, finalizar documento
      if (remainingapprovals.length === 0) {
        const finalStatus = approved ? 'approved' : 'rejected'
        await supabase
          .from('documents')
          .update({ status: finalStatus })
          .eq('id', approvalData.document_id)
      }

      await fetchApprovals()
      return approvalData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar documento')
      throw err
    }
  }

  const getDocumentApprovalStatus = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('document_id', documentId)
        .order('step_order', { ascending: true })

      if (error) throw error

      // Buscar nomes dos aprovadores
      const approvalsWithNames = await Promise.all(
        (data || []).map(async (approval) => {
          let approver_name = ''
          if (approval.approver_id) {
            try {
              const { data: approverData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', approval.approver_id)
                .single()
              approver_name = approverData?.full_name || ''
            } catch (e) {
              console.warn('Erro ao buscar aprovador:', e)
            }
          }

          return {
            ...approval,
            approver_name
          }
        })
      )

      return approvalsWithNames
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar status de aprovação')
      return []
    }
  }

  return {
    pendingApprovals,
    myApprovals,
    sentApprovals,
    loading,
    error,
    createApprovalDocument,
    approveDocument,
    getDocumentApprovalStatus,
    refetch: fetchApprovals
  }
}
