"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FileText,
  User,
  Plus,
  RefreshCw,
  AlertCircle,
  XCircle,
  CheckCircle,
  Clock,
  FolderOpen,
  Building2,
  MoreHorizontal,
  Grid3X3,
  List,
  History,
} from "lucide-react"
// Importações removidas - não precisamos mais de Tabs nem Alert
import { useDocuments, type Document, type DocumentFilters } from "@/hooks/use-documents"
import { useCategories } from "@/hooks/use-categories"
import { useDepartments } from "@/hooks/use-departments"
import { useDocumentTypes } from "@/hooks/use-document-types"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { toast } from "@/hooks/use-toast"
import DocumentUploadWithApproval from "./document-upload-with-approval"
import { AnimatedDocumentRow } from "./animated-document-row"
import { DocumentViewer } from "./document-viewer"
import { DocumentVersionManager } from "./document-version-manager"
import { DocumentVersionBadge } from "./document-version-badge"
import { getFileIconWithBackground } from "@/lib/utils/file-icons"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Função para formatar tamanho de arquivo
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}


export default function DocumentList() {
  const { user } = useAuth()
  const router = useRouter()
  const [filters, setFilters] = useState<DocumentFilters>({})
  const [searchTerm, setSearchTerm] = useState("")
  
  // Memoizar os filtros para evitar re-renders desnecessários
  const memoizedFilters = useMemo(() => filters, [
    filters.search,
    filters.status,
    filters.category_id,
    filters.document_type_id,
    filters.department_id,
    filters.author_id,
    filters.is_public,
    filters.date_from,
    filters.date_to
  ])
  
  const { documents, loading, error, deleteDocument, downloadDocument, refetch } = useDocuments(memoizedFilters)
  const { categories } = useCategories()
  const { departments } = useDepartments()
  const { documentTypes } = useDocumentTypes()
  const [showUpload, setShowUpload] = useState(false)

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [approvalStatuses, setApprovalStatuses] = useState<Record<string, any[]>>({})
  const [approvalStatusesLoading, setApprovalStatusesLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showVersionManager, setShowVersionManager] = useState(false)
  const [selectedDocumentForVersions, setSelectedDocumentForVersions] = useState<Document | null>(null)

  // Carregar preferência de visualização do localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('documents-view-mode') as 'grid' | 'list'
    if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
      setViewMode(savedViewMode)
    }
  }, [])

  // Função para alterar modo de visualização e salvar no localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('documents-view-mode', mode)
  }
  
  // Estados removidos - documentos de processos não são mais exibidos nesta página
  // Documentos anexados em processos são exibidos apenas dentro do respectivo processo
  // Se o processo for apagado, os documentos também são removidos automaticamente

  // Função removida - documentos de processos não são mais exibidos nesta página

  // Função para atualizar documentos com notificação
  const handleRefresh = async () => {
    try {
      await refetch()
      toast({
        title: "Documentos atualizados",
        description: "A lista de documentos foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao atualizar documentos:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a lista de documentos.",
        variant: "destructive",
      })
    }
  }

  // Debounce para o campo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchTerm || undefined
      }))
    }, 500) // Aguarda 500ms após o usuário parar de digitar

    return () => clearTimeout(timer)
  }, [searchTerm])

  // useEffect removido - não há mais abas de documentos de processos

  // Buscar status de aprovação para todos os documentos
  useEffect(() => {
    const fetchApprovalStatuses = async () => {
      if (documents.length === 0) return
      
      setApprovalStatusesLoading(true)
      const statuses: Record<string, any[]> = {}
      
      try {
        // Buscar todos os status de aprovação em uma única consulta
        const { data: allWorkflows, error } = await supabase
          .from('approval_requests')
          .select('*')
          .in('document_id', documents.map(d => d.id))
          .order('step_order', { ascending: true })

        if (error) throw error

        // Organizar por documento
        if (allWorkflows) {
          allWorkflows.forEach(workflow => {
            if (!statuses[workflow.document_id]) {
              statuses[workflow.document_id] = []
            }
            statuses[workflow.document_id].push(workflow)
          })
        }

        setApprovalStatuses(statuses)
      } catch (error) {
        console.warn('Erro ao buscar status de aprovação:', error)
        // Em caso de erro, definir status vazio para todos os documentos
        documents.forEach(doc => {
          statuses[doc.id] = []
        })
        setApprovalStatuses(statuses)
      } finally {
        setApprovalStatusesLoading(false)
      }
    }

    fetchApprovalStatuses()
  }, [documents])

  const handleFilterChange = useCallback((key: keyof DocumentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined
    }))
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])



  const handleDelete = async (documentId: string) => {
    if (confirm('Tem certeza que deseja deletar este documento?')) {
      try {
        await deleteDocument(documentId)
      } catch (error) {
        console.error('Erro ao deletar documento:', error)
      }
    }
  }

  const handleDownload = async (document: Document) => {
    if (document.file_path && document.file_name) {
      try {
        await downloadDocument(document)
      } catch (error) {
        console.error('Erro ao baixar documento:', error)
      }
    }
  }

  // Função removida - não precisamos mais separar documentos de processos
  // Todos os documentos exibidos são documentos armazenados (não de processos)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao carregar documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Função para renderizar o status de aprovação
  const renderApprovalStatus = (documentId: string) => {
    if (approvalStatusesLoading) {
      return (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      )
    }

    const approvalStatus = approvalStatuses[documentId] || []
    
    if (approvalStatus.length === 0) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Sem aprovação</span>
        </div>
      )
    }

    const pendingCount = approvalStatus.filter(w => w.status === 'pending').length
    const approvedCount = approvalStatus.filter(w => w.status === 'approved').length
    const rejectedCount = approvalStatus.filter(w => w.status === 'rejected').length
    const totalCount = approvalStatus.length

    if (rejectedCount > 0) {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">Rejeitado</span>
        </div>
      )
    }

    if (approvedCount === totalCount) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">Aprovado</span>
        </div>
      )
    }

    if (pendingCount > 0) {
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-600">
            {approvedCount}/{totalCount} aprovado(s)
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Pendente</span>
      </div>
    )
  }

  // Função para renderizar os documentos em formato de lista
  const renderDocumentsList = (documentsList: Document[], title: string, icon: React.ReactNode, emptyMessage: string) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-trackdoc-black flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <p className="text-trackdoc-gray mt-1">
            {documentsList.length} documento(s) encontrado(s)
          </p>
        </div>
      </div>

      {/* Lista em Tabela */}
      {documentsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">{emptyMessage}</h3>
            <p className="text-muted-foreground mb-4">Comece criando seu primeiro documento</p>
            {title === "Documentos Armazenados" && (
              <Button variant="default" onClick={() => router.push('/?showCreationSelector=true')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro documento
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <div className="p-4">
            <div className="space-y-2">
              {documentsList.map((document) => (
                <AnimatedDocumentRow key={document.id}>
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => {
                         setSelectedDocument(document)
                         setShowViewer(true)
                       }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">
                          {getFileIconWithBackground(
                            document.file_type || '',
                            document.file_name || '',
                            "h-4 w-4",
                            "p-2"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{document.title}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDocumentForVersions(document)
                          setShowVersionManager(true)
                        }}>
                          <DocumentVersionBadge
                            documentId={document.id}
                            currentVersion={document.version || 1}
                            showTooltip={false}
                          />
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDocument(document)
                                setShowViewer(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadDocument(document)
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDocumentForVersions(document)
                                setShowVersionManager(true)
                              }}
                            >
                              <History className="h-4 w-4 mr-2" />
                              Versões
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Tem certeza que deseja excluir este documento?')) {
                                  deleteDocument(document.id)
                                }
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </AnimatedDocumentRow>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )

  // Função para renderizar os documentos em cards quadrados
  const renderDocumentsGrid = (documentsList: Document[], title: string, icon: React.ReactNode, emptyMessage: string) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-trackdoc-black flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <p className="text-trackdoc-gray mt-1">
            {documentsList.length} documento(s) encontrado(s)
          </p>
        </div>
      </div>

      {/* Grid de Cards */}
      {documentsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">{emptyMessage}</h3>
            <p className="text-muted-foreground mb-4">Comece criando seu primeiro documento</p>
            {title === "Documentos Armazenados" && (
              <Button variant="default" onClick={() => router.push('/?showCreationSelector=true')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro documento
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documentsList.map((document) => (
            <AnimatedDocumentRow key={document.id}>
              <Card className="h-96 hover:shadow-trackdoc-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIconWithBackground(
                        document.file_type || '',
                        document.file_name || '',
                        "h-6 w-6",
                        "p-2"
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <CardTitle className="text-sm font-medium text-trackdoc-black group-hover:text-trackdoc-blue transition-colors overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {document.title}
                          </CardTitle>
                          <DocumentVersionBadge
                            documentId={document.id}
                            currentVersion={document.version || 1}
                            onClick={() => {
                              setSelectedDocumentForVersions(document)
                              setShowVersionManager(true)
                            }}
                            showTooltip={false}
                          />
                        </div>
                        <p className="text-xs text-trackdoc-gray mt-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {document.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDocument(document)
                            setShowViewer(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => downloadDocument(document)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDocumentForVersions(document)
                            setShowVersionManager(true)
                          }}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Versões
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este documento?')) {
                              deleteDocument(document.id)
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Badge de Tipo */}
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ backgroundColor: `${document.document_type?.color || '#6B7280'}20`, borderColor: document.document_type?.color || '#6B7280' }}
                    >
                      {document.document_type?.name || 'N/A'}
                    </Badge>
                  </div>

                  {/* Autor */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{document.author?.full_name || 'N/A'}</span>
                  </div>

                  {/* Status de Aprovação */}
                  <div className="pt-2 border-t">
                    {renderApprovalStatus(document.id)}
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(document)
                          setShowViewer(true)
                        }}
                        className="flex-1 h-8 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(document)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este documento?')) {
                            deleteDocument(document.id)
                          }
                        }}
                        className="flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedDocumentRow>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-trackdoc-black">Documentos</h2>
          <p className="text-trackdoc-gray">Gerencie todos os documentos do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle de Visualização */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={filters.category_id || 'all'} onValueChange={(value) => handleFilterChange('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Documento</label>
              <Select value={filters.document_type_id || 'all'} onValueChange={(value) => handleFilterChange('document_type_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <Select value={filters.department_id || 'all'} onValueChange={(value) => handleFilterChange('department_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos Armazenados */}
      {viewMode === 'grid' 
        ? renderDocumentsGrid(
            documents,
            "Documentos Armazenados",
            <FolderOpen className="h-5 w-5 text-success" />,
            "Nenhum documento armazenado encontrado"
          )
        : renderDocumentsList(
            documents,
            "Documentos Armazenados",
            <FolderOpen className="h-5 w-5 text-success" />,
            "Nenhum documento armazenado encontrado"
          )
      }



      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
            <DialogDescription>
              Faça upload de um novo documento para o sistema
            </DialogDescription>
          </DialogHeader>
          <DocumentUploadWithApproval onSuccess={() => {
            setShowUpload(false)
            handleRefresh() // Recarregar a lista de documentos após upload
          }} />
                 </DialogContent>
       </Dialog>

       {/* Document Viewer */}
       {showViewer && selectedDocument && (
         <DocumentViewer
           document={selectedDocument}
           onClose={() => {
             setShowViewer(false)
             setSelectedDocument(null)
           }}
         />
       )}

       {/* Document Version Manager */}
       {selectedDocumentForVersions && (
         <DocumentVersionManager
           documentId={selectedDocumentForVersions.id}
           documentTitle={selectedDocumentForVersions.title}
           currentVersion={selectedDocumentForVersions.version || 1}
           isOpen={showVersionManager}
           onClose={() => {
             setShowVersionManager(false)
             setSelectedDocumentForVersions(null)
           }}
           onVersionUpdated={() => {
             refetch() // Atualizar a lista de documentos quando uma versão for criada/restaurada
           }}
         />
       )}

       
     </div>
   )
 }
