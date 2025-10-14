"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Upload,
  Download,
  RotateCcw,
  Clock,
  User,
  FileText,
  MoreHorizontal,
  History,
  AlertCircle,
} from "lucide-react"
import { getFileIcon } from "@/lib/utils/file-icons"
import { useDocumentVersions, type DocumentVersion } from "@/hooks/use-document-versions"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DocumentVersionManagerProps {
  documentId: string
  documentTitle: string
  currentVersion: number
  isOpen: boolean
  onClose: () => void
  onVersionUpdated?: () => void
}

// Função para formatar tamanho de arquivo
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DocumentVersionManager({
  documentId,
  documentTitle,
  currentVersion,
  isOpen,
  onClose,
  onVersionUpdated
}: DocumentVersionManagerProps) {
  const { versions, loading, createNewVersion, restoreVersion, downloadVersion, refetch } = useDocumentVersions(documentId)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [changeDescription, setChangeDescription] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUploadNewVersion = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para fazer upload.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      const result = await createNewVersion(documentId, selectedFile, changeDescription)
      
      if (result && result.success) {
        toast({
          title: "Nova versão criada",
          description: `Versão V${result.newVersionNumber} foi criada com sucesso.`,
        })

        // Limpar formulário
        setSelectedFile(null)
        setChangeDescription("")
        setShowUploadForm(false)
        
        // Notificar componente pai
        onVersionUpdated?.()
        
        // Fechar o modal para forçar uma atualização completa
        onClose()
      } else {
        throw new Error('Falha na criação da nova versão')
      }
    } catch (error: any) {
      console.error('Erro ao criar nova versão:', error)
      toast({
        title: "Erro ao criar versão",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRestoreVersion = async (version: DocumentVersion) => {
    if (!confirm(`Tem certeza que deseja restaurar a versão V${version.version_number}? Isso criará uma nova versão com o conteúdo selecionado.`)) {
      return
    }

    try {
      const result = await restoreVersion(version.id)
      
      if (result && result.success) {
        toast({
          title: "Versão restaurada",
          description: `A versão V${version.version_number} foi restaurada como V${result.newVersion}.`,
        })

        // Notificar componente pai com os dados atualizados
        onVersionUpdated?.()
        
        // Fechar o modal para forçar uma atualização completa
        onClose()
      } else {
        throw new Error('Falha na restauração da versão')
      }
    } catch (error: any) {
      console.error('Erro ao restaurar versão:', error)
      toast({
        title: "Erro ao restaurar versão",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadVersion = async (version: DocumentVersion) => {
    try {
      await downloadVersion(version)
      
      toast({
        title: "Download iniciado",
        description: `Download da versão V${version.version_number} iniciado.`,
      })
    } catch (error: any) {
      console.error('Erro ao baixar versão:', error)
      toast({
        title: "Erro no download",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Controle de Versões - {documentTitle}
          </DialogTitle>
          <DialogDescription>
            Gerencie as versões do documento. A versão atual é V{currentVersion}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botão para nova versão */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Versão Atual: V{currentVersion}
              </Badge>
            </div>
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Nova Versão
            </Button>
          </div>

          {/* Formulário de upload de nova versão */}
          {showUploadForm && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-4">Fazer Upload de Nova Versão</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Arquivo</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Arquivo selecionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Descrição das Alterações (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva as principais alterações desta versão..."
                    value={changeDescription}
                    onChange={(e) => setChangeDescription(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 O título do documento será atualizado automaticamente com o nome do novo arquivo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleUploadNewVersion}
                    disabled={!selectedFile || uploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Enviando..." : "Criar Nova Versão"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false)
                      setSelectedFile(null)
                      setChangeDescription("")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de versões */}
          <div>
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Histórico de Versões
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando versões...</p>
                </div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma versão anterior encontrada.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Este documento ainda não possui versões anteriores.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Versão</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={version.version_number === currentVersion ? "default" : "outline"}
                              className={version.version_number === currentVersion ? "bg-blue-600" : ""}
                            >
                              V{version.version_number}
                            </Badge>
                            {version.version_number === currentVersion && (
                              <span className="text-xs text-blue-600 font-medium">Atual</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(version.file_type, version.file_name, "h-4 w-4")}
                            <div>
                              <p className="font-medium text-sm">{version.file_name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(version.file_size)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{version.author?.full_name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {formatDistanceToNow(new Date(version.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {version.change_description || 'Sem descrição'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDownloadVersion(version)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {version.version_number !== currentVersion && (
                                <DropdownMenuItem
                                  onClick={() => handleRestoreVersion(version)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restaurar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}