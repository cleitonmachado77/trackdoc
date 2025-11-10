'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  FileCheck,
  AlertCircle
} from 'lucide-react'
import { useMultiSignatureProgress, MultiSignatureProgress } from '@/hooks/use-multi-signature-progress'
import { cn } from '@/lib/utils'

interface MultiSignatureProgressProps {
  processId: string
  documentId: string
  className?: string
}

export default function MultiSignatureProgressComponent({
  processId,
  documentId,
  className
}: MultiSignatureProgressProps) {
  const { loading, getMultiSignatureProgress } = useMultiSignatureProgress()
  const [progress, setProgress] = useState<MultiSignatureProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProgress = async () => {
    try {
      setError(null)
      const progressData = await getMultiSignatureProgress(processId, documentId)
      setProgress(progressData)
    } catch (err) {
      setError('Erro ao carregar progresso das assinaturas')
      console.error('Erro ao carregar progresso:', err)
    }
  }

  useEffect(() => {
    if (processId && documentId) {
      loadProgress()
      
      // ✅ Refresh automático a cada 30 segundos
      const interval = setInterval(() => {
        loadProgress()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [processId, documentId])

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando progresso...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full border-red-200", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            Erro ao carregar progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-600 mb-2">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadProgress}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!progress) {
    return null // Não há assinatura múltipla ativa
  }

  const progressPercentage = progress.totalUsers > 0 
    ? Math.round((progress.signedUsers / progress.totalUsers) * 100) 
    : 0

  const isCompleted = progress.pendingUsers === 0 && progress.signedUsers > 0
  const isPending = progress.pendingUsers > 0

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Assinatura Múltipla
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadProgress}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progresso geral */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium">
              {progress.signedUsers}/{progress.totalUsers} usuários
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progressPercentage}% concluído</span>
            <span>{progress.pendingUsers} pendente(s)</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-2">
          {isCompleted && (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Concluído
            </Badge>
          )}
          {isPending && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Clock className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          )}
        </div>

        {/* Lista de usuários */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">
            Usuários ({progress.totalUsers}):
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {progress.users.map((user, index) => (
              <div 
                key={`user-${user.id}-${index}-${user.signed ? 'signed' : 'pending'}`} 
                className="flex items-center justify-between p-2 rounded-md bg-gray-50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-gray-500" />
                  <span className="font-medium">{user.full_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {user.signed ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-green-600 text-xs">
                        {user.signed_at ? new Date(user.signed_at).toLocaleString('pt-BR', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Sao_Paulo'
                        }) : 'Assinado'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-yellow-500" />
                      <span className="text-yellow-600 text-xs">Pendente</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo */}
        <div className="pt-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-green-600">{progress.signedUsers}</div>
              <div className="text-gray-500">Assinados</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">{progress.pendingUsers}</div>
              <div className="text-gray-500">Pendentes</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
