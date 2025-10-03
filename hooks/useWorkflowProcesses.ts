import { useCallback, useMemo, useState } from 'react'

export interface WorkflowProcessResponse {
  id: string
  name: string
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  template: {
    id: string
    name: string
    status: string
    steps?: any[]
    transitions?: any[]
  }
  document: {
    id: string
    title: string
    status: string
    file_path?: string
    download_url?: string
  }
  currentStepId: string | null
  startedBy: string
  startedAt: string
  completedAt: string | null
  executions: ExecutionResponse[]
  pendingExecutions: ExecutionResponse[] | null
}

export interface ExecutionResponse {
  id: string
  status: string
  assignedTo: string | null
  actionTaken?: string | null
  comments?: string | null
  metadata?: Record<string, any>
  step: {
    id: string
    name: string
    type: 'user' | 'action'
    metadata: Record<string, any>
    actionType?: 'sign' | 'approve'
  }
  assignedUser?: {
    id: string
    fullName: string
    email: string
  } | null
}

type ProcessScope = 'assigned' | 'mine' | 'all'

export function useWorkflowProcesses(scope: ProcessScope = 'assigned') {
  const [processes, setProcesses] = useState<WorkflowProcessResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows?scope=${scope}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar processos')
      }

      const normalizeExecution = (execution: any) => {
        if (!execution) return execution

        const stepMetadata = execution.step?.metadata ?? {}

        return {
          id: execution.id,
          status: execution.status,
          assignedTo: execution.assigned_to ?? execution.assignedTo ?? null,
          actionTaken: execution.action_taken ?? execution.actionTaken ?? null,
          comments: execution.comments ?? null,
          metadata: execution.metadata ?? {},
          step: {
            id: execution.step?.id ?? '',
            name: execution.step?.name ?? 'Etapa',
            type: execution.step?.type ?? 'user',
            metadata: stepMetadata,
            actionType: stepMetadata.actionType ?? stepMetadata.action_type ?? undefined,
          },
          assignedUser: execution.assigned_user
            ? {
                id: execution.assigned_user.id,
                fullName: execution.assigned_user.full_name ?? execution.assigned_user.fullName ?? '',
                email: execution.assigned_user.email ?? '',
              }
            : execution.assignedUser ?? null,
        } satisfies ExecutionResponse
      }

      const normalizeTemplate = (template: any) => {
        if (!template) {
          return {
            id: '',
            name: '',
            status: '',
            steps: [],
            transitions: [],
          }
        }

        return {
          id: template.id,
          name: template.name,
          status: template.status,
          steps: (template.steps ?? []).map((step: any) => ({
            id: step.id,
            name: step.name,
            type: step.type,
            stepOrder: step.step_order ?? step.stepOrder ?? 0,
            metadata: step.metadata ?? {},
            uiPosition: step.ui_position ?? step.uiPosition ?? { x: 0, y: 0 },
          })),
          transitions: (template.transitions ?? []).map((transition: any) => ({
            id: transition.id,
            fromStepId: transition.from_step_id ?? transition.fromStepId ?? null,
            toStepId: transition.to_step_id ?? transition.toStepId ?? null,
            condition: transition.condition ?? 'always',
            metadata: transition.metadata ?? {},
          })),
        }
      }

      const enriched = (data.processes || []).map((process: any) => {
        const executions = (process.executions ?? []).map(normalizeExecution)
        const pendingExecutions = (process.pendingExecutions ?? []).map(normalizeExecution)

        return {
          id: process.id,
          name: process.name,
          status: process.status,
          template: normalizeTemplate(process.template),
          document: {
            id: process.document?.id ?? '',
            title: process.document?.title ?? 'Documento',
            status: process.document?.status ?? '',
            file_path: process.document?.file_path ?? process.document?.filePath,
            download_url: process.document?.download_url ?? null,
          },
          currentStepId: process.current_step_id ?? process.currentStepId ?? null,
          startedBy: process.started_by ?? process.startedBy ?? '',
          startedAt: process.started_at ?? process.startedAt ?? '',
          completedAt: process.completed_at ?? process.completedAt ?? null,
          executions,
          pendingExecutions,
        } satisfies WorkflowProcessResponse
      })

      setProcesses(enriched)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar processos'
      setError(message)
      console.error('[useWorkflowProcesses] fetchProcesses error:', err)
    } finally {
      setLoading(false)
    }
  }, [scope])

  const deleteProcess = useCallback(async (processId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows?id=${processId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir processo')
      }

      await fetchProcesses()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir processo'
      setError(message)
      console.error('[useWorkflowProcesses] deleteProcess error:', err)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [fetchProcesses])

  const value = useMemo(() => ({
    processes,
    loading,
    error,
    fetchProcesses,
    deleteProcess,
  }), [processes, loading, error, fetchProcesses, deleteProcess])

  return value
}

