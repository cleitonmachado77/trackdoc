import { useState, useCallback } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

const supabase = createClientSupabaseClient()

export interface WorkflowComplianceResult {
  isCompliant: boolean
  violations: string[]
  currentStepInfo: {
    stepId: string
    stepName: string
    stepType: string
    stepOrder: number
    departmentName?: string
    userName?: string
    permissions?: string[]
    actionType?: string
    actionData?: any
  }
}

export interface ComplianceEnforcementResult {
  success: boolean
  actionsTaken: string[]
  errorMessage?: string
}

export interface ComplianceReport {
  processId: string
  processName: string
  templateName: string
  currentStepName: string
  stepType: string
  isCompliant: boolean
  violations: string[]
  lastValidation: string
}

export function useWorkflowCompliance() {
  // const { toast } = useToast() // Removido temporariamente para resolver erro de hooks
  const [isValidating, setIsValidating] = useState(false)
  const [isEnforcing, setIsEnforcing] = useState(false)

  // Validar se um processo está seguindo exatamente as regras do fluxo
  const validateProcessCompliance = useCallback(async (
    processId: string
  ): Promise<WorkflowComplianceResult | null> => {
    try {
      setIsValidating(true)

      const { data, error } = await supabase.rpc('validate_workflow_rules_compliance', {
        p_process_id: processId
      })

      if (error) {
        console.error('Erro ao validar compliance:', error)
        // toast removido temporariamente
        return null
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return null
      }

      const result = Array.isArray(data) ? data[0] : data
      return {
        isCompliant: result.is_compliant,
        violations: result.violations || [],
        currentStepInfo: result.current_step_info || {}
      }
    } catch (error) {
      console.error('Erro ao validar compliance:', error)
      // toast removido temporariamente
      return null
    } finally {
      setIsValidating(false)
    }
  }, [])

  // Forçar o processo a seguir exatamente as regras do fluxo
  const enforceWorkflowRules = useCallback(async (
    processId: string
  ): Promise<ComplianceEnforcementResult | null> => {
    try {
      setIsEnforcing(true)

      const { data, error } = await supabase.rpc('enforce_workflow_rules', {
        p_process_id: processId
      })

      if (error) {
        console.error('Erro ao forçar compliance:', error)
        // toast removido temporariamente
        return null
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return null
      }

      const result = Array.isArray(data) ? data[0] : data
      return {
        success: result.success,
        actionsTaken: result.actions_taken || [],
        errorMessage: result.error_message
      }
    } catch (error) {
      console.error('Erro ao forçar compliance:', error)
      // toast removido temporariamente
      return null
    } finally {
      setIsEnforcing(false)
    }
  }, [])

  // Validar e corrigir todos os processos ativos
  const validateAllActiveProcesses = useCallback(async (): Promise<ComplianceReport[]> => {
    try {
      setIsValidating(true)

      const { data, error } = await supabase.rpc('validate_all_active_processes')

      if (error) {
        console.error('Erro ao validar todos os processos:', error)
        // toast removido temporariamente
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao validar todos os processos:', error)
      toast({
        title: "Erro",
        description: "Erro ao validar todos os processos ativos",
        variant: "destructive",
      })
      return []
    } finally {
      setIsValidating(false)
    }
  }, [])

  // Monitorar compliance em tempo real
  const monitorCompliance = useCallback(async (): Promise<{
    totalProcesses: number
    compliantProcesses: number
    nonCompliantProcesses: number
    complianceRate: number
  } | null> => {
    try {
      const { data, error } = await supabase.rpc('monitor_workflow_compliance')

      if (error) {
        console.error('Erro ao monitorar compliance:', error)
        return null
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return null
      }

      const result = Array.isArray(data) ? data[0] : data
      return {
        totalProcesses: result.total_processes,
        compliantProcesses: result.compliant_processes,
        nonCompliantProcesses: result.non_compliant_processes,
        complianceRate: result.compliance_rate
      }
    } catch (error) {
      console.error('Erro ao monitorar compliance:', error)
      return null
    }
  }, [])

  // Gerar relatório de compliance
  const generateComplianceReport = useCallback(async (): Promise<ComplianceReport[]> => {
    try {
      const { data, error } = await supabase.rpc('generate_compliance_report')

      if (error) {
        console.error('Erro ao gerar relatório:', error)
        // toast removido temporariamente
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de compliance",
        variant: "destructive",
      })
      return []
    }
  }, [])

  // Validar compliance antes de executar uma ação
  const validateBeforeAction = useCallback(async (
    processId: string,
    action: string
  ): Promise<{
    canExecute: boolean
    violations: string[]
    requiredActions: string[]
  }> => {
    try {
      const compliance = await validateProcessCompliance(processId)
      
      if (!compliance) {
        return {
          canExecute: false,
          violations: ['Erro ao validar compliance'],
          requiredActions: []
        }
      }

      if (!compliance.isCompliant) {
        return {
          canExecute: false,
          violations: compliance.violations,
          requiredActions: []
        }
      }

      // Verificar se a ação é válida para o tipo de etapa
      const stepInfo = compliance.currentStepInfo
      let requiredActions: string[] = []

      switch (stepInfo.stepType) {
        case 'user':
          requiredActions = ['approve', 'comment']
          break
        case 'department':
          requiredActions = ['approve', 'comment']
          break
        case 'action':
          if (stepInfo.actionType === 'sign') {
            requiredActions = ['sign', 'approve']
          } else if (stepInfo.actionType === 'approve') {
            requiredActions = ['approve', 'reject']
          }
          break
        default:
          requiredActions = ['approve', 'reject', 'sign', 'comment']
      }

      const canExecute = requiredActions.includes(action)

      return {
        canExecute,
        violations: canExecute ? [] : [`Ação "${action}" não é válida para este tipo de etapa`],
        requiredActions
      }
    } catch (error) {
      console.error('Erro ao validar antes da ação:', error)
      return {
        canExecute: false,
        violations: ['Erro ao validar ação'],
        requiredActions: []
      }
    }
  }, [validateProcessCompliance])

  // Forçar compliance e executar ação
  const enforceAndExecute = useCallback(async (
    processId: string,
    action: string
  ): Promise<{
    success: boolean
    message: string
    actionsTaken: string[]
  }> => {
    try {
      // Primeiro, validar compliance
      const compliance = await validateProcessCompliance(processId)
      
      if (!compliance) {
        return {
          success: false,
          message: 'Erro ao validar compliance do processo',
          actionsTaken: []
        }
      }

      // Se não está em compliance, tentar corrigir
      if (!compliance.isCompliant) {
        const enforcement = await enforceWorkflowRules(processId)
        
        if (!enforcement || !enforcement.success) {
          return {
            success: false,
            message: enforcement?.errorMessage || 'Erro ao forçar compliance do processo',
            actionsTaken: enforcement?.actionsTaken || []
          }
        }

        // Verificar se ainda há violações após correção
        const newCompliance = await validateProcessCompliance(processId)
        if (!newCompliance || !newCompliance.isCompliant) {
          return {
            success: false,
            message: 'Processo ainda não está em compliance após correção',
            actionsTaken: enforcement.actionsTaken
          }
        }

        return {
          success: true,
          message: 'Compliance forçado com sucesso',
          actionsTaken: enforcement.actionsTaken
        }
      }

      return {
        success: true,
        message: 'Processo já está em compliance',
        actionsTaken: []
      }
    } catch (error) {
      console.error('Erro ao forçar compliance e executar:', error)
      return {
        success: false,
        message: 'Erro ao forçar compliance do processo',
        actionsTaken: []
      }
    }
  }, [validateProcessCompliance, enforceWorkflowRules])

  return {
    isValidating,
    isEnforcing,
    validateProcessCompliance,
    enforceWorkflowRules,
    validateAllActiveProcesses,
    monitorCompliance,
    generateComplianceReport,
    validateBeforeAction,
    enforceAndExecute
  }
}
