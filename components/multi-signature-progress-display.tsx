'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users, 
  FileText, 
  Calendar,
  AlertCircle
} from 'lucide-react'
import { useMultiSignatureRequests } from '@/hooks/use-multi-signature-requests'
import { useToast } from '@/hooks/use-toast'

interface MultiSignatureProgressDisplayProps {
  requestId: string
  className?: string
}

export default function MultiSignatureProgressDisplay({
  requestId,
  className = ''
}: MultiSignatureProgressDisplayProps) {
  const [progress, setProgress] = useState<any>(null)
  const { getRequestProgress, loading, error } = useMultiSignatureRequests()
  const { toast } = useToast()

  useEffect(() => {
    if (requestId) {
      loadProgress()
    }
  }, [requestId])

  const loadProgress = useCallback(async () => {
    try {
      const result = await getRequestProgress(requestId)
      setProgress(result)
    } catch (err) {
      console.error('Erro ao atualizar progresso da assinatura múltipla:', err)
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o progresso da assinatura múltipla.',
        variant: 'destructive'
      })
    }
  }, [getRequestProgress, requestId, toast])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando progresso...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !progress) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Erro ao carregar progresso: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = progress.totalSignatures > 0 
    ? (progress.completedSignatures / progress.totalSignatures) * 100 
    : 0

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
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {progress.documentName}
          </CardTitle>
          {getStatusBadge(progress.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progresso Geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso das Assinaturas</span>
            <span className="text-gray-600">
              {progress.completedSignatures} de {progress.totalSignatures}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-gray-500">
            {progressPercentage.toFixed(1)}% concluído
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {progress.completedSignatures}
            </div>
            <div className="text-xs text-green-700">Assinadas</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {progress.pendingSignatures}
            </div>
            <div className="text-xs text-yellow-700">Pendentes</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {progress.totalSignatures}
            </div>
            <div className="text-xs text-blue-700">Total</div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Usuários ({progress.totalSignatures})
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progress.users.map((user: any) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(user.status)}
                  <div>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    {user.comments && (
                      <div className="text-xs text-gray-600 mt-1 italic">
                        "{user.comments}"
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">
                    {user.status === 'approved' ? 'Assinado' : 
                     user.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </div>
                  {user.signedAt && (
                    <div className="text-xs text-gray-500">
                      {new Date(user.signedAt).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informações Adicionais */}
        {progress.status === 'completed' && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Documento assinado com sucesso!</span>
            </div>
            <div className="text-sm text-green-700 mt-1">
              Todas as assinaturas foram coletadas e o documento foi processado.
            </div>
          </div>
        )}

        {progress.status === 'cancelled' && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Solicitação cancelada</span>
            </div>
            <div className="text-sm text-red-700 mt-1">
              Esta solicitação foi cancelada e não será processada.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
