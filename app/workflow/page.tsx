'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import ProcessList from '@/app/components/workflow/process-list'
import StartProcess from '@/app/components/workflow/start-process'
import { useWorkflowProcesses, useWorkflowExecutions, useWorkflowSignature, useWorkflowActions, WorkflowProcessResponse } from '@/hooks/useWorkflow'
import { useAuth } from '@/lib/contexts/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, PenTool, CornerUpLeft } from 'lucide-react'

export default function WorkflowPage() {
  const { user } = useAuth()
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | 'sign' | 'return' | null>(null)
  const [comments, setComments] = useState('')

  const assigned = useWorkflowProcesses('assigned')
  const mine = useWorkflowProcesses('mine')
  const executions = useWorkflowExecutions(selectedProcessId)
  const signature = useWorkflowSignature(selectedProcessId)

  const selectedProcess = useMemo<WorkflowProcessResponse | null>(() => {
    if (!selectedProcessId) return null
    const all = [...(assigned.processes || []), ...(mine.processes || [])]
    return all.find((p) => p.id === selectedProcessId) ?? null
  }, [selectedProcessId, assigned.processes, mine.processes])

  const actions = useWorkflowActions(selectedProcess, user?.id ?? null)

  const handleRefresh = () => {
    assigned.fetchProcesses()
    mine.fetchProcesses()
  }

  const openActionDialog = (executionId: string, actionType: typeof action) => {
    setSelectedExecutionId(executionId)
    setAction(actionType)
  }

  const handleExecute = async () => {
    if (!selectedProcessId || !selectedExecutionId || !action) return

    try {
      let result
      if (action === 'return') {
        result = await executions.returnStep({ executionId: selectedExecutionId, comments })
      } else if (action === 'sign') {
        result = await signature.sendSignatureRequest({ executionId: selectedExecutionId, action: 'sign', comments })
      } else {
        result = await executions.executeAction({ executionId: selectedExecutionId, action, payload: { comments } })
      }

      if (result.success) {
        setSelectedExecutionId(null)
        setAction(null)
        setComments('')
        handleRefresh()
      } else {
        alert(result.error || 'Erro ao executar ação')
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao executar ação')
    }
  }

  const renderPendingExecutions = () => {
    if (!selectedProcess || !selectedProcess.pendingExecutions || selectedProcess.pendingExecutions.length === 0) {
      return <p className="text-sm text-gray-500">Nenhuma ação pendente.</p>
    }

    return (
      <div className="space-y-4">
        {selectedProcess.pendingExecutions.map((execution) => {
          const step = execution.step
          const metadata = step.metadata || {}
          const actionType = metadata.actionType

          const showApproveReject = actions.canApprove && actionType === 'approve'
          const showSign = actions.canSign && actionType === 'sign'
          const showAdvance = actions.canAdvance && step.type === 'user'
          const showReturn = actions.canReturn

          return (
            <Card key={execution.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{step.name}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {step.type === 'action'
                      ? actionType === 'approve'
                        ? 'Aguardando aprovação'
                        : 'Aguardando assinatura'
                      : 'Ação do usuário'}
                  </p>
                </div>
                <Badge>{step.type === 'action' ? 'Ação' : 'Usuário'}</Badge>
              </CardHeader>

              <CardContent className="flex flex-wrap gap-2">
                {showAdvance && (
                  <Button onClick={() => openActionDialog(execution.id, 'approve')}>
                    Avançar
                  </Button>
                )}

                {showReturn && (
                  <Button variant="outline" onClick={() => openActionDialog(execution.id, 'return')}>
                    <CornerUpLeft className="h-4 w-4 mr-2" /> Voltar
                  </Button>
                )}

                {showApproveReject && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openActionDialog(execution.id, 'approve')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openActionDialog(execution.id, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Reprovar
                    </Button>
                  </>
                )}

                {showSign && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openActionDialog(execution.id, 'sign')}>
                    <PenTool className="h-4 w-4 mr-2" /> Assinar
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderTimeline = () => {
    if (!selectedProcess) return null

    const steps = selectedProcess.executions || []

    return (
      <div className="space-y-2">
        {steps.map((execution) => (
          <div key={execution.id} className="flex items-center gap-3 p-3 border rounded">
            <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
              {execution.status.toUpperCase()}
            </Badge>
            <div className="flex-1">
              <p className="font-medium">{execution.step.name}</p>
              <p className="text-xs text-gray-500">
                {execution.assignedUser?.fullName || 'Usuário'} • {execution.actionTaken || '--'}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tramitação de Documentos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie processos, solicitações de assinatura e aprovações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <StartProcess onProcessStarted={handleRefresh} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProcessList onProcessSelect={setSelectedProcessId} />
        </CardContent>
      </Card>

      <Dialog open={!!selectedProcess} onOpenChange={(open) => !open && setSelectedProcessId(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{selectedProcess?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Template:</strong> {selectedProcess?.template.name}</p>
                <p><strong>Documento:</strong> {selectedProcess?.document.title}</p>
                <p>
                  <strong>Status:</strong> <Badge className="ml-2">{selectedProcess?.status}</Badge>
                </p>
              </CardContent>
            </Card>

            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">Ações Pendentes</TabsTrigger>
                <TabsTrigger value="timeline">Histórico</TabsTrigger>
              </TabsList>
              <TabsContent value="pending">{renderPendingExecutions()}</TabsContent>
              <TabsContent value="timeline">{renderTimeline()}</TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedExecutionId} onOpenChange={(open) => !open && setSelectedExecutionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirmar {action === 'approve' ? 'aprovação' : action === 'reject' ? 'reprovação' : action === 'sign' ? 'assinatura' : 'retorno'}
            </DialogTitle>
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
              <Button onClick={handleExecute}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

