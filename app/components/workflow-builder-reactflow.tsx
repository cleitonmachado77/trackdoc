"use client"

import { useState, useCallback, useEffect, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useUsers } from "@/hooks/use-users"
import { 
  Users, 
  Building2, 
  Save, 
  X, 
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  PenTool,
  FileText,
  CheckSquare,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  Position,
  Handle,
  NodeProps,
  EdgeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Tipos
interface WorkflowStep {
  id: string
  name: string
  type: 'user' | 'action'
  description?: string
  userId?: string
  position: { x: number; y: number }
  position_x?: number
  position_y?: number
  data: any
  // Propriedades do banco de dados
  step_name?: string
  step_type?: string
  user_id?: string
  action_type?: 'approve' | 'sign'
  action_data?: any
  user?: {
    id: string
    full_name: string
    email: string
  }
}

interface WorkflowTransition {
  id: string
  from_step_id: string
  to_step_id: string
  condition?: string
  label?: string
  isAutomatic?: boolean
}

type WorkflowTemplate = any

// Componentes de nós customizados

const UserNode = ({ data, selected }: NodeProps) => {
  const userName = data.userName as string | undefined
  
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[200px] relative group ${selected ? 'border-green-500' : 'border-gray-300'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-green-600" />
        <div className="flex-1">
          <div className="font-bold text-sm">{data.label as string}</div>
          <div className="text-xs text-gray-500">
            {userName || 'Usuário não selecionado'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      {/* Botão de deletar */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
        onClick={(e) => {
          e.stopPropagation()
          if (data.onDelete && typeof data.onDelete === 'function') {
            (data.onDelete as () => void)()
          }
        }}
        title="Deletar nó"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

const ActionNode = ({ data, selected }: NodeProps) => {
  const actionType = data.actionType as string | undefined
  const actionLabel = data.actionLabel as string | undefined
  const actionData = data.actionData as any
  
  const getActionIcon = () => {
    switch (actionType) {
      case 'sign':
        return <PenTool className="h-4 w-4 text-blue-600" />
      case 'approve':
        return <CheckSquare className="h-4 w-4 text-green-600" />
      default:
        return <Edit className="h-4 w-4 text-purple-600" />
    }
  }
  
  const getActionDescription = () => {
    // ✅ NOVO: Se há comentários, exibir eles no lugar do texto padrão
    if (actionData?.comments && actionData.comments.trim()) {
      return (
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">💬 Comentários:</div>
          <div className="p-2 bg-gray-50 rounded border-l-2 border-gray-300 max-w-[200px]">
            <div className="break-words whitespace-pre-wrap">
              {actionData.comments}
            </div>
          </div>
          
          {/* ✅ NOVO: Mostrar usuários selecionados abaixo dos comentários */}
          {actionData?.targetUsers && actionData.targetUsers.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-blue-600 mb-1">
                👥 Usuários selecionados ({actionData.targetUsers.length}):
              </div>
              <div className="space-y-1">
                {actionData.targetUsers.map((userId: string, index: number) => {
                  // Buscar nome do usuário nos dados do nó
                  const userDetail = data.targetUserDetails?.find((u: any) => u.id === userId)
                  const userName = userDetail?.full_name || `Usuário ${userId.slice(0, 8)}`
                  
                  return (
                    <div key={userId} className="flex items-center gap-1 ml-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-700">{userName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )
    }
    
    // Texto padrão quando não há comentários
    const baseDescription = (() => {
      switch (actionType) {
        case 'sign':
          return (
            <div className="text-xs text-gray-500">
              <div>✍️ {actionLabel}</div>
              <div>Define ação de assinatura</div>
            </div>
          )
        case 'approve':
          return (
            <div className="text-xs text-gray-500">
              <div>✅ {actionLabel}</div>
              <div>Define ação de aprovação</div>
            </div>
          )
        default:
          return (
            <div className="text-xs text-gray-500">
              {actionType && <div>⚡ {actionLabel}</div>}
              <div>Define ação personalizada</div>
            </div>
          )
      }
    })()

    // ✅ NOVO: Adicionar usuários selecionados mesmo sem comentários
    if (actionData?.targetUsers && actionData.targetUsers.length > 0) {
      return (
        <div className="text-xs text-gray-600">
          {baseDescription}
          
          <div className="mt-2">
            <div className="text-xs font-medium text-blue-600 mb-1">
              👥 Usuários selecionados ({actionData.targetUsers.length}):
            </div>
            <div className="space-y-1">
              {actionData.targetUsers.map((userId: string, index: number) => {
                // Buscar nome do usuário nos dados do nó
                const userDetail = data.targetUserDetails?.find((u: any) => u.id === userId)
                const userName = userDetail?.full_name || `Usuário ${userId.slice(0, 8)}`
                
                return (
                  <div key={userId} className="flex items-center gap-1 ml-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-700">{userName}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    return baseDescription
  }
  
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[200px] relative group ${selected ? 'border-purple-500' : 'border-gray-300'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        {getActionIcon()}
        <div className="flex-1">
          <div className="font-bold text-sm">{data.label as string}</div>
          {getActionDescription()}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      {/* Botão de deletar */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
        onClick={(e) => {
          e.stopPropagation()
          if (data.onDelete && typeof data.onDelete === 'function') {
            (data.onDelete as () => void)()
          }
        }}
        title="Deletar nó"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// Tipos de nós
const nodeTypes: NodeTypes = {
  user: UserNode,
  action: ActionNode,
}

// Componente principal
interface WorkflowBuilderProps {
  template?: WorkflowTemplate
  onSave: (workflowData: {
    template: {
      id?: string
      name: string
      description?: string
      status?: 'active' | 'inactive' | 'draft'
      entity_id?: string
      created_by?: string
    }
    steps: Array<{
      id?: string
      name: string
      type: 'user' | 'action'
      position: { x: number; y: number }
      userId?: string
      actionType?: 'approve' | 'sign'
      actionData?: any
      targetUsers?: string[]
    }>
    transitions: Array<{
      id?: string
      from_step_id: string
      to_step_id: string
      label?: string
      isAutomatic?: boolean
    }>
  }) => Promise<any>
  onClose: () => void
}

export default function WorkflowBuilder({ template, onSave, onClose }: WorkflowBuilderProps) {
  const { toast } = useToast()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [templateName, setTemplateName] = useState(template?.name ?? '')
  const [templateDescription, setTemplateDescription] = useState(template?.description ?? '')

  // Validar nós para garantir que sempre tenham posições válidas
  const validateNodes = useCallback((nodeList: Node[]) => {
    return nodeList.map(node => ({
      ...node,
      position: node.position || { x: 0, y: 0 }
    }))
  }, [])

  // Wrapper para setNodes que sempre valida as posições
  const setNodesValidated = useCallback((nodesOrUpdater: Node[] | ((nodes: Node[]) => Node[])) => {
    if (typeof nodesOrUpdater === 'function') {
      setNodes(currentNodes => {
        const updatedNodes = nodesOrUpdater(currentNodes)
        return validateNodes(updatedNodes)
      })
    } else {
      setNodes(validateNodes(nodesOrUpdater))
    }
  }, [validateNodes, setNodes])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showNodeDialog, setShowNodeDialog] = useState(false)
  const [nodeType, setNodeType] = useState<string>('user')
  const [nodeData, setNodeData] = useState<any>({})
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  
  // Estados para o wizard de configuração da ação
  const [showActionWizard, setShowActionWizard] = useState(false)
  const [actionWizardStep, setActionWizardStep] = useState(1) // 1: Tipo de Ação, 2: Usuários Alvo, 3: Comentários
  const [selectedActionType, setSelectedActionType] = useState<string>('')
  const [actionComments, setActionComments] = useState<string>('')
  const [selectedTargetUsers, setSelectedTargetUsers] = useState<string[]>([])
  // Estados para o wizard de configuração do usuário
  const [showUserWizard, setShowUserWizard] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')

  // Estado para controlar seleção de edges
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)

  // Hooks para buscar dados
  const { users: fetchedUsers } = useUsers()
  
  const users = fetchedUsers || []


  // Tipos de ação disponíveis
  const availableActionTypes = [
    { value: 'approve', label: 'Aprovar/Reprovar', description: 'Aprova ou rejeita o documento' },
    { value: 'sign', label: 'Assinar', description: 'Solicita assinatura do documento' }
  ]

  // Tipos de nós disponíveis
  const nodeTypesList = [
    { value: 'user', label: 'Usuário', icon: Users, color: 'bg-green-500' },
    { value: 'action', label: 'Ação', icon: Edit, color: 'bg-purple-500' },
  ]

  // Carregar template existente
  useEffect(() => {
    if (template) {
      setTemplateName(template.name ?? '')
      setTemplateDescription(template.description ?? '')
      const flowNodes: Node[] = (template.steps || []).map((step, index) => {
        const nodeId = step.id

        let position = { x: 0, y: 0 }
        if (step.position) {
          position = step.position
        } else if (step.position_x !== undefined && step.position_y !== undefined) {
          position = { x: step.position_x, y: step.position_y }
        } else if (step.uiPosition) {
          position = step.uiPosition
        } else if (step.ui_position) {
          position = step.ui_position
        }

        const metadata = (step.metadata ?? {}) as Record<string, any>
        const actionData = step.action_data || metadata.actionData || {}
        const targetUsers =
          step.target_users ||
          actionData.targetUsers ||
          metadata.targetUsers ||
          []
        const targetUserDetails =
          step.target_user_details ||
          actionData.targetUserDetails ||
          metadata.targetUserDetails ||
          []

        const nodeData = {
            label: step.step_name || step.name || `Nó ${index + 1}`,
            user: step.user_id || metadata.userId || null,
            userName: step.user?.full_name || metadata.userName || null,
          actionType: step.action_type || metadata.actionType,
          actionData: {
            comments: actionData.comments ?? metadata.comments ?? '',
            targetUsers,
            targetUserDetails,
          },
          targetUsers,
          targetUserDetails,
          onDelete: () => deleteNode(nodeId),
        }

        return {
          id: nodeId,
          type: step.step_type || step.type || 'user',
          position,
          data: nodeData,
        }
      })

      const flowEdges: Edge[] = (template.transitions || [])
        .filter(transition => transition.from_step_id && transition.to_step_id)
        .map(transition => ({
          id: transition.id,
          source: transition.from_step_id,
          target: transition.to_step_id,
          label: transition.metadata?.label ?? transition.label ?? undefined,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#3b82f6',
          },
          style: {
            stroke: '#3b82f6',
            strokeWidth: 2,
          },
          data: {
            condition: transition.condition,
            metadata: transition.metadata ?? {},
          },
        }))

      // Validar que todos os nós têm posições válidas
      const validatedNodes = flowNodes.map(node => ({
        ...node,
        position: node.position || { x: 0, y: 0 }
      }))

      setNodesValidated(validatedNodes)
      setEdges(flowEdges)
    } else {
      setTemplateName('')
      setTemplateDescription('')
      setNodes([])
      setEdges([])
    }
  }, [template, setNodes, setEdges, setNodesValidated])

  // Carregar dados do nó selecionado quando estiver editando
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'action') {
      const nodeData = selectedNode.data
      setSelectedActionType((nodeData.actionType as string) || '')
      setActionComments(((nodeData.actionData as any)?.comments as string) || '')
    }
  }, [selectedNode])

  // Deletar nó
  const deleteNode = (nodeId: string) => {
    // Usar setNodesValidated com callback para acessar o estado atual
    setNodesValidated(currentNodes => {
      const nodeToDelete = currentNodes.find(node => node.id === nodeId)
      
      if (!nodeToDelete) {
        return currentNodes // Retornar o array atual sem modificação
      }

      // Fechar dialogs se o nó selecionado foi deletado
      if (selectedNode?.id === nodeId) {
        setShowNodeDialog(false)
        setShowUserWizard(false)
        setShowActionWizard(false)
        setSelectedNode(null)
      }

      // Remover conexões relacionadas
      setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId))

      toast({
        title: "Nó excluído",
        description: `O nó "${nodeToDelete.data.label}" foi excluído com sucesso.`,
      })

      // Retornar o array sem o nó deletado
      return currentNodes.filter(node => node.id !== nodeId)
    })
  }

  // Adicionar novo nó
  const addNode = (type: string) => {
    if (type === 'user') {
      // Abrir wizard para usuário
      setNodeType(type)
      setSelectedUser('')
      setShowUserWizard(true)
    } else if (type === 'action') {
      // Abrir wizard para ação
      setNodeType(type)
      setActionWizardStep(1)
      setSelectedActionType('')
      setActionComments('')
      setShowActionWizard(true)
    } else {
      // Comportamento normal para outros tipos
      const nodeId = `node-${Date.now()}`
      const newNode: Node = {
        id: nodeId,
        type,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          label: `Novo ${nodeTypesList.find(t => t.value === type)?.label}`,
          onDelete: () => deleteNode(nodeId)
        }
      }

      setNodesValidated(nds => [...nds, newNode])
      setSelectedNode(newNode)
      setNodeType(type)
      setNodeData(newNode.data)
      setShowNodeDialog(true)
    }
  }

  // Atualizar nó
  const updateNode = (nodeId: string, updates: any) => {
    setNodesValidated(nds => nds.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
            onDelete: () => deleteNode(nodeId)
          }
        }
      }
      return node
    }))
  }

  // Separar nós conectados
  const disconnectNodes = (edgeId: string) => {
    const edgeToDelete = edges.find(edge => edge.id === edgeId)
    if (!edgeToDelete) return

    setEdges(eds => eds.filter(edge => edge.id !== edgeId))
    
    toast({
      title: "Conexão removida",
      description: "Os nós foram separados com sucesso.",
    })
  }

  // Conectar nós
  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) {
      return
    }

    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: params.source,
      target: params.target,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#3b82f6',
      },
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
      },
    }
    setEdges(eds => addEdge(newEdge, eds))
  }, [setEdges])

  // Criar transições automáticas baseadas nos nós de ação
  const createAutomaticTransitions = (steps: any[], edges: Edge[]) => {
    // Os nós de ação não criam transições automáticas
    // Eles apenas definem qual ação os próximos nós de usuário vão executar
    // As transições devem ser criadas manualmente pelo usuário
    return []
  }

  // Salvar workflow
  const handleSave = async () => {
    if (nodes.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um nó ao fluxo",
        variant: "destructive",
      })
      return
    }

    const trimmedName = templateName.trim()
    if (!trimmedName) {
      toast({
        title: "Nome obrigatório",
        description: "Informe um nome para o fluxo antes de salvar.",
        variant: "destructive",
      })
      return
    }

    const missingUserNode = nodes.find(
      (node) => node.type === 'user' && !(node.data as any)?.user,
    )

    if (missingUserNode) {
      toast({
        title: 'Selecione o responsável',
        description: `O nó "${missingUserNode.data?.label ?? 'Usuário'}" precisa de um usuário definido antes de salvar.`,
        variant: 'destructive',
      })
      return
    }

    try {
      const steps = (nodes || []).map(node => {
        const baseStep = {
          id: node.id,
          name: node.data.label as string,
          type: (node.type as 'user' | 'action') ?? 'user',
          position: node.position || { x: 0, y: 0 },
          actionType: (node.data.actionType as 'approve' | 'sign' | undefined) ?? undefined,
          actionData: node.data.actionData || null,
          targetUsers: (node.data.targetUsers as string[]) || [],
          targetUserDetails: (node.data.targetUserDetails as any[]) || [],
        }

        if (node.type === 'user') {
          return {
            ...baseStep,
            userId: (node.data.user as string) || null,
            userName: node.data.userName as string | undefined,
          }
        }

        return {
          ...baseStep,
          userId: null,
          actionData: {
            comments: (node.data.actionData as any)?.comments || '',
            targetUsers:
              (node.data.actionData as any)?.targetUsers || (node.data.targetUsers as string[]) || [],
            targetUserDetails:
              (node.data.actionData as any)?.targetUserDetails || (node.data.targetUserDetails as any[]) || [],
          },
        }
      })

      // Criar transições manuais (do usuário)
      const manualTransitions = (edges || []).map(edge => ({
        id: edge.id,
        from_step_id: edge.source,
        to_step_id: edge.target,
        label: edge.label as string,
        isAutomatic: false
      }))

      // Criar transições automáticas baseadas nos nós de ação
      const automaticTransitions = createAutomaticTransitions(steps, edges || [])
      
      // Combinar transições manuais e automáticas
      const allTransitions = [...manualTransitions, ...automaticTransitions]

      const workflowData = {
        template: {
          id: template?.id,
          name: trimmedName,
          description: templateDescription.trim(),
          status: 'draft' as const,
          entity_id: template?.entity_id,
          created_by: template?.created_by
        },
        steps,
        transitions: allTransitions
      }

      // Usar a nova função saveWorkflow
      const savedTemplate = await onSave(workflowData)
      
      if (savedTemplate) {
        toast({
          title: "Sucesso",
          description: "Fluxo salvo com sucesso!",
        })
      }
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar o fluxo. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Selecionar nó
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Agrupar todas as atualizações de estado em um batch
    startTransition(() => {
      setSelectedNode(node)
      setNodeType(node.type || 'user')
      setNodeData(node.data)
      setSelectedEdge(null) // Limpar seleção de edge
      
      if (node.type === 'user') {
        // Se for um nó de usuário, abrir o wizard de edição
        setSelectedUser((node.data.user as string) || '')
        setShowUserWizard(true)
      } else if (node.type === 'action') {
        // Se for um nó de ação, abrir o wizard de edição
        setSelectedActionType((node.data.actionType as string) || '')
        setActionComments(((node.data.actionData as any)?.comments as string) || '')
        setSelectedTargetUsers((node.data.targetUsers as string[]) || [])
        setActionWizardStep(1)
        setShowActionWizard(true)
      } else {
        setShowNodeDialog(true)
      }
    })
  }, [])

  // Selecionar edge
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    startTransition(() => {
      setSelectedEdge(edge)
      setSelectedNode(null) // Limpar seleção de nó
    })
  }, [])

  // Funções do wizard de usuário
  const handleUserFinish = () => {
    if (selectedUser) {
      const user = users.find(u => u.id === selectedUser)
      
      if (selectedNode && selectedNode.type === 'user') {
        // Modo edição - atualizar nó existente
        const updatedNodeData = {
          label: user?.full_name || 'Usuário',
          user: selectedUser,
          userName: user?.full_name || '',
          onDelete: () => deleteNode(selectedNode.id)
        }

        updateNode(selectedNode.id, updatedNodeData)
        
        toast({
          title: "Usuário atualizado",
          description: `Usuário "${user?.full_name}" foi atualizado com sucesso.`,
        })
      } else {
        // Modo criação - criar novo nó
        const nodeId = `node-${Date.now()}`
        const newNode: Node = {
          id: nodeId,
          type: 'user',
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: {
            label: user?.full_name || 'Usuário',
            user: selectedUser,
            userName: user?.full_name || '',
            onDelete: () => deleteNode(nodeId)
          }
        }

        setNodesValidated(nds => [...nds, newNode])
        
        toast({
          title: "Usuário adicionado",
          description: `Usuário "${user?.full_name}" adicionado com sucesso.`,
        })
      }

      setShowUserWizard(false)
      setSelectedNode(null)
    }
  }

  const handleWizardCancel = () => {
    setShowUserWizard(false)
    setShowActionWizard(false)
    setSelectedUser('')
    setSelectedActionType('')
    setActionComments('')
    setSelectedTargetUsers([])
    setActionWizardStep(1)
    setSelectedNode(null)
  }

  // Função para carregar dados do nó quando for editar
  const loadNodeDataForEdit = (node: Node) => {
    if (node.type === 'action') {
      setSelectedActionType(node.data.actionType || '')
      setActionComments(node.data.actionData?.comments || '')
      setSelectedTargetUsers(node.data.targetUsers || [])
    } else if (node.type === 'user') {
      setSelectedUser(node.data.userId || '')
    }
  }

  // Funções do wizard de ação

  const handleActionFinish = () => {
    if (selectedActionType && selectedTargetUsers.length > 0) {
      const actionType = availableActionTypes.find(t => t.value === selectedActionType)
      
      if (selectedNode && selectedNode.type === 'action') {
        // Modo edição - atualizar nó existente
        const targetUserDetails = selectedTargetUsers.map(userId => {
          const user = users.find(u => u.id === userId)
          return {
            id: userId,
            full_name: user?.full_name || `Usuário ${userId.slice(0, 8)}`,
            email: user?.email || ''
          }
        })
        
        const updatedNodeData = {
          label: actionType?.label || 'Ação',
          actionType: selectedActionType,
          actionLabel: actionType?.label || '',
          actionData: {
            comments: actionComments,
            targetUsers: selectedTargetUsers
          },
          targetUsers: selectedTargetUsers,
          targetUserDetails: targetUserDetails,
          onDelete: () => deleteNode(selectedNode.id)
        }

        updateNode(selectedNode.id, updatedNodeData)
        
        toast({
          title: "Ação atualizada",
          description: `Ação "${actionType?.label}" foi atualizada com sucesso.`,
        })
      } else {
        // Modo criação - criar novo nó
        const targetUserDetails = selectedTargetUsers.map(userId => {
          const user = users.find(u => u.id === userId)
          return {
            id: userId,
            full_name: user?.full_name || `Usuário ${userId.slice(0, 8)}`,
            email: user?.email || ''
          }
        })
        
        const nodeId = `node-${Date.now()}`
        const newNode: Node = {
          id: nodeId,
          type: 'action',
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: {
            label: actionType?.label || 'Ação',
            actionType: selectedActionType,
            actionLabel: actionType?.label || '',
            actionData: {
              comments: actionComments,
              targetUsers: selectedTargetUsers
            },
            targetUsers: selectedTargetUsers,
            targetUserDetails: targetUserDetails,
            onDelete: () => deleteNode(nodeId)
          }
        }

        setNodesValidated(nds => [...nds, newNode])
        
        toast({
          title: "Ação adicionada",
          description: `Ação "${actionType?.label}" adicionada com sucesso.`,
        })
      }

      setShowActionWizard(false)
      setActionWizardStep(1)
      setSelectedNode(null)
      setSelectedTargetUsers([])
    } else {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um usuário alvo.",
        variant: "destructive",
      })
    }
  }




  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b gap-4 flex-wrap">
        <div className="flex flex-col gap-2 max-w-xl">
          <h2 className="text-xl font-semibold">Construtor de Fluxo</h2>
          <p className="text-sm text-gray-600">Crie e edite fluxos de tramitação de documentos</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name" className="text-sm font-medium">
                Nome do Fluxo
              </Label>
              <Input
                id="workflow-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex.: Aprovação de Contratos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow-description" className="text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="workflow-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Explique o objetivo deste fluxo"
                className="min-h-[88px]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-start">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar Fluxo
          </Button>
          <Button variant="outline" onClick={onClose} className="px-3">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Adicionar Elementos</h3>
              <div className="space-y-2">
                {nodeTypesList.map(type => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => addNode(type.value)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Estatísticas</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Nós: {nodes.length}</div>
                <div>Conexões: {edges.length}</div>
              </div>
            </div>

            {selectedEdge && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Ações</h3>
                <Button 
                  onClick={() => disconnectNodes(selectedEdge.id)} 
                  variant="destructive"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Separar Conexão
                </Button>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Como Usar</h3>
              <div className="text-xs text-gray-600 space-y-2">
                <div>• Clique em "Adicionar Elementos" para criar nós</div>
                <div>• Arraste de um nó para outro para conectar</div>
                <div>• Clique em um nó para editá-lo</div>
                <div>• Clique em uma conexão para separá-la</div>
                <div>• Passe o mouse sobre um nó para ver o botão de deletar</div>
                <div>• Use os controles para navegar</div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas React Flow */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Dialog para editar nó */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent className="max-w-md [&>button[data-state='open']]:!hidden">
          <DialogHeader>
            <DialogTitle>Editar {nodeTypesList.find(t => t.value === nodeType)?.label}</DialogTitle>
            <DialogDescription>
              Configure as propriedades do elemento selecionado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={nodeData.label || ''}
                onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
                placeholder="Nome do elemento"
              />
            </div>

            {nodeType === 'department' && (
              <div>
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={nodeData.department || ''}
                  onValueChange={(value) => setNodeData({ ...nodeData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Aqui você pode adicionar os departamentos disponíveis */}
                    <SelectItem value="rh">Recursos Humanos</SelectItem>
                    <SelectItem value="compras">Compras</SelectItem>
                    <SelectItem value="juridico">Jurídico</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {nodeType === 'user' && (
              <div>
                <Label htmlFor="user">Usuário</Label>
                <Select
                  value={nodeData.user || ''}
                  onValueChange={(value) => setNodeData({ ...nodeData, user: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Aqui você pode adicionar os usuários disponíveis */}
                    <SelectItem value="user1">João Silva</SelectItem>
                    <SelectItem value="user2">Maria Santos</SelectItem>
                    <SelectItem value="user3">Pedro Costa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedNode) {
                  updateNode(selectedNode.id, nodeData)
                }
                setShowNodeDialog(false)
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Dialog: Wizard de Configuração de Usuário */}
      <Dialog open={showUserWizard} onOpenChange={setShowUserWizard}>
        <DialogContent className="max-w-md [&>button[data-state='open']]:!hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedNode && selectedNode.type === 'user' ? 'Editar Usuário' : 'Configurar Usuário'}
            </DialogTitle>
            <DialogDescription>
              Selecione o usuário para este nó do fluxo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Selecione o Usuário</Label>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUser && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Usuário selecionado:</strong> {users.find(u => u.id === selectedUser)?.full_name}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Email: {users.find(u => u.id === selectedUser)?.email}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleWizardCancel}>
              Cancelar
            </Button>
            
            <Button onClick={handleUserFinish}>
              {selectedNode && selectedNode.type === 'user' ? 'Salvar' : 'Finalizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Wizard de Configuração de Ação */}
      <Dialog open={showActionWizard} onOpenChange={setShowActionWizard}>
        <DialogContent className="max-w-md [&>button[data-state='open']]:!hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedNode && selectedNode.type === 'action' ? 'Editar Ação' : 'Configurar Ação'} - Passo {actionWizardStep} de 3
            </DialogTitle>
            <DialogDescription>
              {actionWizardStep === 1 && "Selecione o tipo de ação para este nó do fluxo."}
              {actionWizardStep === 2 && "Selecione os usuários que devem executar esta ação."}
              {actionWizardStep === 3 && "Adicione comentários opcionais para esta ação."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Passo 1: Seleção do Tipo de Ação */}
            {actionWizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Ação</Label>
                  <div className="space-y-2 mt-2">
                    {availableActionTypes.map(actionType => (
                      <div key={actionType.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`action-${actionType.value}`}
                          checked={selectedActionType === actionType.value}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedActionType(actionType.value)
                            } else {
                              setSelectedActionType('')
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`action-${actionType.value}`} className="text-sm font-medium">
                            {actionType.label}
                          </Label>
                          <p className="text-xs text-gray-500">{actionType.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
              </div>
            )}

            {/* Passo 2: Seleção de Usuários Alvo */}
            {actionWizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Usuários Alvo</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Selecione os usuários que devem executar a ação "{availableActionTypes.find(t => t.value === selectedActionType)?.label}".
                  </p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedTargetUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTargetUsers(prev => [...prev, user.id])
                            } else {
                              setSelectedTargetUsers(prev => prev.filter(id => id !== user.id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`user-${user.id}`} className="text-sm font-medium">
                            {user.full_name}
                          </Label>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedTargetUsers.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Usuários selecionados:</strong> {selectedTargetUsers.length}
                    </p>
                    <div className="text-xs text-green-600 mt-1">
                      {selectedTargetUsers.map(userId => {
                        const user = users.find(u => u.id === userId)
                        return user?.full_name
                      }).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Passo 3: Comentários da ação */}
            {actionWizardStep === 3 && (
              <div className="space-y-4">
              <div>
                <Label htmlFor="action-comments" className="text-sm font-medium">
                  Comentários Padrão (Opcional)
                </Label>
                <Textarea
                  id="action-comments"
                  placeholder={`Comentários que aparecerão na interface de ${selectedActionType === 'sign' ? 'assinatura' : 'aprovação'}...`}
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleWizardCancel}>
              Cancelar
            </Button>
            
            {actionWizardStep === 1 && (
              <Button 
                onClick={() => setActionWizardStep(2)}
                disabled={!selectedActionType}
              >
                Próximo
              </Button>
            )}
            
            {actionWizardStep === 2 && (
              <>
                <Button variant="outline" onClick={() => setActionWizardStep(1)}>
                  Anterior
                </Button>
                <Button 
                  onClick={() => setActionWizardStep(3)}
                  disabled={selectedTargetUsers.length === 0}
                >
                  Próximo
                </Button>
              </>
            )}
            
            {actionWizardStep === 3 && (
              <>
                <Button variant="outline" onClick={() => setActionWizardStep(2)}>
                  Anterior
                </Button>
                <Button onClick={handleActionFinish}>
                  {selectedNode && selectedNode.type === 'action' ? 'Salvar' : 'Finalizar'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

