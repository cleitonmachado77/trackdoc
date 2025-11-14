"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  FileText,
  Eye
} from "lucide-react"

interface ApprovalDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  approval: any
}

export default function ApprovalDetailsModal({ 
  open, 
  onOpenChange, 
  approval 
}: ApprovalDetailsModalProps) {
  if (!approval) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Detalhes da Aprovação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">
                  {approval.document_title || 'Documento sem título'}
                </h3>
                {getStatusBadge(approval.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    <strong>Autor:</strong> {approval.document_author_name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    <strong>Criado em:</strong> {formatDate(approval.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow de Aprovação */}
          {approval.approval_workflows && approval.approval_workflows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow de Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approval.approval_workflows.map((workflow: any, index: number) => (
                    <div key={workflow.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Etapa {index + 1}</span>
                          {getStatusIcon(workflow.status)}
                        </div>
                        {getStatusBadge(workflow.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            <strong>Aprovador:</strong> {workflow.profiles?.[0]?.full_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            <strong>
                              {workflow.status === 'approved' ? 'Aprovado em:' : 
                               workflow.status === 'rejected' ? 'Rejeitado em:' : 
                               'Criado em:'}
                            </strong>{' '}
                            {workflow.approved_at ? formatDate(workflow.approved_at) : 
                             workflow.created_at ? formatDate(workflow.created_at) : 
                             'Data não disponível'}
                          </span>
                        </div>
                      </div>

                      {/* Comentários */}
                      {workflow.comments && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-sm">Comentários:</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {workflow.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comentários da Aprovação Atual */}
          {approval.comments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Comentários da Decisão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {approval.comments}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo Final */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status Final:</span>
                  <span className="font-medium">{getStatusBadge(approval.status)}</span>
                </div>
                {approval.approved_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Data da Decisão:</span>
                    <span className="font-medium">{formatDate(approval.approved_at)}</span>
                  </div>
                )}
                {approval.approver_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Decidido por:</span>
                    <span className="font-medium">{approval.approver_name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
