import { useCallback, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

type ApprovalAction = 'approve' | 'reject'

export interface MultiSignatureRequest {
  id: string
  document_name: string | null
  document_path?: string | null
  signed_file_path?: string | null
  status: string
  total_signatures: number
  completed_signatures: number
  created_at: string
  metadata?: Record<string, any> | null
}

export interface MultiSignatureApproval {
  id: string
  request_id: string
  status: string
  comments?: string | null
  created_at: string
  multi_signature_requests?: MultiSignatureRequest | null
  request?: MultiSignatureRequest | null
}

interface OperationResult {
  success: boolean
  error?: string
  status?: string
}

export function useMultiSignatureRequests() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const loadingCounter = useRef(0)

  const startLoading = useCallback(() => {
    loadingCounter.current += 1
    setLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    loadingCounter.current = Math.max(0, loadingCounter.current - 1)
    if (loadingCounter.current === 0) {
      setLoading(false)
    }
  }, [])

  const getMyRequests = useCallback(async (): Promise<MultiSignatureRequest[]> => {
    if (!user) return []

    startLoading()
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('multi_signature_requests')
        .select(`
          id,
          document_name,
          document_path,
          signed_file_path,
          status,
          total_signatures,
          completed_signatures,
          created_at,
          metadata
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError
      return (data || []) as MultiSignatureRequest[]
    } catch (err) {
      console.error('Erro ao carregar solicitações de assinatura múltipla:', err)
      setError('Erro ao carregar solicitações de assinatura múltipla')
      return []
    } finally {
      stopLoading()
    }
  }, [user, startLoading, stopLoading])

  const getMyPendingApprovals = useCallback(async (): Promise<MultiSignatureApproval[]> => {
    if (!user) return []

    startLoading()
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('multi_signature_approvals')
        .select(`
          id,
          request_id,
          status,
          comments,
          created_at,
          multi_signature_requests (
            id,
            document_name,
            document_path,
            signed_file_path,
            status,
            total_signatures,
            completed_signatures,
            created_at,
            metadata
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      const approvals = (data || []).map((approval: any) => ({
        ...approval,
        request: approval.multi_signature_requests ?? null
      })) as MultiSignatureApproval[]

      return approvals
    } catch (err) {
      console.error('Erro ao carregar aprovações pendentes:', err)
      setError('Erro ao carregar aprovações pendentes')
      return []
    } finally {
      stopLoading()
    }
  }, [user, startLoading, stopLoading])

  const getRequestProgress = useCallback(async (requestId: string) => {
    if (!requestId) return null
    if (!user) return null

    startLoading()
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('multi_signature_requests')
        .select(`
          id,
          document_name,
          status,
          total_signatures,
          completed_signatures,
          created_at,
          metadata,
          approvals:multi_signature_approvals (
            id,
            user_id,
            user_name,
            user_email,
            status,
            comments,
            signed_at,
            updated_at
          )
        `)
        .eq('id', requestId)
        .maybeSingle()

      if (supabaseError) throw supabaseError
      if (!data) return null

      const approvals = data.approvals || []
      const completed = approvals.filter((approval: any) => approval.status === 'approved').length
      const pending = approvals.filter((approval: any) => approval.status === 'pending').length

      return {
        id: data.id,
        documentName: data.document_name,
        status: data.status,
        totalSignatures: data.total_signatures || approvals.length,
        completedSignatures: data.completed_signatures ?? completed,
        pendingSignatures: pending,
        createdAt: data.created_at,
        metadata: data.metadata,
        users: approvals.map((approval: any) => ({
          id: approval.user_id,
          name: approval.user_name,
          email: approval.user_email,
          status: approval.status,
          comments: approval.comments,
          signedAt: approval.signed_at || approval.updated_at
        }))
      }
    } catch (err) {
      console.error('Erro ao carregar progresso da assinatura múltipla:', err)
      setError('Erro ao carregar progresso da assinatura múltipla')
      return null
    } finally {
      stopLoading()
    }
  }, [user, startLoading, stopLoading])

  const updateRequestStatus = useCallback(async (requestId: string) => {
    const { data: approvals, error: approvalsError } = await supabase
      .from('multi_signature_approvals')
      .select('status')
      .eq('request_id', requestId)

    if (approvalsError) throw approvalsError

    const total = approvals?.length || 0
    const approved = approvals?.filter((approval) => approval.status === 'approved').length || 0
    const rejected = approvals?.filter((approval) => approval.status === 'rejected').length || 0

    let status = 'pending'
    if (rejected > 0) {
      status = 'cancelled'
    } else if (total > 0 && approved === total) {
      status = 'completed'
    } else if (approved > 0) {
      status = 'in_progress'
    } else {
      status = 'pending'
    }

    const { error: updateError } = await supabase
      .from('multi_signature_requests')
      .update({
        status,
        completed_signatures: approved,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) throw updateError

    return status
  }, [])

  const approveSignature = useCallback(async (
    requestId: string,
    action: ApprovalAction,
    comments?: string
  ): Promise<OperationResult> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    startLoading()
    setError(null)

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'

      const { error: updateError } = await supabase
        .from('multi_signature_approvals')
        .update({
          status: newStatus,
          comments: comments || null,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (updateError) throw updateError

      const status = await updateRequestStatus(requestId)

      return { success: true, status }
    } catch (err) {
      console.error('Erro ao registrar decisão de assinatura múltipla:', err)
      const message = 'Erro ao registrar decisão de assinatura múltipla'
      setError(message)
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
      return { success: false, error: message }
    } finally {
      stopLoading()
    }
  }, [user, toast, startLoading, stopLoading, updateRequestStatus])

  const cleanupOrphanedApprovals = useCallback(async () => {
    if (!user) return

    try {
      const { data: orphaned, error: fetchError } = await supabase
        .from('multi_signature_approvals')
        .select('id, request_id')
        .is('request_id', null)

      if (fetchError) {
        console.warn('Erro ao verificar aprovações órfãs:', fetchError)
        return
      }

      if (orphaned && orphaned.length > 0) {
        const { error: deleteError } = await supabase
          .from('multi_signature_approvals')
          .delete()
          .in('id', orphaned.map((item) => item.id))

        if (deleteError) {
          console.warn('Erro ao remover aprovações órfãs:', deleteError)
        }
      }
    } catch (err) {
      console.warn('Erro inesperado durante limpeza de aprovações órfãs:', err)
    }
  }, [user])

  const finalizeSignature = useCallback(async (requestId: string): Promise<OperationResult> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    startLoading()
    setError(null)

    try {
      const status = await updateRequestStatus(requestId)
      return {
        success: status === 'completed',
        status,
        error: status === 'completed' ? undefined : 'Solicitação ainda não concluída'
      }
    } catch (err) {
      console.error('Erro ao finalizar assinatura múltipla:', err)
      const message = 'Erro ao finalizar assinatura múltipla'
      setError(message)
      return { success: false, error: message }
    } finally {
      stopLoading()
    }
  }, [user, startLoading, stopLoading, updateRequestStatus])

  return {
    loading,
    error,
    getMyRequests,
    getMyPendingApprovals,
    getRequestProgress,
    approveSignature,
    cleanupOrphanedApprovals,
    finalizeSignature
  }
}


