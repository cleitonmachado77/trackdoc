import { useCallback, useMemo, useState } from 'react'

interface SignatureRequestPayload {
  executionId: string
  action: 'sign' | 'approve' | 'reject'
  comments?: string
  extra?: Record<string, any>
}

export function useWorkflowSignature(processId: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendSignatureRequest = useCallback(async (payload: SignatureRequestPayload) => {
    if (!processId) {
      return { success: false, error: 'Processo não selecionado' }
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${processId}/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          executionId: payload.executionId,
          action: payload.action,
          payload: {
            comments: payload.comments,
            ...payload.extra,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar assinatura')
      }

      return { success: true, result: data.result }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar assinatura'
      setError(message)
      console.error('[useWorkflowSignature] sendSignatureRequest error:', err)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [processId])

  return useMemo(() => ({
    loading,
    error,
    sendSignatureRequest,
  }), [loading, error, sendSignatureRequest])
}

