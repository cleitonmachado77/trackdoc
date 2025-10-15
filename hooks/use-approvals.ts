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
  }, [user])

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar aprovações pendentes (documentos que o usuário criou)
      const { data: pendingData, error: pendingError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'pending')
        .order('step_order', { ascending: true })

      if (pendingError) throw pendingError

      // Buscar TODAS as aprovações que o usuário precisa fazer (incluindo aprovadas e rejeitadas)
      const { data: myData, error: myError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('approver_id', user!.id)
        .order('created_at', { ascending: false })

      if (myError) throw myError

      // Buscar documentos que o usuário enviou para aprovação
      const { data: sentData, error: sentError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          status,
          created_at,
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
        .order('created_at', { ascending: false })

      if (sentError) throw sentError

      // Buscar dados relacionados separadamente
      const enrichApprovals = async (approvals: any[]) => {
        return Promise.all(
          approvals.map(async (approval) => {
            const relations = {
              document_title: '',
              approver_name: '',
              document_author_name: '',
              document_file_path: '',
              document_file_name: '',
              document_file_type: ''
            }

            // Buscar título do documento
            if (approval.document_id) {
              try {
                const { data: docData } = await supabase
                  .from('documents')
                  .select('title, author_id, file_path, file_name, file_type')
                  .eq('id', approval.document_id)
                  .single()
                relations.document_title = docData?.title || ''
                // Construir URL completa do Supabase Storage
                if (docData?.file_path) {
                  // Se já é uma URL completa, usar como está
                  if (docData.file_path.startsWith('http')) {
                    relations.document_file_path = docData.file_path
                  } else {
                    // Construir URL do Supabase Storage
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                    if (supabaseUrl) {
                      relations.document_file_path = `${supabaseUrl}/storage/v1/object/public/documents/${docData.file_path}`
                    } else {
                      console.error('NEXT_PUBLIC_SUPABASE_URL não está definido')
                      relations.document_file_path = ''
                    }
                  }
                } else {
                  relations.document_file_path = ''
                }
                
                relations.document_file_name = docData?.file_name || ''
                relations.document_file_type = docData?.file_type || ''

                // Log para debug
                console.log('Documento encontrado:', {
                  id: approval.document_id,
                  title: docData?.title,
                  file_path: docData?.file_path,
                  final_url: relations.document_file_path,
                  supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL
                })

                // Buscar nome do autor do documento
                if (docData?.author_id) {
                  try {
                    const { data: authorData } = await supabase
                      .from('profiles')
                      .select('full_name')
                      .eq('id', docData.author_id)
                      .single()
                    relations.document_author_name = authorData?.full_name || ''
                  } catch (e) {
                    console.warn('Erro ao buscar autor do documento:', e)
                  }
                }
              } catch (e) {
                console.warn('Erro ao buscar documento:', e)
              }
            }

            // Buscar nome do aprovador
            if (approval.approver_id) {
              try {
                const { data: approverData } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', approval.approver_id)
                  .single()
                relations.approver_name = approverData?.full_name || ''
              } catch (e) {
                console.warn('Erro ao buscar aprovador:', e)
              }
            }

            return {
              ...approval,
              ...relations
            }
          })
        )
      }

      // Processar dados enviados para aprovação
      const processSentApprovals = (sentData || []).map(doc => {
        const approvals = doc.approval_requests || []
        const latestapproval = approvals[approvals.length - 1] // Último approval
        
        return {
          id: doc.id,
          document_id: doc.id,
          document_title: doc.title,
          status: doc.status,
          created_at: doc.created_at,
          approval_requests: approvals,
          latest_approval: latestapproval,
                   // Para compatibilidade com a interface existente
         approver_id: latestapproval?.approver_id || '',
         approver_name: latestapproval?.profiles?.[0]?.full_name || '',
          comments: latestapproval?.comments || '',
          approved_at: latestapproval?.approved_at || '',
          step_order: approvals.length
        }
      })

      const enrichedPending = await enrichApprovals(pendingData || [])
      const enrichedMy = await enrichApprovals(myData || [])

      // Log para debug das estatísticas
      console.log('Estatísticas de Aprovação:', {
        total: enrichedMy.length,
        pending: enrichedMy.filter(a => a.status === 'pending').length,
        approved: enrichedMy.filter(a => a.status === 'approved').length,
        rejected: enrichedMy.filter(a => a.status === 'rejected').length
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

      // Buscar informações do documento e autor para a notificação
      let documentTitle = ''
      let authorEmail = ''
      let approverName = ''

      try {
        // Buscar título do documento
        const { data: docData } = await supabase
          .from('documents')
          .select('title, author_id')
          .eq('id', approvalData.document_id)
          .single()
        
        documentTitle = docData?.title || 'Documento'

        // Buscar email do autor
        if (docData?.author_id) {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', docData.author_id)
            .single()
          authorEmail = authorData?.email || ''
        }

                 // Buscar nome do aprovador
         const { data: approverData } = await supabase
           .from('profiles')
           .select('full_name')
           .eq('id', user!.id)
           .single()
         approverName = approverData?.full_name || 'Aprovador'

      } catch (e) {
        console.warn('Erro ao buscar dados para notificação:', e)
      }

      // Criar notificação para o autor do documento
      if (authorEmail) {
        try {
          const notificationTitle = approved 
            ? `Documento Aprovado: ${documentTitle}`
            : `Documento Rejeitado: ${documentTitle}`

          const notificationMessage = approved
            ? `Seu documento "${documentTitle}" foi aprovado por ${approverName}.${comments ? `\n\nComentários: ${comments}` : ''}`
            : `Seu documento "${documentTitle}" foi rejeitado por ${approverName}.${comments ? `\n\nComentários: ${comments}` : ''}`

          const notificationType = approved ? 'success' : 'error'
          const notificationPriority = approved ? 'medium' : 'high'

          await supabase
            .from('notifications')
            .insert({
              title: notificationTitle,
              message: notificationMessage,
              type: notificationType,
              priority: notificationPriority,
              recipients: [authorEmail],
              channels: ['email'],
              status: 'sent',
              created_by: user!.id
            })

          console.log('Notificação enviada para:', authorEmail)
        } catch (notificationError) {
          console.warn('Erro ao criar notificação:', notificationError)
          // Não falhar a aprovação se a notificação falhar
        }
      }

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
