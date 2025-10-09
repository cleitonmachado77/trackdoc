"use client"

import { useState, memo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import AccessGuard from "./components/access-guard"
import AuthGuard from "./components/auth-guard"
import AdminGuard from "./components/admin-guard"
import LandingRedirect from "./components/landing-redirect"
import { useAuth } from "@/lib/hooks/use-unified-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Building2,
  FileSpreadsheet,
  Presentation,
  File,
  Send,
  GitBranch,
  Tag,
  ChevronLeft,
  DollarSign,
  RefreshCw,
  User,
  XCircle,
  PenTool,
  Bell,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Calendar,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from "recharts"
import Sidebar from "./components/sidebar"
import DocumentModal from "./components/document-modal"
import DocumentPreviewModal from "./components/document-preview-modal"
import ApprovalModal from "./components/approval-modal"
import ApprovalReviewModal from "./components/approval-review-modal"
import ApprovalDetailsModal from "./components/approval-details-modal"
import AuditModal from "./components/audit-modal"
import FixedQuickSearchModal from "./components/fixed-quick-search-modal"
import UserManagement from "./components/admin/user-management"
import DocumentTypeManagement from "./components/admin/document-type-management"
import ProductivityReport from "./components/admin/productivity-report"
import ApprovalTimeReport from "./components/admin/approval-time-report"
import AuditReport from "./components/admin/audit-report"
import DepartmentManagement from "./components/admin/department-management"
import CategoryManagement from "./components/admin/category-management"
import BillingManagement from "./components/admin/billing-management"
import BillingStats from "./components/admin/billing-stats"
import NotificationManagement from "./components/admin/notification-management"
import UnifiedNotificationsPage from "./components/unified-notifications-page"
import HelpCenter from "./components/help-center"
import AIDocumentCreator from "./components/ai-document-creator"
import DocumentAccessReport from "./components/admin/document-access-report"
import DocumentCreationSelector from "./components/document-creation-selector"
import DocumentList from "./components/document-list"
import DocumentUploadWithApproval from "./components/document-upload-with-approval"
import EntityUserManagement from "./components/admin/entity-user-management"
import ElectronicSignature from "./components/electronic-signature"

import ChatPage from "./chat/page"
import MinhaContaPage from "./minha-conta/page"
import { useDocuments } from "@/hooks/use-documents"
import { useApprovals } from "@/hooks/use-approvals"
import { useDepartments } from "@/hooks/use-departments"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useCategories } from "@/hooks/use-categories"
import { useDocumentTypes } from "@/hooks/use-document-types"
import { useEntityStats } from "@/hooks/use-entity-stats"
import { useNotifications } from "@/hooks/use-notifications"
import { useElectronicSignatures } from "@/hooks/use-electronic-signatures"

// Funcao para obter icone do formato do arquivo
const getFileTypeIcon = (fileType: string) => {
  switch (fileType) {
    case "word":
      return { icon: FileText, color: "text-blue-600", accept: ".docx,.doc" }
    case "excel":
      return { icon: FileSpreadsheet, color: "text-green-600", accept: ".xlsx,.xls" }
    case "powerpoint":
      return { icon: Presentation, color: "text-orange-600", accept: ".pptx,.ppt" }
    case "pdf":
      return { icon: File, color: "text-red-600", accept: ".pdf" }
    default:
      return { icon: FileText, color: "text-gray-600", accept: ".txt" }
  }
}

// 🎨 Cores para cada departamento - Baseadas no novo design
const departmentColors = {
  TI: "hsl(var(--trackdoc-blue))",
  Vendas: "hsl(var(--trackdoc-blue-dark))",
  RH: "hsl(var(--trackdoc-gray))",
  Financeiro: "hsl(var(--trackdoc-blue-light))",
  Diretoria: "hsl(var(--trackdoc-black))",
}

// 🎨 Cores de status - Baseadas no novo design
const statusColors = {
  draft: "bg-trackdoc-gray-light text-trackdoc-gray",
  pending: "bg-warning/20 text-warning",
  pending_approval: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
  archived: "bg-trackdoc-gray-light text-trackdoc-gray",
}

const statusLabels = {
  draft: "Rascunho",
  pending: "Em Aprovacao",
  pending_approval: "Aguardando Aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
}

const DocumentManagementPlatform = memo(function DocumentManagementPlatform() {
  return (
    <>
      <LandingRedirect />
      <AuthGuard>
        <AccessGuard requireAuth={true} requireActiveSubscription={true}>
          <DocumentManagementPlatformContent />
        </AccessGuard>
      </AuthGuard>
    </>
  )
})

export default DocumentManagementPlatform

const DocumentManagementPlatformContent = memo(function DocumentManagementPlatformContent() {
  // Hooks para dados reais
  const { documents, loading: documentsLoading, error: documentsError, createDocument, updateDocument, deleteDocument, changeDocumentStatus, stats: documentStats } = useDocuments()
  const { myApprovals, sentApprovals, loading: approvalsLoading } = useApprovals()
  const { departments } = useDepartments()
  const { categories } = useCategories()
  const { documentTypes } = useDocumentTypes()
  const { stats: entityStats, loading: entityStatsLoading, refreshStats: refreshEntityStats } = useEntityStats()
  const { stats: notificationStats } = useNotifications()
  const { signatures, documents: signatureDocuments, loading: signatureLoading } = useElectronicSignatures()
  const searchParams = useSearchParams()
  
  // Processar parâmetro document da URL
  useEffect(() => {
    const documentId = searchParams.get('document')
    if (documentId && documents.length > 0) {
      console.log('📄 [URL_PARAM] Processando documento da URL:', documentId)
      const document = documents.find(doc => doc.id === documentId)
      if (document) {
        console.log('📄 [URL_PARAM] Documento encontrado, abrindo modal de auditoria')
        setSelectedDocument(document)
        setShowAuditModal(true)
        // Limpar o parâmetro da URL
        const url = new URL(window.location.href)
        url.searchParams.delete('document')
        window.history.replaceState({}, '', url.toString())
      } else {
        console.log('📄 [URL_PARAM] Documento não encontrado na lista')
      }
    }
  }, [searchParams, documents])
  
  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      callback: () => setShowQuickSearch(true),
      description: 'Ctrl+K - Abrir busca rápida'
    },
    {
      key: 'k',
      metaKey: true,
      callback: () => setShowQuickSearch(true),
      description: 'Cmd+K - Abrir busca rápida'
    }
  ])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sectorFilter, setSectorFilter] = useState("all")
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showApprovalReviewModal, setShowApprovalReviewModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedApproval, setSelectedApproval] = useState<any>(null)
  const [showApprovalDetailsModal, setShowApprovalDetailsModal] = useState(false)
  const [selectedApprovalForDetails, setSelectedApprovalForDetails] = useState<any>(null)
  const [adminView, setAdminView] = useState("overview")
  const [chartAreaFilter, setChartAreaFilter] = useState("all")
  const [chartTypeFilter, setChartTypeFilter] = useState("all")
  const [documentModalMode, setDocumentModalMode] = useState<"view" | "edit" | "new-version" | "create">("view")
  const [showCreationSelector, setShowCreationSelector] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Ler parâmetros de URL para definir a view inicial
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam && ['dashboard', 'documents', 'approvals', 'ai-create', 'notifications', 'admin', 'help', 'chat'].includes(viewParam)) {
      setActiveView(viewParam)
    }
    
    // Verificar se deve abrir o seletor de criação
    const showCreationSelectorParam = searchParams.get('showCreationSelector')
    if (showCreationSelectorParam === 'true') {
      setShowCreationSelector(true)
      // Remover o parâmetro da URL para evitar que apareça automaticamente ao recarregar
      const url = new URL(window.location.href)
      url.searchParams.delete('showCreationSelector')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // ✅ Verificar redirecionamento do localStorage após operações de departamento
  useEffect(() => {
    const redirectToDepartments = localStorage.getItem('redirectToDepartments')
    if (redirectToDepartments === 'true') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [DEBUG] Redirecionamento detectado, abrindo seção de departamentos...')
      }
      setActiveView('admin')
      setAdminView('departments')
      // ✅ Limpar o flag para evitar redirecionamentos futuros
      localStorage.removeItem('redirectToDepartments')
    }
  }, [])

  // Estados para o modal de documentos por categoria
  const [showDocumentListModal, setShowDocumentListModal] = useState(false)
  const [documentListFilter, setDocumentListFilter] = useState("all") // 'all', 'approved', 'pending', 'draft'
  const [documentListTitle, setDocumentListTitle] = useState("")

  // Dados reais calculados a partir das informações do sistema
  const monthlyEvolutionData: any[] = []

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.document_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.author?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    const matchesSector = sectorFilter === "all" || (doc.department?.name || '') === sectorFilter

    return matchesSearch && matchesStatus && matchesSector
  })

  const stats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === "approved").length,
    pending: documents.filter((d) => d.status === "pending").length,
    draft: documents.filter((d) => d.status === "draft").length,
  }

  // Funcao para filtrar documentos por categoria para o modal
  const getDocumentsByCategory = (category: string) => {
    switch (category) {
      case "approved":
        return documents.filter((d) => d.status === "approved")
      case "pending":
        return documents.filter((d) => d.status === "pending")
      case "draft":
        return documents.filter((d) => d.status === "draft")
      default:
        return documents
    }
  }

  // Funcao para abrir modal com documentos filtrados
  const handleCardClick = (category: string) => {
    setDocumentListFilter(category)
    setDocumentListTitle(
      category === "all"
        ? "Todos os Documentos"
        : category === "approved"
          ? "Documentos Aprovados"
          : category === "pending"
            ? "Documentos Pendentes"
            : category === "draft"
              ? "Documentos em Rascunho"
              : "",
    )
    setShowDocumentListModal(true)
  }

  const handleDocumentClick = (doc: any) => {
    setSelectedDocument(doc)
    setShowDocumentPreview(true)
  }

  const handleEditFromPreview = (): void => {
    setShowDocumentPreview(false)
    setDocumentModalMode("edit")
    setShowDocumentModal(true)
  }

  const handleViewAuditFromPreview = () => {
    setShowDocumentPreview(false)
    setShowAuditModal(true)
  }

  // Funcao para enviar documento para aprovacao
  const handleSendForApproval = (doc: any) => {
    // Esta função foi removida pois não é mais necessária
    // O sistema agora usa o hook useApprovals para gerenciar aprovações
    console.log('Função handleSendForApproval removida - use useApprovals hook')
  }

  // Funcao para criar nova versao
  const handleCreateNewVersion = (doc: any) => {
    setSelectedDocument(doc)
    setDocumentModalMode("new-version")
    setShowDocumentModal(true)
  }

  // Funcao para visualizar documento (somente leitura)
  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc)
    setDocumentModalMode("view")
    setShowDocumentModal(true)
  }

  // Funcao para editar documento
  const handleEditDocument = (doc: any) => {
    setSelectedDocument(doc)
    setDocumentModalMode("edit")
    setShowDocumentModal(true)
  }

  const handleDownloadFromPreview = (doc: any) => {
    if (doc) {
      const fileTypeInfo = getFileTypeIcon(doc.file_type || '')
      const fileExtension = fileTypeInfo.accept.split(",")[0].replace(".", "")
      const fileName = `${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}.${fileExtension}`
      const dummyContent = `Conteudo simulado para o documento: ${doc.title}`
      const blob = new Blob([dummyContent], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log("Download iniciado para:", fileName)
    }
  }

  // Funcao para renderizar as opcoes do dropdown baseado no status
  const renderDocumentActions = (doc: any) => {
    const actions = []

    switch (doc.status) {
      case "draft":
        // Rascunho: Editar, Enviar para Aprovacao, Auditoria, Download
        actions.push(
          <DropdownMenuItem
            key="edit"
            onClick={(e) => {
              e.stopPropagation()
              handleEditDocument(doc)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>,
        )
        actions.push(
          <DropdownMenuItem
            key="send-approval"
            onClick={(e) => {
              e.stopPropagation()
              handleSendForApproval(doc)
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar para Aprovacao
          </DropdownMenuItem>,
        )
        break

      case "approved":
        // Aprovado: Visualizar, Gerar Nova Versao, Auditoria, Download
        actions.push(
          <DropdownMenuItem
            key="view"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDocument(doc)
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>,
        )
        actions.push(
          <DropdownMenuItem
            key="new-version"
            onClick={(e) => {
              e.stopPropagation()
              handleCreateNewVersion(doc)
            }}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Gerar Nova Versao
          </DropdownMenuItem>,
        )
        break

      case "pending":
        // Em Aprovacao: Visualizar, Ver Aprovacao, Auditoria, Download
        actions.push(
          <DropdownMenuItem
            key="view"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDocument(doc)
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>,
        )
        actions.push(
          <DropdownMenuItem
            key="view-approval"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDocument(doc)
              setShowApprovalModal(true)
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Ver Aprovacao
          </DropdownMenuItem>,
        )
        break

      case "rejected":
        // Rejeitado: Visualizar, Gerar Nova Versao, Auditoria, Download
        actions.push(
          <DropdownMenuItem
            key="view"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDocument(doc)
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>,
        )
        actions.push(
          <DropdownMenuItem
            key="new-version"
            onClick={(e) => {
              e.stopPropagation()
              handleCreateNewVersion(doc)
            }}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Gerar Nova Versao
          </DropdownMenuItem>,
        )
        break

      default:
        // Fallback para visualizar
        actions.push(
          <DropdownMenuItem
            key="view"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDocument(doc)
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>,
        )
    }

    // Auditoria e Download sao sempre disponiveis
    actions.push(
      <DropdownMenuItem
        key="audit"
        onClick={(e) => {
          e.stopPropagation()
          setSelectedDocument(doc)
          setShowAuditModal(true)
        }}
      >
        <Clock className="h-4 w-4 mr-2" />
        Auditoria
      </DropdownMenuItem>,
    )
    actions.push(
      <DropdownMenuItem
        key="download"
        onClick={(e) => {
          e.stopPropagation()
          handleDownloadFromPreview(doc)
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </DropdownMenuItem>,
    )

    return actions
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboard()
      case "documents":
        return renderDocuments()
      case "approvals":
        return renderApprovals()
      case "ai-create":
        return <AIDocumentCreator />
      case "electronic-signature":
        return <ElectronicSignature />

      case "notifications":
        return <UnifiedNotificationsPage />
      case "chat":
        return <ChatPage />
      case "admin":
        return (
          <AdminGuard>
            {renderAdmin()}
          </AdminGuard>
        )
      case "help":
        return <HelpCenter />
      case "minha-conta":
        return <MinhaContaPage />
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => {
    // Dados calculados para o dashboard
    const totalDocuments = documentStats?.total || documents.length
    const approvedDocuments = documentStats?.approved || documents.filter(d => d.status === 'approved').length
    const pendingDocuments = documentStats?.pending || documents.filter(d => d.status === 'pending').length
    const draftDocuments = documentStats?.draft || documents.filter(d => d.status === 'draft').length
    const rejectionRate = totalDocuments > 0 ? ((documentStats?.rejected || 0) / totalDocuments * 100).toFixed(1) : '0.0'
    const approvalRate = totalDocuments > 0 ? (approvedDocuments / totalDocuments * 100).toFixed(1) : '0.0'
    
    // Estatísticas de assinaturas
    const totalSignatures = signatures.length
    const completedSignatures = signatures.filter(s => s.status === 'completed').length
    const pendingSignatures = signatures.filter(s => s.status === 'pending').length
    
    // Estatísticas de aprovações
    const totalApprovals = myApprovals?.length || 0
    const pendingApprovals = myApprovals?.filter(a => a.status === 'pending').length || 0
    const approvedByMe = myApprovals?.filter(a => a.status === 'approved').length || 0
    
    // Estatísticas de notificações
    const totalNotifications = notificationStats?.total_sent || 0
    const notificationOpenRate = notificationStats?.open_rate || 0
    
    // Dados para gráficos
    const documentsByStatus = [
      { name: 'Aprovados', value: approvedDocuments, color: 'hsl(var(--trackdoc-blue))' },
      { name: 'Pendentes', value: pendingDocuments, color: 'hsl(var(--trackdoc-blue-dark))' },
      { name: 'Rascunhos', value: draftDocuments, color: 'hsl(var(--trackdoc-gray))' },
      { name: 'Rejeitados', value: documentStats?.rejected || 0, color: 'hsl(var(--destructive))' }
    ]
    
    // Calcular produtividade semanal baseada em dados reais
    const productivityData = (() => {
      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Segunda-feira
      
      return days.map((day, index) => {
        const dayDate = new Date(startOfWeek)
        dayDate.setDate(startOfWeek.getDate() + index)
        const dayStart = new Date(dayDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayDate)
        dayEnd.setHours(23, 59, 59, 999)
        
        // Contar documentos criados neste dia
        const dayDocuments = documents.filter(doc => {
          const docDate = new Date(doc.created_at)
          return docDate >= dayStart && docDate <= dayEnd
        }).length
        
        // Contar aprovações neste dia (baseado em documentos aprovados)
        const dayApprovals = documents.filter(doc => {
          const docDate = new Date(doc.updated_at)
          return doc.status === 'approved' && docDate >= dayStart && docDate <= dayEnd
        }).length
        
        // Contar assinaturas neste dia (baseado em assinaturas completadas)
        const daySignatures = signatures.filter(sig => {
          const sigDate = new Date(sig.updated_at)
          return sig.status === 'completed' && sigDate >= dayStart && sigDate <= dayEnd
        }).length
        
        return {
          name: day,
          documents: dayDocuments,
          approvals: dayApprovals,
          signatures: daySignatures
        }
      })
    })()

    const departmentData = entityStats?.documents_by_category?.map(cat => ({
      name: cat.category,
      documents: cat.count,
      color: cat.color || '#3b82f6'
    })) || []

    return (
      <div className="space-y-6">
        {/* Header com Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-trackdoc-black">Dashboard Executivo</h1>
            <p className="text-trackdoc-gray mt-1">Visão geral completa do sistema TrackDoc</p>
          </div>
          <Button 
            onClick={refreshEntityStats} 
            variant="outline" 
            size="sm"
            disabled={entityStatsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${entityStatsLoading ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{totalDocuments}</div>
                  <div className="text-sm text-gray-500 font-medium">Total de Documentos</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-50">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">+{approvalRate}%</span>
                  </div>
                  <span className="text-xs text-gray-500">aprovados</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-50 group-hover:bg-amber-100 transition-colors duration-300">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{pendingApprovals}</div>
                  <div className="text-sm text-gray-500 font-medium">Aprovações Pendentes</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50">
                    <Target className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700">{totalApprovals}</span>
                  </div>
                  <span className="text-xs text-gray-500">total</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors duration-300">
                  <PenTool className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{completedSignatures}</div>
                  <div className="text-sm text-gray-500 font-medium">Assinaturas Digitais</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50">
                    <Timer className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700">{pendingSignatures}</span>
                  </div>
                  <span className="text-xs text-gray-500">pendentes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors duration-300">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{rejectionRate}%</div>
                  <div className="text-sm text-gray-500 font-medium">Taxa de Rejeição</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${parseFloat(rejectionRate) > 10 ? 'bg-red-50' : 'bg-green-50'}`}>
                    {parseFloat(rejectionRate) > 10 ? (
                      <ArrowUpRight className="h-3 w-3 text-red-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-green-600" />
                    )}
                    <span className={`text-xs font-semibold ${parseFloat(rejectionRate) > 10 ? 'text-red-700' : 'text-green-700'}`}>
                      {parseFloat(rejectionRate) > 10 ? "Alto" : "Baixo"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtividade Semanal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-trackdoc-blue" />
                Produtividade Semanal
              </CardTitle>
              <CardDescription>Atividade dos últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--trackdoc-gray-light))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--trackdoc-gray))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--trackdoc-gray))" }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px hsla(var(--trackdoc-blue) / 0.1)"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="documents" fill="hsl(var(--trackdoc-blue))" name="Documentos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approvals" fill="hsl(var(--success))" name="Aprovações" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="signatures" fill="hsl(var(--trackdoc-blue-dark))" name="Assinaturas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status dos Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-trackdoc-blue" />
                Status dos Documentos
              </CardTitle>
              <CardDescription>Distribuição atual por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={documentsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {documentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Avançadas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Atividade Recente
              </CardTitle>
              <CardDescription>Últimas ações no sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {entityStats?.recent_activity?.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.user_name} • {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-600" />
                Documentos por Categoria
              </CardTitle>
              <CardDescription>Distribuição por categorias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {departmentData.slice(0, 5).map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100">
                    {category.documents}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma categoria encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo de Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Resumo de Performance
              </CardTitle>
              <CardDescription>Métricas de eficiência</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Taxa de Aprovação</span>
                </div>
                <span className="text-lg font-bold text-green-600">{approvalRate}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Usuários Ativos</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{entityStats?.active_users || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Taxa de Abertura</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{notificationOpenRate.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                <div className="flex items-center space-x-3">
                  <Timer className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-900">Tempo Médio</span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {(() => {
                    // Calcular tempo médio baseado em dados reais
                    if (documents.length === 0) return '0h'
                    
                    const now = new Date()
                    const totalTime = documents.reduce((sum, doc) => {
                      const created = new Date(doc.created_at)
                      const updated = new Date(doc.updated_at)
                      const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60)
                      return sum + Math.max(0, diffHours)
                    }, 0)
                    
                    const avgHours = totalTime / documents.length
                    return avgHours < 1 ? `${Math.round(avgHours * 60)}min` : `${avgHours.toFixed(1)}h`
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>Atalhos para tarefas comuns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => setShowCreationSelector(true)}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                variant="outline"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Novo Documento</span>
              </Button>
              
              <Button 
                onClick={() => setActiveView('electronic-signature')}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                variant="outline"
              >
                <PenTool className="h-6 w-6" />
                <span className="text-sm font-medium">Assinar Documento</span>
              </Button>
              
              <Button 
                onClick={() => setActiveView('approvals')}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                variant="outline"
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm font-medium">Revisar Aprovações</span>
              </Button>
              
              <Button 
                onClick={() => setActiveView('notifications')}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                variant="outline"
              >
                <Bell className="h-6 w-6" />
                <span className="text-sm font-medium">Ver Notificações</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDocuments = () => (
    <div className="space-y-6">
      <DocumentList />
    </div>
  )

  const renderApprovals = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprovações</h1>
          <p className="text-gray-600">
            Gerencie documentos pendentes de aprovação e acompanhe o status das solicitações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas de Aprovação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aprovações</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myApprovals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Documentos para aprovar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myApprovals?.filter(a => a.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando sua ação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {myApprovals?.filter(a => a.status === 'approved').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Documentos aprovados por você
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {myApprovals?.filter(a => a.status === 'rejected').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Documentos rejeitados por você
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documentos Pendentes de Aprovação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Documentos Pendentes de Aprovação
          </CardTitle>
          <CardDescription>
            Documentos que aguardam sua aprovação ou rejeição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvalsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando aprovações...</span>
            </div>
          ) : myApprovals && myApprovals.length > 0 ? (
            <div className="space-y-4">
              {myApprovals
                .filter(approval => approval.status === 'pending')
                .map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium">{approval.document_title || 'Documento sem título'}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Autor: {approval.document_author_name || 'N/A'} • 
                        Criado em: {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {approval.comments && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Comentários:</strong> {approval.comments}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval)
                          setShowApprovalReviewModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Revisar
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento pendente de aprovação.</p>
              <p className="text-sm mt-2">Você está em dia com suas aprovações!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Aprovações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Histórico de Aprovações
          </CardTitle>
          <CardDescription>
            Acompanhe documentos que você enviou para aprovação e decisões que você tomou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Documentos Enviados para Aprovação */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Documentos que você enviou para aprovação
              </h4>
              {sentApprovals && sentApprovals.length > 0 ? (
                <div className="space-y-3">
                  {sentApprovals.map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <h5 className="font-medium">{approval.document_title || 'Documento sem título'}</h5>
                        <p className="text-sm text-gray-500">
                          Status: {(approval.status as string) === 'pending_approval' ? 'Aguardando Aprovação' : 
                                   (approval.status as string) === 'approved' ? 'Aprovado' : 
                                   (approval.status as string) === 'rejected' ? 'Rejeitado' : approval.status}
                        </p>
                        <p className="text-sm text-gray-500">
                          Enviado em: {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={approval.status === 'approved' ? 'default' : 
                                   approval.status === 'rejected' ? 'destructive' : 'secondary'}
                          className={approval.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                   approval.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                   'bg-yellow-100 text-yellow-800'}
                        >
                          {approval.status === 'approved' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprovado
                            </>
                          ) : approval.status === 'rejected' ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeitado
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </>
                          )}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApprovalForDetails(approval)
                            setShowApprovalDetailsModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>Nenhum documento enviado para aprovação.</p>
                </div>
              )}
            </div>

            {/* Decisões de Aprovação que você tomou */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Decisões de aprovação que você tomou
              </h4>
              {myApprovals && myApprovals.filter(a => a.status !== 'pending').length > 0 ? (
                <div className="space-y-3">
                  {myApprovals
                    .filter(approval => approval.status !== 'pending')
                    .map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <h5 className="font-medium">{approval.document_title || 'Documento sem título'}</h5>
                          <p className="text-sm text-gray-500">
                            {(approval.status as string) === 'approved' ? 'Aprovado' : 'Rejeitado'} em{' '}
                            {approval.approved_at ? new Date(approval.approved_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Autor: {approval.document_author_name || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={(approval.status as string) === 'approved' ? 'default' : 'destructive'}
                            className={(approval.status as string) === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {(approval.status as string) === 'approved' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovado
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejeitado
                              </>
                            )}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApprovalForDetails(approval)
                              setShowApprovalDetailsModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma decisão de aprovação tomada.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAdmin = () => {
    return (
      <div className="space-y-6">
        {adminView !== "overview" && (
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => setAdminView("overview")}
              className="text-blue-600 hover:text-blue-700"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar para Visao Geral da Administracao
            </Button>
          </div>
        )}
        {(() => {
          // Wrap the switch in an IIFE to allow it to be a direct child of the div
          switch (adminView) {
            case "users":
              return <EntityUserManagement />
            case "document-types":
              return <DocumentTypeManagement 
                initialDocumentTypes={documentTypes as any || []} 
                totalDocuments={documents.length}
              />
            case "productivity-report":
              return <ProductivityReport />
            case "approval-time-report":
              return <ApprovalTimeReport />
            case "audit-report":
              return <AuditReport />
            case "document-access-report":
              return <DocumentAccessReport />
            case "departments":
              return <DepartmentManagement />
            case "categories":
              return <CategoryManagement />
            case "entity-users":
              return <EntityUserManagement />
            case "billing":
              return (
                <div className="space-y-6">
                  <BillingStats />
                  <BillingManagement />
                </div>
              )
            default:
              return renderAdminOverview()
          }
        })()}
      </div>
    )
  }

  const renderAdminOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuracoes do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("entity-users")}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Usuarios da Entidade
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("document-types")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Tipos de Documento
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("departments")}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Gerenciar Departamentos
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("categories")}
          >
            <Tag className="h-4 w-4 mr-2" />
            Gerenciar Categorias
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("billing")}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Planos e Pagamentos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relatorios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("productivity-report")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatorio de Produtividade
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("approval-time-report")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Tempo de Aprovacao
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("document-access-report")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Documentos Mais Acessados
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setAdminView("audit-report")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Auditoria Completa
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Nova funcao para lidar com a mudanca de visao, incluindo o reset do adminView
  const handleViewChange = (view: string) => {
    setActiveView(view)
    if (view === "admin") {
      setAdminView("overview") // Reseta para a visao geral da administracao
    }
  }

  const handleCreationOptionSelect = (option: "upload") => {
    // Abrir modal de upload diretamente
    setShowUploadModal(true)
  }

  return (
    <div className="flex h-screen bg-trackdoc-blue-light/30">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} pendingApprovalsCount={stats.pending} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/95 backdrop-blur-sm border-b border-trackdoc-blue-light px-6 py-4 shadow-trackdoc">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-trackdoc-black">
                  {activeView === "dashboard" && "Dashboard"}
                  {activeView === "documents" && "Documentos"}
                  {activeView === "approvals" && "Aprovacoes"}
          
                                  {activeView === "ai-create" && "Criar com IA"}
                {activeView === "electronic-signature" && "Assinatura Eletrônica"}

                {activeView === "notifications" && "Notificacoes"}
                {activeView === "chat" && "Chat"}
                  {activeView === "admin" && "Administracao"}
                  {activeView === "help" && "Central de Ajuda"}
                  {activeView === "minha-conta" && "Minha Conta"}
                </h1>
                {activeView === "admin" && adminView !== "overview" && (
                  <>
                    <span className="text-gray-400">/</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdminView("overview")}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {adminView === "users" && "Gerenciar Usuarios"}
                      {adminView === "document-types" && "Tipos de Documento"}
                      {adminView === "productivity-report" && "Relatorio de Produtividade"}
                      {adminView === "approval-time-report" && "Tempo de Aprovacao"}
                      {adminView === "audit-report" && "Auditoria Completa"}
                      {adminView === "document-access-report" && "Documentos Mais Acessados"}
                      {adminView === "departments" && "Gerenciar Departamentos"}
                      {adminView === "categories" && "Gerenciar Categorias"}
                      {adminView === "billing" && "Planos e Pagamentos"}
                    </Button>
                  </>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1">
                {activeView === "dashboard" && "Visao geral do sistema"}
                {activeView === "documents" && "Gerencie todos os documentos"}
                {activeView === "approvals" && "Documentos pendentes de aprovacao"}
                
                {activeView === "ai-create" && "Gere documentos profissionais usando inteligencia artificial"}
                {activeView === "electronic-signature" && "Assine documentos eletronicamente usando o ArqSign"}
                {activeView === "notifications" && "Gerencie notificacoes e comunicacoes"}
                {activeView === "chat" && "Comunique-se com outros usuários da entidade"}
                {/* ... existing admin descriptions ... */}
                {activeView === "help" && "Encontre respostas, tutoriais e suporte tecnico"}
                {activeView === "minha-conta" && "Gerencie suas informações pessoais e configurações da conta"}
              </p>
            </div>
            <Button
              onClick={() => {
                setShowCreationSelector(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Documento
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">{renderContent()}</main>
      </div>

      {/* Modal de Lista de Documentos por Categoria */}
      <Dialog open={showDocumentListModal} onOpenChange={setShowDocumentListModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">{documentListTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {getDocumentsByCategory(documentListFilter).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento encontrado nesta categoria.</p>
              </div>
            ) : (
              getDocumentsByCategory(documentListFilter).map((doc) => {
                const fileTypeInfo = getFileTypeIcon(doc.file_type || '')
                const FileIcon = fileTypeInfo.icon

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setShowDocumentListModal(false)
                      handleDocumentClick(doc)
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <FileIcon className={`h-5 w-5 ${fileTypeInfo.color}`} />
                        <div>
                          <h3 className="font-medium hover:text-trackdoc-blue transition-colors">{doc.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{doc.document_number || ''}</span>
                            <span>v{doc.version}</span>
                            <span>{doc.author?.full_name || ''}</span>
                            <span>{doc.department?.name || ''}</span>
                            {doc.file_name && <span>{doc.file_name}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={statusColors[doc.status]}>{statusLabels[doc.status]}</Badge>
                      {doc.status === "pending_approval" && (
                        <div className="text-sm text-gray-500">
                          Aguardando aprovação
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">{renderDocumentActions(doc)}</DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <DocumentModal
        open={showDocumentModal}
        onOpenChange={setShowDocumentModal}
        document={documentModalMode === "create" ? null : selectedDocument}
        mode={documentModalMode}
        onSave={(doc) => {
          if (documentModalMode === "create") {
            // setDocuments removido - use createDocument do hook useDocuments
            console.log('Documento criado via hook useDocuments')
          } else if (documentModalMode === "new-version") {
            // Criar nova versao do documento
            const currentVersion = Number.parseFloat(selectedDocument?.version || '1')
            const newVersion = (Math.floor(currentVersion) + 1).toFixed(1)
            const newDoc = {
              ...doc,
              id: Date.now(),
              version: newVersion,
              status: "draft",
              createdAt: new Date().toISOString().split("T")[0],
              updatedAt: new Date().toISOString().split("T")[0],
            }
                          // setDocuments removido - use createDocument do hook useDocuments
              console.log('Nova versão criada via hook useDocuments')
          } else {
                          // setDocuments removido - use updateDocument do hook useDocuments
              console.log('Documento atualizado via hook useDocuments')
          }
          setShowDocumentModal(false)
          setSelectedDocument(null)
          setDocumentModalMode("view")
        }}
      />

      <DocumentPreviewModal
        open={showDocumentPreview}
        onOpenChange={setShowDocumentPreview}
        document={selectedDocument}
        onEdit={handleEditFromPreview}
        onDownload={() => handleDownloadFromPreview(selectedDocument)} // Use a nova funcao aqui
        onViewAudit={handleViewAuditFromPreview}
      />

      <ApprovalModal
        open={showApprovalModal}
        onOpenChange={setShowApprovalModal}
        document={selectedDocument}
        onApprove={(decision) => {
          if (selectedDocument) {
            // setDocuments removido - use changeDocumentStatus do hook useDocuments
            console.log('Status do documento alterado via hook useDocuments')
          }
          setShowApprovalModal(false)
          setSelectedDocument(null)
        }}
      />

                     <ApprovalReviewModal
          open={showApprovalReviewModal}
          onOpenChange={setShowApprovalReviewModal}
          approval={selectedApproval}
          onSuccess={() => {
            setShowApprovalReviewModal(false)
            setSelectedApproval(null)
          }}
        />
        
        <ApprovalDetailsModal
          open={showApprovalDetailsModal}
          onOpenChange={setShowApprovalDetailsModal}
          approval={selectedApprovalForDetails}
        />

      <AuditModal open={showAuditModal} onOpenChange={setShowAuditModal} document={selectedDocument} />

      {/* Fixed Quick Search Modal */}
      <FixedQuickSearchModal
        open={showQuickSearch}
        onOpenChange={setShowQuickSearch}
        onDocumentSelect={(documentId) => {
          console.log('📄 [DOCUMENT_SELECT] ID recebido:', documentId)
          console.log('📄 [DOCUMENT_SELECT] Total de documentos:', documents.length)
          
          // Buscar o documento pelo ID e abrir o modal de auditoria
          const document = documents.find(doc => doc.id === documentId)
          console.log('📄 [DOCUMENT_SELECT] Documento encontrado:', document)
          
          if (document) {
            console.log('📄 [DOCUMENT_SELECT] Abrindo modal de auditoria')
            setSelectedDocument(document)
            setShowAuditModal(true)
          } else {
            console.log('📄 [DOCUMENT_SELECT] Documento não encontrado na lista')
          }
        }}
      />

      <DocumentCreationSelector
        open={showCreationSelector}
        onOpenChange={setShowCreationSelector}
        onSelectOption={handleCreationOptionSelect}
      />

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Upload de Documento</DialogTitle>
            <DialogDescription>
              Faca upload de um novo documento para o sistema
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 max-h-[calc(90vh-120px)]">
            <DocumentUploadWithApproval onSuccess={() => setShowUploadModal(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
