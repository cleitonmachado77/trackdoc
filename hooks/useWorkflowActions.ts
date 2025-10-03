import { useMemo } from 'react'

interface WorkflowStepMetadata {
  userId?: string
  targetUsers?: string[]
  actionType?: 'sign' | 'approve'
  requiresAll?: boolean
}

interface WorkflowExecutionView {
  id: string
  status: string
  assignedTo: string | null
  metadata?: WorkflowStepMetadata
  step: {
    id: string
    name: string
    type: 'user' | 'action'
    metadata: WorkflowStepMetadata
  }
}

interface WorkflowProcessView {
  id: string
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  currentStepId: string | null
  executions: WorkflowExecutionView[]
  pendingExecutions: WorkflowExecutionView[] | null
}

interface AvailableActions {
  canAdvance: boolean
  canReturn: boolean
  canRequestSignature: boolean
  canApprove: boolean
  canReject: boolean
  canSign: boolean
  reason?: string
}

export function useWorkflowActions(
  process: WorkflowProcessView | null,
  userId: string | null
) {
  return useMemo<AvailableActions>(() => {
    if (!process) {
      return {
        canAdvance: false,
        canReturn: false,
        canRequestSignature: false,
        canApprove: false,
        canReject: false,
        canSign: false,
        reason: 'Processo não selecionado',
      }
    }

    if (process.status !== 'active') {
      return {
        canAdvance: false,
        canReturn: false,
        canRequestSignature: false,
        canApprove: false,
        canReject: false,
        canSign: false,
        reason: 'Processo não está ativo',
      }
    }

    if (!userId) {
      return {
        canAdvance: false,
        canReturn: false,
        canRequestSignature: false,
        canApprove: false,
        canReject: false,
        canSign: false,
        reason: 'Usuário não autenticado',
      }
    }

    const pendingExecutions = process.pendingExecutions || []
    const activeExecution = pendingExecutions.find(exec => exec.assignedTo === userId)

    if (!activeExecution) {
      return {
        canAdvance: false,
        canReturn: false,
        canRequestSignature: false,
        canApprove: false,
        canReject: false,
        canSign: false,
        reason: 'Nenhuma execução atribuída a você',
      }
    }

    const stepMetadata = activeExecution.step.metadata || {}
    const executionMetadata = activeExecution.metadata || {}
    const combinedMetadata = {
      ...stepMetadata,
      ...executionMetadata,
    }

    if (activeExecution.step.type === 'user') {
      return {
        canAdvance: true,
        canReturn: true,
        canRequestSignature: !!(combinedMetadata.actionType === 'sign' || combinedMetadata.requestAction === 'sign'),
        canApprove: false,
        canReject: false,
        canSign: false,
      }
    }

    if (activeExecution.step.type === 'action') {
      const actionType = combinedMetadata.actionType || combinedMetadata.requestAction

      return {
        canAdvance: false,
        canReturn: true,
        canRequestSignature: false,
        canApprove: actionType === 'approve',
        canReject: actionType === 'approve',
        canSign: actionType === 'sign',
      }
    }

    return {
      canAdvance: false,
      canReturn: false,
      canRequestSignature: false,
      canApprove: false,
      canReject: false,
      canSign: false,
      reason: 'Tipo de etapa desconhecido',
    }
  }, [process, userId])
}

