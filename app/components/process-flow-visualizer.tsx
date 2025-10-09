"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Building, 
  FileText,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientSupabaseClient } from "@/lib/supabase/client"

const supabase = createClientSupabaseClient()

interface ProcessFlowStep {
  id: string
  step_name: string
  step_type: 'department' | 'user' | 'approval' | 'notification' | 'condition' | 'action'
  step_order: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped'
  assigned_user?: {
    id: string
    full_name: string
    email: string
  }
  assigned_department?: {
    id: string
    name: string
  }
  // ✅ NOVO: Todos os usuários do departamento
  department_users?: {
    id: string
    full_name: string
    email: string
  }[]
  comments?: string
  action_taken?: string
  started_at?: string
  completed_at?: string
}

interface ProcessFlowVisualizerProps {
  templateId: string
  currentStepId?: string
  completedSteps?: string[]
  processId?: string // Adicionar processId para filtrar execuções
  className?: string
}

export default function ProcessFlowVisualizer({
  templateId,
  currentStepId,
  completedSteps = [],
  processId,
  className
}: ProcessFlowVisualizerProps) {
  const [steps, setSteps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [templateInfo, setTemplateInfo] = useState<{name: string, description?: string} | null>(null)
  const [targetUsersMap, setTargetUsersMap] = useState<Map<string, any[]>>(new Map())

  useEffect(() => {
    loadWorkflowSteps()
  }, [templateId, processId])

  const loadWorkflowSteps = async () => {
    try {
      setLoading(true)
      
      // Buscar informações do template
      const { data: template, error: templateError } = await supabase
        .from('process_templates')
        .select('id, name, description')
        .eq('id', templateId)
        .single()

      if (templateError) {
        console.error('Erro ao buscar template:', templateError)
      } else {
        setTemplateInfo(template)
      }
      
      // Buscar etapas reais do template do workflow
      const { data: workflowSteps, error: stepsError } = await supabase
        .from('process_steps')
        .select(`
          id,
          step_name,
          step_type,
          step_order,
          department_id,
          user_id,
          permissions,
          action_type,
          action_data,
          department:departments(
            id,
            name
          ),
          user:profiles!process_steps_user_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('workflow_template_id', templateId)
        .order('step_order', { ascending: true })

      if (stepsError) {
        console.error('Erro ao buscar etapas do workflow:', stepsError)
        setSteps([])
        return
      }

      // Buscar execuções reais do processo para determinar status
      let executions: any[] = []
      if (processId) {
        const { data: executionsData, error: executionsError } = await supabase
          .from('process_executions')
          .select(`
            id,
            step_id,
            status,
            assigned_to,
            assigned_department_id,
            started_at,
            completed_at,
            comments,
            action_taken,
            assigned_user:profiles!process_executions_assigned_to_fkey(
              id,
              full_name,
              email
            ),
            assigned_department:departments(
              id,
              name
            )
          `)
          .eq('process_id', processId)
          .in('step_id', workflowSteps?.map(step => step.id) || [])

        if (executionsError) {
          console.error('Erro ao buscar execuções:', executionsError)
        } else {
          executions = executionsData || []
        }
      }

      // ✅ CORREÇÃO: Buscar usuários dos departamentos de forma assíncrona
      const departmentUsersMap = new Map<string, any[]>()
      
      // ✅ NOVO: Buscar usuários target para nós de ação
      const newTargetUsersMap = new Map<string, any[]>()
      
      // Buscar usuários para todos os departamentos de uma vez
      const departmentSteps = (workflowSteps || []).filter(step => 
        step.step_type === 'department' && step.department_id
      )
      
      // Buscar usuários target para nós de ação
      const actionSteps = (workflowSteps || []).filter(step => 
        step.step_type === 'action' && step.action_data && step.action_data.targetUsers
      )
      
      console.log('🔍 [ProcessFlowVisualizer] Action steps encontrados:', actionSteps.length)
      
      for (const step of actionSteps) {
        console.log('🔍 [ProcessFlowVisualizer] Processando step:', {
          id: step.id,
          step_name: step.step_name,
          action_data: step.action_data,
          targetUsers: step.action_data.targetUsers,
          targetUserDetails: step.action_data.targetUserDetails
        })
        
        if (step.action_data.targetUsers && step.action_data.targetUsers.length > 0) {
          // ✅ CORREÇÃO: Usar targetUserDetails se disponível, senão buscar no banco
          if (step.action_data.targetUserDetails && step.action_data.targetUserDetails.length > 0) {
            console.log('✅ [ProcessFlowVisualizer] Usando targetUserDetails salvos:', step.action_data.targetUserDetails)
            newTargetUsersMap.set(step.id, step.action_data.targetUserDetails)
          } else {
            console.log('⚠️ [ProcessFlowVisualizer] targetUserDetails não encontrados, buscando no banco...')
            console.log('🔍 [ProcessFlowVisualizer] Buscando usuários com IDs:', step.action_data.targetUsers)
            const { data: targetUsersData } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', step.action_data.targetUsers)
            
            console.log('🔍 [ProcessFlowVisualizer] Usuários encontrados no banco:', targetUsersData)
            newTargetUsersMap.set(step.id, targetUsersData || [])
          }
        }
      }
      
      for (const step of departmentSteps) {
        let departmentUsers: any[] = []
        
        // Verificar se há usuários selecionados no action_data
        if (step.action_data && typeof step.action_data === 'object' && step.action_data.selectedUsers) {
          // Buscar informações dos usuários selecionados
          const { data: selectedUsersData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', step.action_data.selectedUsers)
          
          departmentUsers = selectedUsersData || []
        } else {
          // Fallback: buscar todos os usuários do departamento
          const { data: allUsersData } = await supabase
            .from('user_departments')
            .select(`
              user:profiles!user_departments_user_id_fkey(
                id,
                full_name,
                email
              )
            `)
            .eq('department_id', step.department_id)
          
          departmentUsers = allUsersData?.map(ud => ud.user).filter(Boolean) || []
        }
        
        departmentUsersMap.set(step.id, departmentUsers)
      }

      // Mapear etapas com status baseado nas execuções
      const stepsWithStatus: any[] = (workflowSteps || []).map((step: any) => {
        // Encontrar execução mais recente para esta etapa
        const stepExecution = executions?.find((exec: any) => exec.step_id === step.id)
        
        // Determinar status da etapa
        let status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped' = 'pending'
        
        if (stepExecution) {
          status = stepExecution.status as any
        } else if (step.id === currentStepId) {
          status = 'in_progress'
        } else if (completedSteps?.includes(step.id)) {
          status = 'completed'
        }
        
        // Se não há execuções pendentes para este processo, marcar todas as etapas como concluídas
        if (processId && executions.length > 0 && !executions.some(exec => exec.status === 'pending')) {
          if (stepExecution && stepExecution.status !== 'completed') {
            status = 'completed'
          } else if (!stepExecution) {
            status = 'completed'
          }
        }

        return {
          id: step.id,
          step_name: step.step_name,
          step_type: step.step_type as any,
          step_order: step.step_order,
          status,
          // ✅ CORREÇÃO: Incluir action_data para nós de ação
          action_data: step.action_data || null,
          action_type: step.action_type || null,
          assigned_user: stepExecution?.assigned_user || (step.user && !Array.isArray(step.user) ? {
            id: step.user.id,
            full_name: step.user.full_name,
            email: step.user.email
          } : undefined),
          assigned_department: stepExecution?.assigned_department || (step.department && !Array.isArray(step.department) ? {
            id: step.department.id,
            name: step.department.name
          } : undefined),
          // ✅ NOVO: Adicionar todos os usuários do departamento
          department_users: departmentUsersMap.get(step.id) || [],
          comments: stepExecution?.comments,
          action_taken: stepExecution?.action_taken,
          started_at: stepExecution?.started_at,
          completed_at: stepExecution?.completed_at
        }
      })

      setSteps(stepsWithStatus)
      setTargetUsersMap(newTargetUsersMap)
    } catch (error) {
      console.error('Erro ao carregar passos do workflow:', error)
      setSteps([])
      setTargetUsersMap(new Map())
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'department':
        return <Building className="h-4 w-4" />
      case 'approval':
        return <CheckCircle className="h-4 w-4" />
      case 'action':
        return <FileText className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'skipped':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStepStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'in_progress':
        return 'Em Andamento'
      case 'pending':
        return 'Pendente'
      case 'cancelled':
        return 'Cancelado'
      case 'skipped':
        return 'Pulado'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fluxo do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (steps.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fluxo do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Nenhuma etapa encontrada</p>
            <p className="text-sm text-gray-500">
              Este template de workflow não possui etapas configuradas ou não foi possível carregar as informações.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Fluxo do Processo
        </CardTitle>
        {templateInfo && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900">{templateInfo.name}</p>
            {templateInfo.description && (
              <p className="text-xs text-gray-600 mt-1">{templateInfo.description}</p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              {/* Número da etapa */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                step.status === 'completed' ? 'bg-green-100 text-green-600' :
                step.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                step.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                'bg-gray-100 text-gray-600'
              )}>
                {index + 1}
              </div>

              {/* Conteúdo da etapa */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStepIcon(step.step_type)}
                  <span className="font-medium text-sm">{step.step_name}</span>
                  <Badge className={cn("text-xs", getStepStatusColor(step.status))}>
                    {getStepStatusText(step.status)}
                  </Badge>
                </div>

                {/* Informações da atribuição */}
                <div className="text-xs text-gray-600 space-y-1">
                  {step.assigned_user && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{step.assigned_user.full_name}</span>
                    </div>
                  )}
                  {step.assigned_department && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span>{step.assigned_department.name}</span>
                    </div>
                  )}
                  {/* ✅ NOVO: Mostrar todos os usuários do departamento */}
                  {step.department_users && step.department_users.length > 0 && (
                    <div className="space-y-1">
                      {step.department_users.map((user, userIndex) => (
                        <div key={user.id} className="flex items-center gap-1 ml-4">
                          <User className="h-3 w-3" />
                          <span>{user.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* ✅ NOVO: Mostrar usuários target para nós de ação */}
                  {(() => {
                    const shouldShow = step.step_type === 'action' && step.action_data && step.action_data.targetUsers && step.action_data.targetUsers.length > 0
                    console.log('🔍 [ProcessFlowVisualizer] Verificando se deve exibir usuários para step', step.id, ':', {
                      step_type: step.step_type,
                      has_action_data: !!step.action_data,
                      has_targetUsers: !!step.action_data?.targetUsers,
                      targetUsers_length: step.action_data?.targetUsers?.length,
                      shouldShow
                    })
                    return shouldShow
                  })() && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-blue-600">Usuários que devem {step.action_type === 'sign' ? 'assinar' : 'aprovar'}:</div>
                      {(() => {
                        const users = targetUsersMap.get(step.id) || []
                        console.log('🔍 [ProcessFlowVisualizer] Exibindo usuários para step', step.id, ':', users)
                        console.log('🔍 [ProcessFlowVisualizer] Condições de exibição:', {
                          step_type: step.step_type,
                          has_action_data: !!step.action_data,
                          has_targetUsers: !!step.action_data?.targetUsers,
                          targetUsers_length: step.action_data?.targetUsers?.length,
                          users_from_map: users.length
                        })
                        return users.map((user: any, userIndex: number) => (
                          <div key={user.id} className="flex items-center gap-1 ml-4">
                            <User className="h-3 w-3" />
                            <span>{user.full_name}</span>
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                </div>

                {/* Comentários e ações */}
                {step.comments && (
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Comentários:</strong> {step.comments}
                  </div>
                )}
                {step.action_taken && (
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Ação:</strong> {step.action_taken}
                  </div>
                )}

                {/* Datas */}
                <div className="text-xs text-gray-400 mt-1 space-y-1">
                  {step.started_at && (
                    <div>Iniciado: {formatDate(step.started_at)}</div>
                  )}
                  {step.completed_at && (
                    <div>Concluído: {formatDate(step.completed_at)}</div>
                  )}
                </div>
              </div>

              {/* Seta para próxima etapa */}
              {index < steps.length - 1 && (
                <div className="flex-shrink-0">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Estatísticas do fluxo */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {steps.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-600">Concluídos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {steps.filter(s => s.status === 'in_progress').length}
              </div>
              <div className="text-xs text-gray-600">Em Andamento</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {steps.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600">Pendentes</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
