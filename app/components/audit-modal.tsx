"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FileText, Edit, Send, CheckCircle, Download, Eye, Clock, ExternalLink, Calendar, User, FileIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DocumentData {
  id: string
  title: string
  document_number?: string
  version?: string
  status: string
  author?: { full_name: string } | string
  department?: string
  created_at: string
  updated_at: string
  file_path?: string
  download_url?: string
  final_url?: string
  supabase_url?: string
  file_type?: string
  file_size?: number
  description?: string
  tags?: string
  category?: string
}

interface AuditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: DocumentData | null
}

export default function AuditModal({ open, onOpenChange, document }: AuditModalProps) {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [documentStats, setDocumentStats] = useState({
    totalActions: 0,
    uniqueUsers: 0,
    versions: 1,
    daysActive: 0
  })

  useEffect(() => {
    if (open && document?.id) {
      fetchDocumentAuditData()
    }
  }, [open, document?.id])

  const fetchDocumentAuditData = async () => {
    if (!document?.id) return

    try {
      setLoading(true)

      // Por enquanto, vamos criar logs básicos baseados nos dados do documento
      // já que a tabela audit_logs pode não existir
      let logs: any[] = []
      
      // Criar log de criação baseado nos dados reais
      const authorName = typeof document.author === 'string' 
        ? document.author 
        : document.author?.full_name || 'Sistema'
      
      logs = [
        {
          id: 'created',
          action: 'created',
          user: authorName,
          timestamp: document.created_at,
          details: `Documento "${document.title}" foi criado`,
          metadata: { document_id: document.id }
        }
      ]

      // Adicionar log de atualização se diferente da criação
      if (document.updated_at && document.updated_at !== document.created_at) {
        logs.push({
          id: 'updated',
          action: 'updated',
          user: authorName,
          timestamp: document.updated_at,
          details: `Documento "${document.title}" foi atualizado`,
          metadata: { document_id: document.id }
        })
      }

      setAuditLogs(logs)

      // Calcular estatísticas
      const uniqueUsers = new Set(logs.map(log => log.user || log.user?.full_name)).size
      const daysActive = document ? Math.ceil((Date.now() - new Date(document.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

      setDocumentStats({
        totalActions: logs.length,
        uniqueUsers,
        versions: 1, // Por enquanto, assumir 1 versão
        daysActive
      })

    } catch (error) {
      console.error('Erro ao buscar dados de auditoria:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <FileText className="h-4 w-4" />
      case 'updated': return <Edit className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <FileText className="h-4 w-4" />
      case 'downloaded': return <Download className="h-4 w-4" />
      case 'viewed': return <Eye className="h-4 w-4" />
      default: return <FileIcon className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800'
      case 'updated': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'downloaded': return 'bg-purple-100 text-purple-800'
      case 'viewed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created': return 'Criado'
      case 'updated': return 'Atualizado'
      case 'approved': return 'Aprovado'
      case 'rejected': return 'Rejeitado'
      case 'downloaded': return 'Download'
      case 'viewed': return 'Visualizado'
      default: return action
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownload = async () => {
    if (document?.file_path) {
      try {
        // Gerar URL de download do Supabase Storage
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.file_path, 3600) // 1 hora de validade
        
        if (error) throw error
        
        // Obter a extensão do arquivo original
        const fileExtension = document.file_name?.split('.').pop() || 'pdf'
        const fileName = `${document.title || 'documento'}.${fileExtension}`
        
        // Tentar download direto primeiro
        try {
          const response = await fetch(data.signedUrl)
          const blob = await response.blob()
          
          // Criar URL do blob
          const blobUrl = window.URL.createObjectURL(blob)
          
          // Criar link para download
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = fileName
          link.style.display = 'none'
          
          // Adicionar ao DOM, clicar e remover
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // Limpar URL do blob
          window.URL.revokeObjectURL(blobUrl)
          
          console.log('📥 Download iniciado:', fileName)
          
        } catch (fetchError) {
          console.warn('Fetch falhou, tentando método alternativo:', fetchError)
          
          // Fallback: abrir em nova aba
          window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
        }
      } catch (error) {
        console.error('Erro ao baixar arquivo:', error)
        // Fallback para URL pública se o signed URL falhar
        const publicUrl = `https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/documents/${document.file_path}`
        window.open(publicUrl, '_blank')
      }
    }
  }

  const handleViewDocument = () => {
    if (document?.file_path) {
      setShowPdfViewer(true)
    }
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="audit-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Auditoria do Documento
          </DialogTitle>
        </DialogHeader>
        <div id="audit-description" className="sr-only">
          Modal de auditoria mostrando informações detalhadas do documento, histórico de ações e estatísticas
        </div>

        <div className="space-y-6">
          {/* Document Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileIcon className="h-5 w-5" />
                {document.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Número:</span>
                  <span>{document.document_number || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Versão:</span>
                  <span>{document.version || '1.0'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge className={document.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {document.status === "approved" ? "Aprovado" : 
                     document.status === "pending" || document.status === "pending_approval" ? "Em aprovação" : "Rascunho"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Autor:</span>
                  <span>{typeof document.author === 'string' ? document.author : document.author?.full_name || 'Desconhecido'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Setor:</span>
                  <span>{typeof document.department === 'string' ? document.department : document.department?.name || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Criado em:</span>
                  <span>{formatDate(document.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Atualizado em:</span>
                  <span>{formatDate(document.updated_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Tipo:</span>
                  <span>{document.file_type || 'Não informado'}</span>
                </div>
              </div>

              {/* File Actions */}
              {document?.file_path && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-800">Ações do Documento:</span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleDownload} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                    <Button onClick={handleViewDocument} variant="default" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{documentStats.totalActions}</div>
                <div className="text-sm text-gray-600">Total de Ações</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{documentStats.uniqueUsers}</div>
                <div className="text-sm text-gray-600">Usuários Envolvidos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{documentStats.versions}</div>
                <div className="text-sm text-gray-600">Versões</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{documentStats.daysActive}</div>
                <div className="text-sm text-gray-600">Dias Ativos</div>
              </CardContent>
            </Card>
          </div>

          {/* Audit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Ações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Carregando histórico...</div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={getActionColor(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                          <span className="font-medium text-sm">
                            {log.user?.full_name || log.user || 'Sistema'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nenhum histórico de ações encontrado para este documento.
                </div>
              )}
            </CardContent>
          </Card>

          {/* PDF Viewer Modal */}
          {showPdfViewer && document?.file_path && (
            <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
              <DialogContent className="max-w-6xl max-h-[90vh] w-full">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visualizando: {document.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="w-full h-[70vh] border border-gray-300 rounded overflow-hidden">
                  <iframe
                    src={`https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/documents/${document.file_path}`}
                    className="w-full h-full"
                    title="Documento PDF"
                    onLoad={() => {
                      console.log('AuditModal - PDF carregado com sucesso')
                    }}
                    onError={() => {
                      console.log('AuditModal - Erro ao carregar PDF')
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}