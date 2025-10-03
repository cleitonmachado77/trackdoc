'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useWorkflowProcesses } from '@/hooks/use-workflow-processes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import ProcessDetailsModal from './process-details-modal'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  User, 
  Building2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye,
  RefreshCw,
  AlertCircle,
  Wrench,
  Play
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface WorkflowExecution {
  id: string
  status: string
  assigned_to?: string
  assigned_department_id?: string
  created_at: string
  step: {
    id: string
    step_name: string
    step_type: string
    permissions: string[]
  }
  process: {
    id: string
    process_name: string
    document: {
      id: string
      title: string
      status: string
    }
  }
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

export default function PendingWorkflowExecutions() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { fixActionNodeExecutions, fixAssignmentsForLuana, fetchProcessDetails } = useWorkflowProcesses()
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'sign' | null>(null)
  const [comments, setComments] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [isFixingLuana, setIsFixingLuana] = useState(false)
  const [isCheckingLuana, setIsCheckingLuana] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  
  // Estados para o modal de detalhes do processo
  const [showProcessDetails, setShowProcessDetails] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [loadingProcessDetails, setLoadingProcessDetails] = useState(false)

  // Função para buscar execuções pendentes - MOVIDA PARA ANTES DO useEffect
  const fetchPendingExecutions = useCallback(async () => {
    try {
      setLoading(true)
      
      console.log('🔍 [UI] Buscando execuções pendentes para usuário:', user?.id)
      
      // Buscar execuções pendentes onde o usuário está atribuído
      const { data: userExecutions, error: userError } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          step:workflow_steps(
            id,
            step_name,
            step_type,
            permissions
          ),
          process:workflow_processes(
            id,
            process_name,
            document:documents(
              id,
              title,
              status
            )
          ),
          assigned_user:profiles!workflow_executions_assigned_to_fkey(
            id,
            full_name
          ),
          assigned_department:departments!workflow_executions_assigned_department_id_fkey(
            id,
            name
          )
        `)
        .eq('status', 'pending')
        .eq('assigned_to', user?.id)
        .order('created_at', { ascending: false })

      if (userError) {
        console.error('❌ [UI] Erro ao buscar execuções do usuário:', userError)
        throw userError
      }

      console.log('📋 [UI] Execuções do usuário encontradas:', userExecutions?.length || 0)

      // Buscar execuções pendentes onde o usuário está em departamentos atribuídos
      const { data: userDepartments } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', user?.id)

      let departmentExecutions: any[] = []
      
      if (userDepartments && userDepartments.length > 0) {
        const departmentIds = userDepartments.map(ud => ud.department_id)
        
        const { data: deptExecs, error: deptError } = await supabase
          .from('workflow_executions')
          .select(`
            *,
            step:workflow_steps(
              id,
              step_name,
              step_type,
              permissions
            ),
            process:workflow_processes(
              id,
              process_name,
              document:documents(
                id,
                title,
                status
              )
            ),
            assigned_user:profiles!workflow_executions_assigned_to_fkey(
              id,
              full_name
            ),
            assigned_department:departments!workflow_executions_assigned_department_id_fkey(
              id,
              name
            )
          `)
          .eq('status', 'pending')
          .in('assigned_department_id', departmentIds)
          .is('assigned_to', null)
          .order('created_at', { ascending: false })

        if (deptError) {
          console.error('❌ [UI] Erro ao buscar execuções do departamento:', deptError)
        } else {
          departmentExecutions = deptExecs || []
          console.log('🏢 [UI] Execuções do departamento encontradas:', departmentExecutions.length)
        }
      }

      // Combinar e remover duplicatas
      const allExecutions = [...(userExecutions || []), ...departmentExecutions]
      const uniqueExecutions = allExecutions.filter((exec, index, self) => 
        index === self.findIndex(e => e.id === exec.id)
      )

      console.log('📊 [UI] Total de execuções únicas:', uniqueExecutions.length)
      setExecutions(uniqueExecutions)
      
    } catch (error) {
      console.error('❌ [UI] Erro ao buscar execuções pendentes:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar execuções pendentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  // Função para abrir o modal de detalhes do processo
  const handleOpenProcessDetails = async (execution: WorkflowExecution) => {
    try {
      setLoadingProcessDetails(true)
      setSelectedProcess(null)
      
      console.log('🔍 [PendingExecutions] Buscando detalhes do processo:', execution.process.id)
      
      // Buscar detalhes completos do processo
      const processDetails = await fetchProcessDetails(execution.process.id)
      
      if (processDetails) {
        console.log('✅ [PendingExecutions] Detalhes do processo carregados:', processDetails)
        setSelectedProcess(processDetails)
        setShowProcessDetails(true)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do processo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ [PendingExecutions] Erro ao carregar detalhes do processo:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar os detalhes do processo",
        variant: "destructive",
      })
    } finally {
      setLoadingProcessDetails(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchPendingExecutions()
    }
  }, [user?.id]) // Removido fetchPendingExecutions das dependências para evitar loops

  // Função para corrigir execuções de nós de ação
  const handleFixActionNodes = async () => {
    try {
      setIsFixing(true)
      
      console.log('🔧 [UI] Iniciando correção manual de nós de ação...')
      
      await fixActionNodeExecutions()
      
      console.log('✅ [UI] Correção manual concluída')
      
      toast({
        title: "Correção aplicada",
        description: "Execuções de nós de ação foram corrigidas. Recarregando...",
      })
      
      // Recarregar execuções
      await fetchPendingExecutions()
    } catch (error) {
      console.error('❌ [UI] Erro ao corrigir nós de ação:', error)
      toast({
        title: "Erro",
        description: "Erro ao corrigir execuções de nós de ação",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  // Função para debug das execuções
  const handleDebugExecutions = async () => {
    try {
      setIsDebugging(true)
      
      console.log('🔍 [DEBUG] Verificando estado atual das execuções...')
      
      // Buscar todas as execuções pendentes
      const { data: allExecutions, error } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          step:workflow_steps(
            id,
            step_name,
            step_type,
            step_order,
            action_type,
            user_id,
            department_id,
            workflow_template_id
          ),
          process:workflow_processes(
            id,
            process_name,
            workflow_template_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('🔍 [DEBUG] Todas as execuções pendentes:', allExecutions)
      
      // Filtrar execuções de nós de ação
      const actionExecutions = allExecutions?.filter(exec => 
        exec.step && exec.step.step_type === 'action'
      ) || []
      
      console.log('🔍 [DEBUG] Execuções de nós de ação:', actionExecutions)
      
      // Filtrar execuções sem atribuição
      const unassignedExecutions = allExecutions?.filter(exec => 
        !exec.assigned_to && !exec.assigned_department_id
      ) || []
      
      console.log('🔍 [DEBUG] Execuções sem atribuição:', unassignedExecutions)
      
      toast({
        title: "Debug concluído",
        description: `Encontradas ${actionExecutions.length} execuções de ação e ${unassignedExecutions.length} sem atribuição. Verifique o console.`,
      })
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro no debug:', error)
      toast({
        title: "Erro no debug",
        description: "Erro ao verificar execuções",
        variant: "destructive",
      })
    } finally {
      setIsDebugging(false)
    }
  }

  // Função para corrigir atribuições especificamente para Luana Gabriela
  const handleFixForLuana = async () => {
    try {
      setIsFixingLuana(true)
      
      console.log('🔧 [UI] Iniciando correção específica para Luana Gabriela...')
      
      await fixAssignmentsForLuana()
      
      console.log('✅ [UI] Correção específica para Luana concluída')
      
      toast({
        title: "Correção para Luana aplicada",
        description: "Execuções foram corrigidas especificamente para Luana Gabriela. Recarregando...",
      })
      
      // Recarregar execuções
      await fetchPendingExecutions()
    } catch (error) {
      console.error('❌ [UI] Erro ao corrigir para Luana:', error)
      toast({
        title: "Erro",
        description: "Erro ao corrigir execuções para Luana Gabriela",
        variant: "destructive",
      })
    } finally {
      setIsFixingLuana(false)
    }
  }

  // Função para verificar especificamente as execuções da Luana
  const handleCheckLuanaExecutions = async () => {
    try {
      setIsCheckingLuana(true)
      
      console.log('🔍 [UI] Verificando execuções específicas da Luana...')
      
      // Buscar ID da Luana
      const { data: luana, error: luanaError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('full_name', 'Luana Gabriela')
        .single()

      if (luanaError || !luana) {
        console.error('❌ [UI] Luana não encontrada:', luanaError)
        toast({
          title: "Erro",
          description: "Luana Gabriela não encontrada",
          variant: "destructive",
        })
        return
      }

      console.log('🔍 [UI] Luana encontrada:', luana)

      // Buscar execuções atribuídas à Luana
      const { data: luanaExecutions, error: execError } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          step:workflow_steps(
            id,
            step_name,
            step_type,
            step_order,
            action_type
          ),
          process:workflow_processes(
            id,
            process_name
          )
        `)
        .eq('assigned_to', luana.id)
        .eq('status', 'pending')

      if (execError) throw execError

      console.log('🔍 [UI] Execuções atribuídas à Luana:', luanaExecutions?.length || 0, luanaExecutions)

      // Buscar execuções de nós de ação que deveriam estar com a Luana
      const { data: actionExecutions, error: actionError } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          step:workflow_steps(
            id,
            step_name,
            step_type,
            step_order,
            action_type,
            workflow_template_id
          ),
          process:workflow_processes(
            id,
            process_name
          )
        `)
        .eq('status', 'pending')
        .eq('step.step_type', 'action')

      if (actionError) throw actionError

      console.log('🔍 [UI] Todas as execuções de nós de ação:', actionExecutions?.length || 0, actionExecutions)

      toast({
        title: "Verificação concluída",
        description: `Luana tem ${luanaExecutions?.length || 0} execuções. ${actionExecutions?.length || 0} execuções de ação pendentes. Verifique o console.`,
      })
      
    } catch (error) {
      console.error('❌ [UI] Erro na verificação:', error)
      toast({
        title: "Erro na verificação",
        description: "Erro ao verificar execuções da Luana",
        variant: "destructive",
      })
    } finally {
      setIsCheckingLuana(false)
    }
  }

  // Função para recarregar execuções
  const handleReloadExecutions = async () => {
    try {
      setIsReloading(true)
      
      console.log('🔄 [UI] Recarregando execuções...')
      
      await fetchPendingExecutions()
      
      console.log('✅ [UI] Execuções recarregadas')
      
      toast({
        title: "Execuções recarregadas",
        description: "Lista de execuções foi atualizada.",
      })
      
    } catch (error) {
      console.error('❌ [UI] Erro ao recarregar:', error)
      toast({
        title: "Erro ao recarregar",
        description: "Erro ao recarregar execuções",
        variant: "destructive",
      })
    } finally {
      setIsReloading(false)
    }
  }

  // Função para forçar busca direta das execuções da Luana
  const handleForceCheckLuana = async () => {
    try {
      setIsReloading(true)
      
      console.log('🔍 [UI] Forçando busca direta das execuções da Luana...')
      
      // Buscar ID da Luana
      const { data: luana, error: luanaError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('full_name', 'Luana Gabriela')
        .maybeSingle()

      if (luanaError || !luana) {
        console.error('❌ [UI] Luana não encontrada:', luanaError)
        toast({
          title: "Erro",
          description: "Luana Gabriela não encontrada",
          variant: "destructive",
        })
        return
      }

      console.log('🔍 [UI] Luana encontrada:', luana)

      // Buscar execuções diretamente atribuídas à Luana
      const { data: luanaExecutions, error: execError } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          step:workflow_steps(
            id,
            step_name,
            step_type,
            step_order,
            action_type,
            permissions
          ),
          process:workflow_processes(
            id,
            process_name,
            document:documents(
              id,
              title,
              status
            )
          ),
          assigned_user:profiles!workflow_executions_assigned_to_fkey(
            id,
            full_name,
            email
          ),
          assigned_department:departments!workflow_executions_assigned_department_id_fkey(
            id,
            name
          )
        `)
        .eq('assigned_to', luana.id)
        .eq('status', 'pending')

      if (execError) throw execError

      console.log('🔍 [UI] Execuções encontradas para Luana:', luanaExecutions?.length || 0, luanaExecutions)

      // Atualizar estado diretamente
      setExecutions(luanaExecutions || [])
      
      toast({
        title: "Busca direta concluída",
        description: `Encontradas ${luanaExecutions?.length || 0} execuções para Luana.`,
      })
      
    } catch (error) {
      console.error('❌ [UI] Erro na busca direta:', error)
      toast({
        title: "Erro na busca direta",
        description: "Erro ao buscar execuções da Luana",
        variant: "destructive",
      })
    } finally {
      setIsReloading(false)
    }
  }

  // Função para corrigir e atualizar interface em uma única ação
  const handleFixAndUpdate = async () => {
    try {
      setIsReloading(true)
      
      console.log('🔧 [UI] Iniciando correção e atualização completa...')
      
      // 1. Executar correção para Luana
      await fixAssignmentsForLuana()
      
      // 2. Aguardar um pouco para garantir que a correção foi aplicada
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 3. Forçar busca direta
      await handleForceCheckLuana()
      
      console.log('✅ [UI] Correção e atualização completa concluída')
      
      toast({
        title: "Correção completa",
        description: "Correção aplicada e interface atualizada.",
      })
      
    } catch (error) {
      console.error('❌ [UI] Erro na correção completa:', error)
      toast({
        title: "Erro na correção",
        description: "Erro ao executar correção completa",
        variant: "destructive",
      })
    } finally {
      setIsReloading(false)
    }
  }

  // ✅ FUNÇÃO REMOVIDA - Já declarada acima com useCallback

  const handleAction = async (action: 'approve' | 'reject' | 'sign') => {
    if (!selectedExecution) return

    try {
      setIsProcessing(true)
      
      // Executar ação usando a função RPC
      const { data: newExecutionId, error } = await supabase.rpc('advance_workflow_step', {
        p_process_id: selectedExecution.process.id,
        p_execution_id: selectedExecution.id,
        p_action: action,
        p_comments: comments || null
      })

      if (error) {
        console.error('Erro ao executar ação:', error)
        throw error
      }

      toast({
        title: "Ação executada com sucesso!",
        description: `A etapa foi ${action === 'approve' ? 'aprovada' : action === 'reject' ? 'rejeitada' : 'assinada'} com sucesso.`,
      })

      // Atualizar lista
      await fetchPendingExecutions()
      
      // Fechar modal
      setShowActionDialog(false)
      setSelectedExecution(null)
      setActionType(null)
      setComments('')
      
    } catch (error) {
      console.error('Erro ao executar ação:', error)
      toast({
        title: "Erro ao executar ação",
        description: "Ocorreu um erro ao executar a ação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'department':
        return <Building2 className="h-4 w-4" />
      case 'approval':
        return <CheckCircle className="h-4 w-4" />
      case 'action':
        return <FileText className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStepTypeColor = (stepType: string) => {
    switch (stepType) {
      case 'user':
        return 'bg-green-100 text-green-800'
      case 'department':
        return 'bg-blue-100 text-blue-800'
      case 'approvação':
        return 'bg-purple-100 text-purple-800'
      case 'action':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Determinar status do processo
  const getProcessStatus = (execution: WorkflowExecution) => {
    const stepType = execution.step.step_type
    const stepName = execution.step.step_name
    
    // Se é um nó de ação, verificar o tipo de ação
    if (stepType === 'action') {
      // Aqui você pode adicionar lógica para determinar o tipo de ação
      // Por enquanto, vamos assumir que é aprovação
      return { status: 'pending_approval', label: 'Aguardando Aprovação', color: 'blue' }
    }
    
    // Se é usuário ou departamento
    if (stepType === 'user' || stepType === 'department') {
      return { status: 'in_progress', label: `Em: ${stepName}`, color: 'green' }
    }
    
    return { status: 'active', label: 'Ativo', color: 'green' }
  }

  const getAvailableActions = (execution: WorkflowExecution) => {
    const actions: string[] = []
    
    switch (execution.step.step_type) {
      case 'approval':
        actions.push('approve', 'reject')
        break
      case 'action':
        actions.push('approve', 'reject', 'sign')
        break
      case 'user':
      case 'department':
        actions.push('approve', 'reject')
        break
      default:
        actions.push('approve')
    }
    
    return actions
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Execuções Pendentes
          </CardTitle>
          <CardDescription>
            Carregando execuções pendentes de aprovação...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Execuções Pendentes
            </CardTitle>
            <CardDescription>
              {executions.length} execução(ões) pendente(s) de sua ação
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDebugExecutions}
              disabled={isDebugging}
              className="flex items-center gap-2"
            >
              {isDebugging ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Debugando...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Debug
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFixActionNodes}
              disabled={isFixing}
              className="flex items-center gap-2"
            >
              {isFixing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Corrigindo...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Corrigir Nós de Ação
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFixForLuana}
              disabled={isFixingLuana}
              className="flex items-center gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              {isFixingLuana ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  Corrigindo para Luana...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Corrigir para Luana
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckLuanaExecutions}
              disabled={isCheckingLuana}
              className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              {isCheckingLuana ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  Verificando Luana...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Verificar Luana
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReloadExecutions}
              disabled={isReloading}
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              {isReloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Recarregando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Recarregar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceCheckLuana}
              disabled={isReloading}
              className="flex items-center gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              {isReloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Busca Direta
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFixAndUpdate}
              disabled={isReloading}
              className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 font-semibold"
            >
              {isReloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  Corrigindo...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  CORREÇÃO COMPLETA
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma execução pendente</p>
            <p className="text-sm">Você não tem execuções pendentes no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {executions.map((execution) => (
              <div key={execution.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStepTypeIcon(execution.step.step_type)}
                      <h3 className="font-medium">{execution.step.step_name}</h3>
                      <Badge className={getStepTypeColor(execution.step.step_type)}>
                        {execution.step.step_type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`ml-2 ${
                          getProcessStatus(execution).color === 'green' ? 'bg-green-100 text-green-800 border-green-200' :
                          getProcessStatus(execution).color === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          getProcessStatus(execution).color === 'red' ? 'bg-red-100 text-red-800 border-red-200' :
                          getProcessStatus(execution).color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          getProcessStatus(execution).color === 'purple' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          getProcessStatus(execution).color === 'orange' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {getProcessStatus(execution).label}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Processo:</strong> {execution.process.process_name}</p>
                      <p><strong>Documento:</strong> {execution.process.document.title}</p>
                      <p><strong>Status do Documento:</strong> {execution.process.document.status}</p>
                      <p><strong>Criado em:</strong> {new Date(execution.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>

                    {execution.assigned_user && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Atribuído a: {execution.assigned_user.full_name}</span>
                      </div>
                    )}

                    {execution.assigned_department && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>Departamento: {execution.assigned_department.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão Executar - Abre o modal de detalhes do processo */}
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleOpenProcessDetails(execution)}
                      disabled={loadingProcessDetails}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loadingProcessDetails ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Executar
                        </>
                      )}
                    </Button>

                    {/* Botão Ver Detalhes - Abre o modal de ação rápida */}
                    <Dialog open={showActionDialog && selectedExecution?.id === execution.id} onOpenChange={(open) => {
                      if (open) {
                        setSelectedExecution(execution)
                        setShowActionDialog(true)
                      } else {
                        setShowActionDialog(false)
                        setSelectedExecution(null)
                        setActionType(null)
                        setComments('')
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Executar Ação</DialogTitle>
                          <DialogDescription>
                            Selecione a ação para a etapa: {execution.step.step_name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Ações Disponíveis</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {getAvailableActions(execution).includes('approve') && (
                                <Button
                                  variant={actionType === 'approve' ? 'default' : 'outline'}
                                  onClick={() => setActionType('approve')}
                                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Aprovar
                                </Button>
                              )}
                              
                              {getAvailableActions(execution).includes('reject') && (
                                <Button
                                  variant={actionType === 'reject' ? 'default' : 'outline'}
                                  onClick={() => setActionType('reject')}
                                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Rejeitar
                                </Button>
                              )}
                              
                              {getAvailableActions(execution).includes('sign') && (
                                <Button
                                  variant={actionType === 'sign' ? 'default' : 'outline'}
                                  onClick={() => setActionType('sign')}
                                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                  <FileText className="h-4 w-4" />
                                  Assinar
                                </Button>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="comments">Comentários (opcional)</Label>
                            <Textarea
                              id="comments"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Adicione comentários sobre sua decisão..."
                              className="mt-1"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowActionDialog(false)
                                setSelectedExecution(null)
                                setActionType(null)
                                setComments('')
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => actionType && handleAction(actionType)}
                              disabled={!actionType || isProcessing}
                            >
                              {isProcessing ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                'Executar'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de Detalhes do Processo */}
      <ProcessDetailsModal
        open={showProcessDetails}
        onOpenChange={(open) => {
          setShowProcessDetails(open)
          if (!open) {
            setSelectedProcess(null)
          }
        }}
        process={selectedProcess}
        onProcessUpdate={async () => {
          console.log('🔄 [PendingExecutions] onProcessUpdate chamado - recarregando execuções...')
          try {
            await fetchPendingExecutions()
            console.log('✅ [PendingExecutions] Execuções recarregadas após atualização do processo')
          } catch (error) {
            console.error('❌ [PendingExecutions] Erro ao recarregar execuções:', error)
          }
        }}
      />
    </Card>
  )
}
