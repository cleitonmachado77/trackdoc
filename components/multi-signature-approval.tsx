'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { useMultiSignatureRequests } from '@/hooks/use-multi-signature-requests'
import { useToast } from '@/hooks/use-toast'

interface MultiSignatureApprovalProps {
  requestId: string
  documentName: string
  requesterName?: string
  onSuccess?: () => void
  className?: string
}

export default function MultiSignatureApproval({
  requestId,
  documentName,
  requesterName,
  onSuccess,
  className = ''
}: MultiSignatureApprovalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { approveSignature } = useMultiSignatureRequests()
  const { toast } = useToast()

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      const result = await approveSignature(requestId, 'approve', comments)
      
      if (result.success) {
        toast({
          title: "Assinatura Aprovada",
          description: "Sua assinatura foi registrada com sucesso.",
        })
        onSuccess?.()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao aprovar assinatura",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro interno ao processar aprovação",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      const result = await approveSignature(requestId, 'reject', comments)
      
      if (result.success) {
        toast({
          title: "Assinatura Rejeitada",
          description: "Sua rejeição foi registrada e a solicitação foi cancelada.",
        })
        onSuccess?.()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao rejeitar assinatura",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro interno ao processar rejeição",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Solicitação de Assinatura
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informações do Documento */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Documento:</span>
            <span className="text-gray-700">{documentName}</span>
          </div>
          
          {requesterName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Solicitado por:</span>
              <span className="text-gray-700">{requesterName}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Data:</span>
            <span className="text-gray-700">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Aviso Importante */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">Atenção:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Ao aprovar, você confirma que leu e concorda com o conteúdo do documento</li>
                <li>Ao rejeitar, toda a solicitação de assinatura múltipla será cancelada</li>
                <li>Esta ação não pode ser desfeita</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Comentários */}
        <div className="space-y-2">
          <Label htmlFor="comments">
            Comentários (opcional)
          </Label>
          <Textarea
            id="comments"
            placeholder="Adicione comentários sobre sua decisão..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processando...' : 'Aprovar e Assinar'}
          </Button>
          
          <Button
            onClick={handleReject}
            disabled={isProcessing}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processando...' : 'Rejeitar'}
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Aprovar: Sua assinatura será adicionada ao documento</div>
          <div>• Rejeitar: A solicitação será cancelada para todos os usuários</div>
          <div>• Comentários: Serão visíveis para o solicitante</div>
        </div>
      </CardContent>
    </Card>
  )
}
