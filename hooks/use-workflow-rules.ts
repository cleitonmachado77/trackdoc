import { useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

export interface WorkflowStep {
  id: string
  step_name: string
  step_type: string
  step_order: number
  department_id?: string
  user_id?: string
  action_type?: string
  action_data?: any
  department?: {
    id: string
    name: string
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface WorkflowExecution {
  id: string
  process_id: string
  step_id: string
  assigned_to?: string
  assigned_department_id?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'cancelled'
  started_at: string
  completed_at?: string
  comments?: string
  action_taken?: string
  created_at: string
  updated_at: string
  step?: WorkflowStep
  assigned_user?: {
    id: string
    full_name: string
    email: string
  }
  assigned_department?: {
    id: string
    name: string
  }
}

export interface WorkflowProcess {
  id: string
  workflow_template_id: string
  document_id: string
  process_name: string
  current_step_id?: string
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  started_by: string
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
  workflow_template?: {
    id: string
    name: string
    description?: string
    steps?: WorkflowStep[]
  }
  document?: {
    id: string
    title: string
    status: string
  }
  current_step?: WorkflowStep
  started_by_user?: {
    id: string
    full_name: string
    email: string
  }
  executions?: WorkflowExecution[]
}

export interface WorkflowRulesResult {
  availableActions: string[]
  isRequesting: boolean
  isExecuting: boolean
  actionType: string | null
  nextActionStep: WorkflowStep | null
  previousActionStep: WorkflowStep | null
  flowContext: {
    currentStep: WorkflowStep | null
    hasPendingAction: boolean
    pendingActionType: string | null
    flowType: string | null
  }
  contextualMessage: string
}

export function useWorkflowRules() {
  const { user } = useAuth()

  // Buscar próximo nó de ação no fluxo
  const getNextActionStep = useCallback((process: WorkflowProcess, currentExecution: WorkflowExecution | null): WorkflowStep | null => {
    if (!process?.workflow_template?.steps || !currentExecution?.step) return null
    
    const currentStepOrder = currentExecution.step.step_order || 0
    const steps = process.workflow_template.steps.sort((a, b) => a.step_order - b.step_order)
    
    // Buscar o próximo nó de ação
    for (let i = currentStepOrder + 1; i < steps.length; i++) {
      const step = steps.find((s) => s.step_order === i)
      if (step && step.step_type === 'action') {
        return step
      }
    }
    
    return null
  }, [])

  // Buscar nó de ação anterior no fluxo
  const getPreviousActionStep = useCallback((process: WorkflowProcess, currentExecution: WorkflowExecution | null): WorkflowStep | null => {
    if (!process?.workflow_template?.steps || !currentExecution?.step) return null
    
    const currentStepOrder = currentExecution.step.step_order || 0
    const steps = process.workflow_template.steps.sort((a, b) => a.step_order - b.step_order)
    
    // Buscar o nó de ação anterior
    for (let i = currentStepOrder - 1; i >= 0; i--) {
      const step = steps.find((s) => s.step_order === i)
      if (step && step.step_type === 'action') {
        return step
      }
    }
    
    return null
  }, [])

  // Verificar se um nó de ação está pendente
  const isActionStepPending = useCallback((actionStep: WorkflowStep, currentStepOrder: number, allSteps: WorkflowStep[]): boolean => {
    // Se o nó de ação está imediatamente antes da etapa atual
    if (actionStep.step_order === currentStepOrder - 1) {
      return true
    }
    
    // Se há usuários/departamentos entre o nó de ação e a etapa atual
    const stepsBetween = allSteps.filter((step) => 
      step.step_order > actionStep.step_order && 
      step.step_order < currentStepOrder &&
      (step.step_type === 'user' || step.step_type === 'department')
    )
    
    // Se há apenas um usuário/departamento entre a ação e a etapa atual
    if (stepsBetween.length === 1) {
      return true
    }
    
    // CORREÇÃO: Se a etapa atual é de usuário/departamento e há um nó de ação anterior,
    // e não há outros nós de ação entre eles, então a ação está pendente
    const currentStep = allSteps.find(step => step.step_order === currentStepOrder)
    if (currentStep && (currentStep.step_type === 'user' || currentStep.step_type === 'department')) {
      // Verificar se não há outros nós de ação entre a ação e a etapa atual
      const actionStepsBetween = allSteps.filter((step) => 
        step.step_order > actionStep.step_order && 
        step.step_order < currentStepOrder &&
        step.step_type === 'action'
      )
      
      // Se não há outros nós de ação entre eles, a ação está pendente
      if (actionStepsBetween.length === 0) {
        return true
      }
    }
    
    return false
  }, [])

  // Análise completa do fluxo do workflow
  const analyzeWorkflowFlow = useCallback((process: WorkflowProcess, currentExecution: WorkflowExecution | null) => {
    if (!process?.workflow_template?.steps || !currentExecution?.step) {
      return { hasPendingAction: false, pendingActionType: null, flowContext: null }
    }
    
    const currentStepOrder = currentExecution.step.step_order
    const steps = process.workflow_template.steps.sort((a, b) => a.step_order - b.step_order)
    
    // Buscar por nós de ação que podem estar pendentes
    const actionSteps = steps.filter((step) => step.step_type === 'action')
    
    // Verificar se há ação pendente baseada na lógica do fluxo
    for (const actionStep of actionSteps) {
      if (actionStep.step_order < currentStepOrder) {
        // Verificar se esta ação ainda está pendente
        const isActionPending = isActionStepPending(actionStep, currentStepOrder, steps)
        if (isActionPending) {
          return {
            hasPendingAction: true,
            pendingActionType: actionStep.action_type,
            flowContext: {
              actionStep,
              currentStep: currentExecution.step,
              flowType: 'action_between_users'
            }
          }
        }
      }
    }
    
    return { hasPendingAction: false, pendingActionType: null, flowContext: null }
  }, [isActionStepPending])

  // Determinar ações disponíveis baseadas nas regras do workflow
  const getAvailableActions = useCallback((process: WorkflowProcess, currentExecution: WorkflowExecution | null): string[] => {
    if (!currentExecution?.step || !process) return []
    
    const currentStep = currentExecution.step
    const actions: string[] = []
    
    // ✅ DEBUG: Log da análise do fluxo
    console.log('🔍 [getAvailableActions] DEBUG - Analisando ações para:', {
      currentStep: {
        id: currentStep.id,
        name: currentStep.step_name,
        type: currentStep.step_type,
        actionType: currentStep.action_type,
        order: currentStep.step_order
      },
      processId: process.id
    })
    
    // ANÁLISE COMPLETA DO FLUXO
    const flowAnalysis = analyzeWorkflowFlow(process, currentExecution)
    
    console.log('🔍 [getAvailableActions] DEBUG - Análise do fluxo:', flowAnalysis)
    
    if (flowAnalysis.hasPendingAction) {
      // Se há ação pendente, o usuário atual deve executá-la
      switch (flowAnalysis.pendingActionType) {
        case 'sign':
          actions.push('sign')
          break
        case 'approve':
          actions.push('approve', 'reject')
          break
        default:
          actions.push('approve', 'reject')
      }
      // Permitir navegação mesmo com ação pendente
      actions.push('advance', 'back')
    } else {
      // LÓGICA CORRIGIDA: Verificar se o usuário atual está solicitando ou executando
      const nextActionStep = getNextActionStep(process, currentExecution)
      
      if (nextActionStep) {
        // Se há nó de ação na próxima etapa, o usuário atual está SOLICITANDO
        // Mostrar botão específico baseado no tipo de ação
        switch (nextActionStep.action_type) {
          case 'sign':
            actions.push('request_signature')
            break
          case 'approve':
            actions.push('request_approval')
            break
          default:
            actions.push('request_approval')
        }
        // Sempre permitir navegação
        actions.push('advance', 'back')
      } else {
        // Se não há nó de ação próximo, usar lógica baseada no tipo de etapa atual
        switch (currentStep.step_type) {
          case 'department':
          case 'user':
            actions.push('approve', 'comment')
            break
          case 'approval':
            actions.push('approve', 'reject')
            break
          case 'action':
            // Se a etapa atual é de ação, verificar se deve ser executada aqui
            if (currentStep.action_type === 'sign') {
              actions.push('sign')
            } else if (currentStep.action_type === 'approve') {
              actions.push('approve', 'reject')
            }
            break
          default:
            actions.push('approve', 'comment')
        }
        // Sempre permitir navegação
        actions.push('advance', 'back')
      }
    }
    
    // ✅ DEBUG: Log das ações finais
    console.log('🔍 [getAvailableActions] DEBUG - Ações finais retornadas:', actions)
    
    return actions
  }, [analyzeWorkflowFlow, getNextActionStep])

  // Gerar mensagem contextual baseada nas regras
  const getContextualMessage = useCallback((process: WorkflowProcess, currentExecution: WorkflowExecution | null): string => {
    if (!currentExecution?.step || !process) return ''

    const flowAnalysis = analyzeWorkflowFlow(process, currentExecution)
    const nextActionStep = getNextActionStep(process, currentExecution)
    const previousActionStep = getPreviousActionStep(process, currentExecution)

    if (flowAnalysis.hasPendingAction) {
      // Usuário deve executar ação pendente
      switch (flowAnalysis.pendingActionType) {
        case 'sign':
          return 'Etapa atual: Assinar documento - Execute a assinatura para avançar o processo ou use navegação'
        case 'approve':
          return 'Etapa atual: Aprovar/Reprovar - Aprove ou reprove a solicitação para avançar o processo ou use navegação'
        default:
          return 'Etapa atual: Ação pendente - Execute uma ação para avançar o processo ou use navegação'
      }
    } else if (nextActionStep) {
      // Usuário está solicitando ação
      switch (nextActionStep.action_type) {
        case 'sign':
          return 'Clique em "Solicitar Assinatura" para enviar o processo para o próximo usuário ou use navegação'
        case 'approve':
          return 'Clique em "Solicitar Aprovação" para enviar o processo para o próximo usuário ou use navegação'
        default:
          return 'Clique em "Solicitar Aprovação" para enviar o processo para o próximo usuário ou use navegação'
      }
    } else {
      // Usuário está em etapa normal
      return 'Execute uma ação para avançar o processo ou use os botões de navegação'
    }
  }, [analyzeWorkflowFlow, getNextActionStep, getPreviousActionStep])

  // Função principal para aplicar regras do workflow
  const applyWorkflowRules = useCallback((process: WorkflowProcess, currentExecution: WorkflowExecution | null): WorkflowRulesResult => {
    const availableActions = getAvailableActions(process, currentExecution)
    const nextActionStep = getNextActionStep(process, currentExecution)
    const previousActionStep = getPreviousActionStep(process, currentExecution)
    const flowAnalysis = analyzeWorkflowFlow(process, currentExecution)
    const contextualMessage = getContextualMessage(process, currentExecution)

    // Determinar se o usuário está solicitando ou executando
    const isRequesting = nextActionStep !== null && !flowAnalysis.hasPendingAction
    const isExecuting = flowAnalysis.hasPendingAction || (previousActionStep !== null && !isRequesting)

    return {
      availableActions,
      isRequesting,
      isExecuting,
      actionType: flowAnalysis.pendingActionType || nextActionStep?.action_type || null,
      nextActionStep,
      previousActionStep,
      flowContext: {
        currentStep: currentExecution?.step || null,
        hasPendingAction: flowAnalysis.hasPendingAction,
        pendingActionType: flowAnalysis.pendingActionType,
        flowType: flowAnalysis.flowContext?.flowType || null
      },
      contextualMessage
    }
  }, [getAvailableActions, getNextActionStep, getPreviousActionStep, analyzeWorkflowFlow, getContextualMessage])

  return {
    applyWorkflowRules,
    getAvailableActions,
    getNextActionStep,
    getPreviousActionStep,
    analyzeWorkflowFlow,
    getContextualMessage
  }
}
