'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  useWorkflowProcesses,
  useWorkflowTemplates,
  useWorkflowExecutions,
  useWorkflowSignature,
  useWorkflowActions,
  WorkflowTemplateForm,
  WorkflowProcessResponse,
} from '@/hooks/useWorkflow'
import WorkflowBuilder from './workflow-builder-reactflow'
import ProcessList from '@/app/components/workflow/process-list'
import ProcessDetails from '@/app/components/workflow/process-details'
import StartProcess from '@/app/components/workflow/start-process'
import { Clock, Plus, Trash2 } from 'lucide-react'

export default function DocumentWorkflow() {
  const { user } = useAuth()
  const { toast } = useToast()

  const assignedProcesses = useWorkflowProcesses('assigned')
  const myProcesses = useWorkflowProcesses('mine')
  const templates = useWorkflowTemplates()
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [comments, setComments] = useState('')
  const [action, setAction] = useState<'approve' | 'reject' | 'sign' | 'return' | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplateForm | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<WorkflowTemplateForm | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState(false)
  const executions = useWorkflowExecutions(selectedProcessId)
  const signature = useWorkflowSignature(selectedProcessId)

  const selectedProcess = useMemo<WorkflowProcessResponse | null>(() => {
    if (!selectedProcessId) return null
    const all = [...(assignedProcesses.processes || []), ...(myProcesses.processes || [])]
    return all.find((process) => process.id === selectedProcessId) ?? null
  }, [selectedProcessId, assignedProcesses.processes, myProcesses.processes])

  const actions = useWorkflowActions(selectedProcess, user?.id ?? null)

  useEffect(() => {
    assignedProcesses.fetchProcesses()
    myProcesses.fetchProcesses()
    templates.fetchTemplates()
  }, [assignedProcesses.fetchProcesses, myProcesses.fetchProcesses, templates.fetchTemplates])

  const handleRefresh = () => {
    assignedProcesses.fetchProcesses()
    myProcesses.fetchProcesses()
  }

  const handleExecuteAction = async () => {
    if (!selectedProcessId || !selectedExecutionId || !action) return

    const execute = async () => {
      if (action === 'return') {
        return executions.returnStep({ executionId: selectedExecutionId, comments })
      }

      if (action === 'sign') {
        return signature.sendSignatureRequest({ executionId: selectedExecutionId, action, comments })
      }

      return executions.executeAction({ executionId: selectedExecutionId, action, payload: { comments } })
    }

    const result = await execute()

    if (result.success) {
      toast({ title: 'Ação executada com sucesso!' })
      setSelectedExecutionId(null)
      setAction(null)
      setComments('')
      handleRefresh()
    } else {
      toast({
        title: 'Erro ao executar ação',
        description: result.error || 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    }
  }

  const handleSaveTemplate = async (template: WorkflowTemplateForm) => {
    const result = await templates.saveTemplate(template)

    if (result.success) {
      toast({ title: 'Template salvo com sucesso!' })
    } else {
      toast({
        title: 'Erro ao salvar template',
        description: result.error,
        variant: 'destructive',
      })
    }

    return result
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tramitação de Documentos</h1>
          <p className="text-muted-foreground">Gerencie fluxos, processos e assinaturas</p>
        </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Atualizar
            </Button>
            <StartProcess onProcessStarted={handleRefresh} />
            <Button onClick={() => {
              setEditingTemplate(null)
              setShowTemplateDialog(true)
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Novo Fluxo
            </Button>
          </div>
      </div>

      <Tabs defaultValue="processes">
        <TabsList>
          <TabsTrigger value="processes">Processos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>Processos</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Recarregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <ProcessList
                    onProcessSelect={(processId) => setSelectedProcessId(processId)}
                  />
                </div>
                <div className="space-y-3">
                  <ProcessDetails
                    process={selectedProcess}
                    onExecute={(executionId, actionType) => {
                      setSelectedExecutionId(executionId)
                      setAction(actionType)
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>Templates de Workflow</CardTitle>
              <Button size="sm" onClick={() => {
                setEditingTemplate(null)
                setShowTemplateDialog(true)
              }}>
                <Plus className="mr-2 h-4 w-4" /> Novo Template
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum template cadastrado.</p>
              ) : (
                templates.templates.map((template) => (
                  <Card key={template.id} className="border-dashed">
                    <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{template.description || 'Sem descrição'}</p>
                      </div>
                      <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                        {template.status === 'active' ? 'Ativo' : template.status === 'draft' ? 'Rascunho' : 'Inativo'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button size="sm" onClick={() => {
                        setEditingTemplate(template)
                        setShowTemplateDialog(true)
                      }}>
                        Editar
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setTemplateToDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedExecutionId} onOpenChange={(open) => !open && setSelectedExecutionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirmar {action === 'approve' ? 'aprovação' : action === 'reject' ? 'reprovação' : action === 'sign' ? 'assinatura' : 'retorno'}
            </DialogTitle>
            <DialogDescription>Adicione comentários opcionais para registrar esta ação.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Digite comentários (opcional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedExecutionId(null)}>
                Cancelar
              </Button>
              <Button onClick={handleExecuteAction}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showTemplateDialog && (
        <WorkflowBuilder
          template={editingTemplate}
          onSave={async (templateData) => {
            const name = templateData.template.name?.trim()

            if (!name) {
              toast({
                title: 'Nome obrigatório',
                description: 'Informe um nome para o fluxo antes de salvar.',
                variant: 'destructive',
              })
              return null
            }

            const invalidUserStep = templateData.steps.find((step) => {
              const type = step.type ?? step.step_type ?? 'user'
              if (type !== 'user') return false

              const candidate =
                step.userId ??
                step.user_id ??
                (step.data as any)?.user ??
                (step.metadata as any)?.userId

              return !candidate
            })

            if (invalidUserStep) {
              toast({
                title: 'Responsável obrigatório',
                description: `Selecione o usuário responsável para a etapa "${invalidUserStep.name ?? invalidUserStep.step_name ?? 'Usuário'}" antes de salvar o fluxo.`,
                variant: 'destructive',
              })
              return null
            }

            const steps = templateData.steps.map((step, index) => {
              const targetUsers =
                step.actionData?.targetUsers ??
                step.targetUsers ??
                []
              const targetUserDetails =
                step.actionData?.targetUserDetails ??
                (step as any).targetUserDetails ??
                []

              const metadata: Record<string, any> = {
                actionType: step.actionType,
                targetUsers,
                comments: step.actionData?.comments ?? '',
              }

              if ((step.type ?? step.step_type ?? 'user') === 'user') {
                const responsibleId =
                  step.userId ??
                  step.user_id ??
                  (step.data as any)?.user ??
                  (step.metadata as any)?.userId

                if (responsibleId) {
                  metadata.userId = responsibleId
                }
              }

              if (targetUserDetails.length > 0) {
                metadata.targetUserDetails = targetUserDetails
              }

              if (step.userId) {
                metadata.userId = step.userId
              }

              return {
                id: step.id,
                stepOrder: step.stepOrder ?? index,
                type: step.type ?? 'user',
                name: step.name ?? `Etapa ${index + 1}`,
                metadata,
                uiPosition: step.position ?? { x: 0, y: 0 },
              }
            })

            const transitions = templateData.transitions
              .map((transition, index) => {
                const fromStepId =
                  transition.from_step_id ??
                  transition.fromStepId ??
                  transition.source ??
                  transition.from ??
                  ''

                const toStepId =
                  transition.to_step_id ??
                  transition.toStepId ??
                  transition.target ??
                  transition.to ??
                  ''

                if (!fromStepId || !toStepId) {
                  return null
                }

                return {
                  id: transition.id,
                  fromStepId,
                  toStepId,
                  condition: transition.condition ?? (transition.label ? 'custom' : 'always'),
                  metadata: {
                    label: transition.metadata?.label ?? transition.label ?? null,
                    isAutomatic: transition.metadata?.isAutomatic ?? transition.isAutomatic ?? false,
                  },
                  order: index,
                }
              })
              .filter((transition): transition is { id?: string; fromStepId: string; toStepId: string; condition: string; metadata: Record<string, any>; order: number } => Boolean(transition))

            const payload = {
              id: templateData.template.id ?? editingTemplate?.id,
              name,
              description: templateData.template.description ?? '',
              status: templateData.template.status ?? 'draft',
              entityId:
                templateData.template.entity_id ??
                templateData.template.entityId ??
                undefined,
              steps,
              transitions: transitions.map(({ order, ...rest }) => rest),
            }

            const result = await handleSaveTemplate(payload)

            if (result?.success !== false) {
              setShowTemplateDialog(false)
              setEditingTemplate(null)
            }

            return result
          }}
          onClose={() => {
            setShowTemplateDialog(false)
            setEditingTemplate(null)
          }}
        />
      )}

      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && !deletingTemplate && setTemplateToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir template</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"? Esta ação é definitiva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateToDelete(null)} disabled={deletingTemplate}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deletingTemplate}
              onClick={async () => {
                if (!templateToDelete) return
                setDeletingTemplate(true)
                const result = await templates.deleteTemplate(templateToDelete.id as string)
                setDeletingTemplate(false)
                if (result.success) {
                  toast({ title: 'Template excluído com sucesso.' })
                  setTemplateToDelete(null)
                  setEditingTemplate(null)
                } else {
                  toast({
                    title: 'Erro ao excluir template',
                    description: result.error,
                    variant: 'destructive',
                  })
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

