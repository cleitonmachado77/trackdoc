import { useCallback, useMemo, useState } from 'react'

interface ExecutePayload {
  executionId: string
  action?: string
  payload?: any
}

interface ReturnPayload {
  executionId: string
  comments?: string
}

export function useWorkflowExecutions(processId: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeAction = useCallback(async ({ executionId, action, payload }: ExecutePayload) => {
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
        body: JSON.stringify({ executionId, action, payload }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar ação')
      }

      return { success: true, result: data.result }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao executar ação'
      setError(message)
      console.error('[useWorkflowExecutions] executeAction error:', err)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [processId])

  const returnStep = useCallback(async ({ executionId, comments }: ReturnPayload) => {
    if (!processId) {
      return { success: false, error: 'Processo não selecionado' }
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${processId}/executions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ executionId, comments }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao retornar etapa')
      }

      return { success: true, result: data.result }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao retornar etapa'
      setError(message)
      console.error('[useWorkflowExecutions] returnStep error:', err)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [processId])

  return useMemo(() => ({
    loading,
    error,
    executeAction,
    returnStep,
  }), [loading, error, executeAction, returnStep])
}

