'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { useMultiSignatureRequests } from '@/hooks/use-multi-signature-requests'
import MultiSignatureProgressDisplay from '@/components/multi-signature-progress-display'
import MultiSignatureApproval from '@/components/multi-signature-approval'
import { useToast } from '@/hooks/use-toast'

export default function MultiSignatureRequestsPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const { 
    getMyRequests, 
    getMyPendingApprovals, 
    loading, 
    error 
  } = useMultiSignatureRequests()
  
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [requests, approvals] = await Promise.all([
      getMyRequests(),
      getMyPendingApprovals()
    ])
    setMyRequests(requests)
    setPendingApprovals(approvals)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assinaturas Múltiplas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas solicitações de assinatura múltipla e aprovações pendentes
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Aprovações Pendentes ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Minhas Solicitações ({myRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma aprovação pendente
                </h3>
                <p className="text-gray-500">
                  Você não tem nenhuma solicitação de assinatura pendente no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {approval.request?.document_name}
                      </CardTitle>
                      <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {approval.request?.total_signatures} usuário(s)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedRequest(approval.request_id)}
                        className="flex-1"
                      >
                        Ver Detalhes e Aprovar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {myRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma solicitação criada
                </h3>
                <p className="text-gray-500">
                  Você ainda não criou nenhuma solicitação de assinatura múltipla.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {request.document_name}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {request.completed_signatures}/{request.total_signatures} assinaturas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="text-gray-600 capitalize">
                          {request.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedRequest(request.id)}
                        className="flex-1"
                      >
                        Ver Progresso
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Detalhes da Solicitação</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                >
                  Fechar
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Se for uma aprovação pendente, mostrar componente de aprovação */}
                {activeTab === 'pending' && pendingApprovals.find(a => a.request_id === selectedRequest) && (
                  <MultiSignatureApproval
                    requestId={selectedRequest}
                    documentName={pendingApprovals.find(a => a.request_id === selectedRequest)?.request?.document_name || ''}
                    onSuccess={() => {
                      setSelectedRequest(null)
                      loadData()
                    }}
                  />
                )}
                
                {/* Se for uma solicitação própria, mostrar progresso */}
                {activeTab === 'requests' && (
                  <MultiSignatureProgressDisplay
                    requestId={selectedRequest}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
