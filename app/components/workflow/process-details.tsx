'use client'

import { Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, GitBranch, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/contexts/auth-context'
import { WorkflowProcessResponse, ExecutionResponse } from '@/hooks/useWorkflow'
import { useWorkflowActions } from '@/hooks/useWorkflowActions'

interface ProcessDetailsProps {
  process: WorkflowProcessResponse | null
  onExecute: (executionId: string, action: 'approve' | 'reject' | 'sign' | 'return') => void
}

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  paused: 'Pausado',
}

export default function ProcessDetails({ process, onExecute }: ProcessDetailsProps) {
  const { user } = useAuth()

  const actions = useWorkflowActions(process, user?.id ?? null)

  if (!process) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Selecione um processo para visualizar detalhes.</p>
        </CardContent>
      </Card>
    )
  }

  const pendingExecutions = process.pendingExecutions ?? []
  const hasPendingForUser = pendingExecutions.some(exec => exec.assignedTo === user?.id)

  const renderPendingExecution = (execution: ExecutionResponse) => {
    const step = execution.step
    const metadata = (step.metadata ?? {}) as { actionType?: 'sign' | 'approve'; targetUsers?: string[] }

    const allowApproveReject = actions.canApprove && metadata.actionType === 'approve'
    const allowSign = actions.canSign && metadata.actionType === 'sign'

    return (
      <Card key={execution.id}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{step.name}</CardTitle>
          <Badge>{step.type === 'action' ? (metadata.actionType === 'sign' ? 'Assinatura' : 'Aprovação') : 'Usuário'}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {step.type === 'action'
              ? metadata.actionType === 'sign'
                ? 'Aguardando assinatura'
                : 'Aguardando aprovação'
              : 'Aguardando ação do usuário'}
          </div>

          <div className="flex flex-wrap gap-2">
            {actions.canReturn && (
              <Button variant="outline" size="sm" onClick={() => onExecute(execution.id, 'return')}>
                Retornar
              </Button>
            )}
            {allowApproveReject && (
              <Fragment>
                <Button size="sm" onClick={() => onExecute(execution.id, 'approve')} className="bg-green-600 hover:bg-green-700">
                  Aprovar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onExecute(execution.id, 'reject')}>
                  Reprovar
                </Button>
              </Fragment>
            )}
            {allowSign && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => onExecute(execution.id, 'sign')}>
                Assinar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Nome:</strong> {process.name}
          </div>
          <div>
            <strong>Status:</strong> <Badge>{statusLabel[process.status] ?? process.status}</Badge>
          </div>
          <div>
            <strong>Template:</strong> {process.template.name}
          </div>
          <div>
            <strong>Documento:</strong> {process.document.title}
          </div>
          {process.document.download_url && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(process.document.download_url!, '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" /> Ver documento
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue={hasPendingForUser ? 'pending' : 'flow'} className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Ações Pendentes</TabsTrigger>
          <TabsTrigger value="flow">Fluxo e Etapas</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Ações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingExecutions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ação pendente.</p>
              ) : (
                <div className="space-y-3">{pendingExecutions.map(renderPendingExecution)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo do Processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.template?.steps?.length ? (
                <div className="space-y-2">
                  {process.template.steps.map((step: any, index: number) => {
                    const executionsForStep = process.executions?.filter(exec => exec.step.id === step.id) ?? []
                    const lastExecution = executionsForStep[executionsForStep.length - 1]
                    const isCurrent = step.id === process.currentStepId
                    const pendingCount = process.pendingExecutions?.filter(pe => pe.step.id === step.id).length ?? 0
                    const hasCompleted = executionsForStep.some(exec => exec.status === 'completed')

                    return (
                      <div
                        key={step.id || index}
                        className={cn(
                          'border rounded-md p-3 flex flex-col gap-2 transition-colors',
                          isCurrent ? 'border-primary bg-primary/5' : 'border-border',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {hasCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : isCurrent ? (
                              <Clock className="h-4 w-4 text-primary" />
                            ) : (
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="font-medium">{step.name}</div>
                          </div>
                          <Badge variant={isCurrent ? 'default' : step.type === 'action' ? 'secondary' : 'outline'}>
                            {isCurrent ? 'Etapa atual' : step.type === 'action' ? 'Ação' : 'Usuário'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {step.type === 'action'
                            ? step.metadata?.actionType === 'sign'
                              ? 'Coleta de assinatura'
                              : 'Solicitação de aprovação'
                            : 'Responsável da etapa'}
                        </div>
                        {step.metadata?.userId && (
                          <div className="text-sm">
                            <strong>Responsável:</strong> {step.metadata?.userName || step.metadata?.userId}
                          </div>
                        )}
                        {step.metadata?.targetUsers?.length ? (
                          <div className="text-xs text-muted-foreground">
                            <strong>Usuários-alvo:</strong> {step.metadata.targetUsers.length}
                          </div>
                        ) : null}
                        {pendingCount > 0 && (
                          <Badge variant="outline">{pendingCount} pendência(s)</Badge>
                        )}
                        {executionsForStep.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Última ação: {lastExecution?.actionTaken || lastExecution?.status}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fluxo do template não disponível. Edite o template para visualizar as etapas.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64 pr-4">
            <div className="space-y-3 text-sm">
              {process.executions
                ?.slice()
                .reverse()
                .map((execution) => (
                  <div key={execution.id} className="border rounded-md p-3">
                    <div className="flex justify-between">
                      <div className="font-medium">{execution.step.name}</div>
                      <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>{execution.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {execution.assignedUser?.fullName ?? 'Usuário'} • {execution.actionTaken ?? '---'}
                    </div>
                    {execution.comments && <div className="mt-2 text-xs">{execution.comments}</div>}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

