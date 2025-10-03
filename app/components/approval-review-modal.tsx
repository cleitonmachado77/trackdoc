"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Download,
  ExternalLink,
  FileText,
  Image,
  File,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react"
import { useApprovals } from "@/hooks/use-approvals"
import { useToast } from "@/hooks/use-toast"

interface ApprovalWorkflow {
  id: string
  document_id: string
  approver_id: string
  step_order: number
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approved_at?: string
  created_at: string
  updated_at: string
  document_title?: string
  document_author_name?: string
  document_file_path?: string
  document_file_name?: string
  document_file_type?: string
}

interface ApprovalReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  approval: ApprovalWorkflow | null
  onSuccess: () => void
}

export default function ApprovalReviewModal({ 
  open, 
  onOpenChange, 
  approval, 
  onSuccess 
}: ApprovalReviewModalProps) {
  const { approveDocument } = useApprovals()
  const { toast } = useToast()
  const [comments, setComments] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resetar estado quando o modal abrir
  useEffect(() => {
    if (open && approval) {
      setComments("")
      setIsProcessing(false)
      setLoading(true)
      setError(null)
      
      // Simular carregamento do documento
      const timer = setTimeout(() => {
        setLoading(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [open, approval])

  const handleApprove = async () => {
    if (!approval) return
    
    try {
      setIsProcessing(true)
      await approveDocument(approval.id, true, comments)
      
      toast({
        title: "Documento aprovado!",
        description: "O documento foi aprovado com sucesso.",
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar o documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!approval) return
    
    try {
      setIsProcessing(true)
      await approveDocument(approval.id, false, comments)
      
      toast({
        title: "Documento rejeitado",
        description: "O documento foi rejeitado com sucesso.",
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar o documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (approval?.document_file_path) {
      const link = document.createElement('a')
      link.href = approval.document_file_path
      link.download = approval.document_file_name || 'documento.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleOpenInNewTab = () => {
    if (approval?.document_file_path) {
      window.open(approval.document_file_path, '_blank')
    }
  }

  const getFileIcon = () => {
    if (!approval?.document_file_type) return <FileText className="h-8 w-8 text-gray-500" />
    
    if (approval.document_file_type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    if (approval.document_file_type.startsWith("image/")) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  const isPDF = approval?.document_file_type === "application/pdf"

  if (!approval) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Revisar Documento para Aprovação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  {getFileIcon()}
                  <div>
                    <h3 className="font-medium">{approval.document_title || 'Documento sem título'}</h3>
                    <p className="text-sm text-gray-500">
                      {approval.document_file_name || 'Arquivo não especificado'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Autor: {approval.document_author_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Criado em: {new Date(approval.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Arquivo */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Visualizador do Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visualização do Documento</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando documento...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleDownload} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                    <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Nova Aba
                    </Button>
                  </div>
                </div>
              ) : approval.document_file_path ? (
                <div className="w-full">
                  {isPDF ? (
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
                        <iframe
                          src={approval.document_file_path}
                          className="w-full h-[600px] border-0"
                          title="Documento PDF"
                          onLoad={() => setLoading(false)}
                          onError={() => {
                            setLoading(false)
                            setError("Erro ao carregar o PDF. Use as opções de download ou nova aba.")
                          }}
                        />
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 text-center mb-2">
                          Se o PDF não aparecer acima, use uma das opções abaixo:
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={handleDownload} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </Button>
                          <Button onClick={handleOpenInNewTab} variant="default" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir em Nova Aba
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        Visualização não disponível para este tipo de arquivo.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleDownload} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                        <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Nova Aba
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum arquivo anexado para visualização</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Decisão de Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Decisão de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments">Comentários (opcional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Adicione comentários sobre sua decisão..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {isProcessing ? 'Processando...' : 'Reprovar'}
                </Button>
                
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isProcessing ? 'Processando...' : 'Aprovar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
