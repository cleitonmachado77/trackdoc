"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  User,
  Calendar,
  Building2,
  Tag,
  Download,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Hash,
} from "lucide-react"

interface DocumentPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: any
  onEdit: () => void
  onDownload: () => void
  onViewAudit: () => void
}

// Função para obter ícone do formato do arquivo
const getFileTypeIcon = (fileType: string) => {
  switch (fileType) {
    case "word":
      return { icon: FileText, color: "text-blue-600", label: "Word Document" }
    case "excel":
      return { icon: FileSpreadsheet, color: "text-green-600", label: "Excel Spreadsheet" }
    case "powerpoint":
      return { icon: Presentation, color: "text-orange-600", label: "PowerPoint Presentation" }
    case "pdf":
      return { icon: File, color: "text-red-600", label: "PDF Document" }
    default:
      return { icon: FileText, color: "text-gray-600", label: "Document" }
  }
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em aprovação",
  pending_approval: "Em aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
}

const statusIcons: Record<string, any> = {
  draft: AlertCircle,
  pending: Clock,
  approved: CheckCircle,
  rejected: AlertCircle,
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
  onEdit,
  onDownload,
  onViewAudit,
}: DocumentPreviewModalProps) {
  if (!document) return null

  const fileTypeInfo = getFileTypeIcon(document.fileType)
  const FileIcon = fileTypeInfo.icon
  const StatusIcon = statusIcons[document.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <FileIcon className={`h-6 w-6 ${fileTypeInfo.color}`} />
            <span>{document.title}</span>
            <Badge className={statusColors[document.status]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusLabels[document.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Informações do Documento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Número:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{document.number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Versão:</span>
                    <span className="text-sm">v{document.version}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Tipo:</span>
                    <span className="text-sm">{document.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Setor:</span>
                    <span className="text-sm">{document.sector}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Autor:</span>
                    <span className="text-sm">{document.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Criado em:</span>
                    <span className="text-sm">{formatDate(document.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Atualizado em:</span>
                    <span className="text-sm">{formatDate(document.updatedAt)}</span>
                  </div>
                  {document.metadata?.category && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Categoria:</span>
                      <Badge variant="outline">{document.metadata.category}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Arquivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileIcon className={`h-4 w-4 ${fileTypeInfo.color}`} />
                <span>Arquivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileIcon className={`h-8 w-8 ${fileTypeInfo.color}`} />
                  <div>
                    <p className="font-medium">{document.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {fileTypeInfo.label} • {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Descrição e Metadados */}
          {(document.metadata?.description || document.metadata?.tags) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Detalhes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.metadata?.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{document.metadata.description}</p>
                  </div>
                )}
                {document.metadata?.tags && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {document.metadata.tags.split(",").map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status de Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <StatusIcon
                  className={`h-4 w-4 ${
                    document.status === "approved"
                      ? "text-green-600"
                      : document.status === "rejected"
                        ? "text-red-600"
                        : document.status === "pending"
                          ? "text-yellow-600"
                          : "text-gray-600"
                  }`}
                />
                <span>Status do Documento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.status === "pending" && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Em aprovação</p>
                      <p className="text-sm text-yellow-600">
                        {document.approvals} de {document.totalApprovals} aprovações recebidas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round((document.approvals / document.totalApprovals) * 100)}%
                    </div>
                    <div className="text-xs text-yellow-600">Concluído</div>
                  </div>
                </div>
              )}

              {document.status === "approved" && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Documento Aprovado</p>
                      <p className="text-sm text-green-600">Aprovado por {document.totalApprovals} aprovadores</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <div className="text-xs text-green-600">Aprovado</div>
                  </div>
                </div>
              )}

              {document.status === "rejected" && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Documento Rejeitado</p>
                      <p className="text-sm text-red-600">Rejeitado durante o processo de aprovação</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">0%</div>
                    <div className="text-xs text-red-600">Rejeitado</div>
                  </div>
                </div>
              )}

              {document.status === "draft" && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Documento em Rascunho</p>
                      <p className="text-sm text-gray-600">Documento ainda não foi enviado para aprovação</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-600">--</div>
                    <div className="text-xs text-gray-600">Rascunho</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Estatísticas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">v{document.version}</div>
                  <div className="text-xs text-gray-500">Versão Atual</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">{Math.floor(Math.random() * 50) + 10}</div>
                  <div className="text-xs text-gray-500">Visualizações</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{Math.floor(Math.random() * 20) + 5}</div>
                  <div className="text-xs text-gray-500">Downloads</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{Math.floor(Math.random() * 10) + 1}</div>
                  <div className="text-xs text-gray-500">Dias Ativo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Ações */}
        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onViewAudit}>
              <Clock className="h-4 w-4 mr-2" />
              Ver Auditoria
            </Button>
            <Button variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {document.status === "draft" && (
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
