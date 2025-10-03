'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Clock, CheckCircle, XCircle, PlayCircle, Users, Trash2 } from 'lucide-react'
import { useWorkflowProcesses, WorkflowProcessResponse } from '@/hooks/useWorkflow'
import { useToast } from '@/hooks/use-toast'

interface ProcessListProps {
  onProcessSelect: (processId: string) => void
}

export default function ProcessList({ onProcessSelect }: ProcessListProps) {
  const assigned = useWorkflowProcesses('assigned')
  const mine = useWorkflowProcesses('mine')
  const { toast } = useToast()

  const [processToDelete, setProcessToDelete] = useState<WorkflowProcessResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    assigned.fetchProcesses()
    mine.fetchProcesses()
  }, [assigned.fetchProcesses, mine.fetchProcesses])

  const canDelete = useMemo(() => new Set(mine.processes.map(p => p.id)), [mine.processes])

  const renderProcesses = (
    processes: WorkflowProcessResponse[],
    loading: boolean,
    error: string | null,
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Carregando processos...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={assigned.fetchProcesses} variant="outline">
            Tentar novamente
          </Button>
        </div>
      )
    }

    if (!processes || processes.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum processo encontrado</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {processes.map((process) => (
          <Card key={process.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{process.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusIcon(process.status)}
                  <Badge className={getStatusColor(process.status)}>
                    {getStatusLabel(process.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Template:</strong> {process.template.name}
                </p>

                <p className="text-sm text-gray-600">
                  <strong>Documento:</strong> {process.document.title}
                </p>

                {process.pendingExecutions && process.pendingExecutions.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{process.pendingExecutions.length} ação(ões) pendente(s)</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-gray-500">
                    Iniciado em {new Date(process.startedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => onProcessSelect(process.id)} size="sm">
                      Ver detalhes
                    </Button>
                    {canDelete.has(process.id) && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setProcessToDelete(process)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="assigned">
        <TabsList>
          <TabsTrigger value="assigned">Pendentes para mim</TabsTrigger>
          <TabsTrigger value="mine">Iniciados por mim</TabsTrigger>
        </TabsList>
        <TabsContent value="assigned">
          {renderProcesses(assigned.processes ?? [], assigned.loading, assigned.error)}
        </TabsContent>
        <TabsContent value="mine">
          {renderProcesses(mine.processes ?? [], mine.loading, mine.error)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!processToDelete} onOpenChange={(open) => !open && !deleting && setProcessToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir processo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o processo "{processToDelete?.name}"? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProcessToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!processToDelete) return
                setDeleting(true)
                const result = await mine.deleteProcess(processToDelete.id)
                setDeleting(false)
                if (result.success) {
                  toast({ title: 'Processo excluído com sucesso.' })
                  setProcessToDelete(null)
                  assigned.fetchProcesses()
                } else {
                  toast({
                    title: 'Erro ao excluir processo',
                    description: result.error,
                    variant: 'destructive',
                  })
                }
              }}
              disabled={deleting}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'completed':
      return 'Concluído'
    case 'cancelled':
      return 'Cancelado'
    case 'paused':
      return 'Pausado'
    default:
      return status
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <PlayCircle className="h-4 w-4 text-green-600" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-blue-600" />
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'paused':
      return <Clock className="h-4 w-4 text-yellow-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

