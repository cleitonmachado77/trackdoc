"use client"

import { useState, memo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import AccessGuard from "./components/access-guard"
import AuthGuard from "./components/auth-guard"
import AdminGuard from "./components/admin-guard"
import LandingRedirect from "./components/landing-redirect"
import { useAuth } from '@/lib/hooks/use-auth-final'
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
  Settings,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import EntityManagement from "./components/admin/entity-management"
import ElectronicSignature from "./components/electronic-signature"

import ChatPage from "./chat/page"
import MinhaContaPage from "./minha-conta/page"
import { useDocuments } from "@/hooks/use-documents"
import { useApprovals } from "@/hooks/use-approvals"
import DebugApprovalSystem from "./components/debug-approval-system"
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

  // Estados
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
  const [showDocumentListModal, setShowDocumentListModal] = useState(false)
  const [documentListFilter, setDocumentListFilter] = useState("all")
  const [documentListTitle, setDocumentListTitle] = useState("")

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

  // Ler parâmetros de URL para definir a view inicial
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam && ['dashboard', 'documents', 'approvals', 'ai-create', 'notifications', 'admin', 'help', 'chat', 'debug-approvals'].includes(viewParam)) {
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

  // Dados reais calculados a partir das informações do sistema
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
    pending: documents.filter((d) => d.status === "pending_approval").length,
    draft: documents.filter((d) => d.status === "draft").length,
  }

  // Funcao para filtrar documentos por categoria para o modal
  const getDocumentsByCategory = (category: string) => {
    switch (category) {
      case "approved":
        return documents.filter((d) => d.status === "approved")
      case "pending":
        return documents.filter((d) => d.status === "pending_approval")
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

  const renderDashboard = () => {
    // Dados calculados para o dashboard com fallbacks mais robustos
    const totalDocuments = entityStats?.total_documents || documentStats?.total || documents.length
    const approvedDocuments = entityStats?.approved_documents || stats.approved
    const pendingDocuments = entityStats?.pending_documents || stats.pending
    const draftDocuments = entityStats?.draft_documents || stats.draft
    const rejectedDocuments = documents.filter(d => d.status === 'rejected').length

    const rejectionRate = totalDocuments > 0 ? (rejectedDocuments / totalDocuments * 100).toFixed(1) : '0.0'
    const approvalRate = totalDocuments > 0 ? (approvedDocuments / totalDocuments * 100).toFixed(1) : '0.0'

    // Estatísticas de assinaturas
    const totalSignatures = signatures.length
    const completedSignatures = signatures.filter(s => s.status === 'completed').length
    const pendingSignatures = signatures.filter(s => s.status === 'pending').length

    // Estatísticas de aprovações
    const totalApprovals = myApprovals?.length || 0
    const pendingApprovalsCount = myApprovals?.filter(a => a.status === 'pending').length || 0
    const approvedByMe = myApprovals?.filter(a => a.status === 'approved').length || 0
    const rejectedByMe = myApprovals?.filter(a => a.status === 'rejected').length || 0

    // Estatísticas de usuários
    const totalUsers = entityStats?.total_users || 0
    const activeUsers = entityStats?.active_users || 0

    // Estatísticas de notificações
    const totalNotifications = notificationStats?.total_sent || 0
    const notificationOpenRate = notificationStats?.open_rate || 0
    const unreadNotificationsCount = 0 // Placeholder

    // Dados para gráficos com cores melhoradas
    const documentsByStatus = [
      { name: 'Aprovados', value: approvedDocuments, color: '#10B981', fill: '#10B981' },
      { name: 'Pendentes', value: pendingDocuments, color: '#F59E0B', fill: '#F59E0B' },
      { name: 'Rascunhos', value: draftDocuments, color: '#6B7280', fill: '#6B7280' },
      { name: 'Rejeitados', value: rejectedDocuments, color: '#EF4444', fill: '#EF4444' }
    ].filter(item => item.value > 0) // Filtrar itens com valor 0

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
          const docDate = new Date(doc.updated_at || doc.created_at)
          return doc.status === 'approved' && docDate >= dayStart && docDate <= dayEnd
        }).length

        // Contar assinaturas neste dia (baseado em assinaturas completadas)
        const daySignatures = signatures.filter(sig => {
          const sigDate = new Date(sig.updated_at || sig.created_at)
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

    // Dados por categoria/departamento com fallback
    const departmentData = entityStats?.documents_by_category?.map(cat => ({
      name: cat.category,
      documents: cat.count,
      color: cat.color || '#3b82f6'
    })) || []

    // Dados por tipo de documento
    const documentTypeData = entityStats?.documents_by_type?.map(type => ({
      name: type.type,
      documents: type.count,
      color: type.color || '#8B5CF6'
    })) || []

    // Atividade recente
    const recentActivity = entityStats?.recent_activity || []

    // Calcular tendências (comparação com período anterior)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous * 100)
    }

    // Simular dados do período anterior (em um cenário real, isso viria do backend)
    const previousPeriodDocuments = Math.max(0, totalDocuments - Math.floor(Math.random() * 10))
    const previousPeriodApprovals = Math.max(0, totalApprovals - Math.floor(Math.random() * 5))
    const previousPeriodSignatures = Math.max(0, totalSignatures - Math.floor(Math.random() * 3))

    const documentsTrend = calculateTrend(totalDocuments, previousPeriodDocuments)
    const approvalsTrend = calculateTrend(totalApprovals, previousPeriodApprovals)
    const signaturesTrend = calculateTrend(totalSignatures, previousPeriodSignatures)

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
          {/* Card 1: Total de Documentos */}
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl cursor-pointer"
            onClick={() => handleCardClick('all')}>
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
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${documentsTrend >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                    {documentsTrend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs font-semibold ${documentsTrend >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                      {Math.abs(documentsTrend).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">vs período anterior</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Aprovações Pendentes */}
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl cursor-pointer"
            onClick={() => setActiveView('approvals')}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-50 group-hover:bg-amber-100 transition-colors duration-300">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{pendingApprovalsCount}</div>
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

          {/* Card 3: Assinaturas Digitais */}
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl cursor-pointer"
            onClick={() => setActiveView('electronic-signature')}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors duration-300">
                  <PenTool className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{completedSignatures}</div>
                  <div className="text-sm text-gray-500 font-medium">Assinaturas Concluídas</div>
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

          {/* Card 4: Usuários Ativos */}
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl cursor-pointer"
            onClick={() => { setActiveView('admin'); setAdminView('users') }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors duration-300">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{activeUsers}</div>
                  <div className="text-sm text-gray-500 font-medium">Usuários Ativos</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50">
                    <User className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700">{totalUsers}</span>
                  </div>
                  <span className="text-xs text-gray-500">total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Estatísticas de Status */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Status dos Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Aprovados</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{approvedDocuments}</div>
                  <div className="text-xs text-gray-500">{approvalRate}%</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-600">Pendentes</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{pendingDocuments}</div>
                  <div className="text-xs text-gray-500">{totalDocuments > 0 ? (pendingDocuments / totalDocuments * 100).toFixed(1) : '0'}%</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm text-gray-600">Rascunhos</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{draftDocuments}</div>
                  <div className="text-xs text-gray-500">{totalDocuments > 0 ? (draftDocuments / totalDocuments * 100).toFixed(1) : '0'}%</div>
                </div>
              </div>
              {rejectedDocuments > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Rejeitados</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{rejectedDocuments}</div>
                    <div className="text-xs text-gray-500">{rejectionRate}%</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas de Aprovações */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Minhas Aprovações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendentes</span>
                <div className="text-right">
                  <div className="font-semibold text-amber-600">{pendingApprovalsCount}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aprovadas por mim</span>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{approvedByMe}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rejeitadas por mim</span>
                <div className="text-right">
                  <div className="font-semibold text-red-600">{rejectedByMe}</div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <div className="font-bold">{totalApprovals}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas de Assinaturas */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <PenTool className="h-5 w-5 mr-2 text-purple-600" />
                Assinaturas Eletrônicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Concluídas</span>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{completedSignatures}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendentes</span>
                <div className="text-right">
                  <div className="font-semibold text-amber-600">{pendingSignatures}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taxa de conclusão</span>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">
                    {totalSignatures > 0 ? (completedSignatures / totalSignatures * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <div className="font-bold">{totalSignatures}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Produtividade Semanal */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Produtividade Semanal
              </CardTitle>
              <CardDescription>
                Documentos, aprovações e assinaturas nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="documents"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Documentos"
                  />
                  <Area
                    type="monotone"
                    dataKey="approvals"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Aprovações"
                  />
                  <Area
                    type="monotone"
                    dataKey="signatures"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                    name="Assinaturas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Distribuição por Status */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-green-600" />
                Distribuição por Status
              </CardTitle>
              <CardDescription>
                Proporção de documentos por status atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={documentsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {documentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento encontrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção de Dados por Categoria e Tipo */}
        {(departmentData.length > 0 || documentTypeData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documentos por Categoria */}
            {departmentData.length > 0 && (
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-orange-600" />
                    Documentos por Categoria
                  </CardTitle>
                  <CardDescription>
                    Distribuição de documentos por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="documents" fill="#F97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Documentos por Tipo */}
            {documentTypeData.length > 0 && (
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-purple-600" />
                    Documentos por Tipo
                  </CardTitle>
                  <CardDescription>
                    Distribuição de documentos por tipo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={documentTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="documents" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Seção de Atividade Recente e Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Atividade Recente */}
          <Card className="lg:col-span-2 p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 8).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">por {activity.user_name}</p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma atividade recente</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesso rápido às principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowCreationSelector(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Documento
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setActiveView('electronic-signature')}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Assinar Documento
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setActiveView('approvals')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver Aprovações
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowQuickSearch(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                Busca Rápida
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setActiveView('notifications')}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificações
                {unreadNotificationsCount > 0 && (
                  <Badge className="ml-auto" variant="destructive">
                    {unreadNotificationsCount}
                  </Badge>
                )}
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => { setActiveView('admin'); setAdminView('overview') }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Administração
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboard()
      case "documents":
        return <DocumentList />
      case "approvals":
        return (
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
                  <XCircle className="h-4 w-4 text-red-600" />
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

            {/* Seções de Aprovação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Documentos Pendentes de Aprovação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Documentos Pendentes
                  </CardTitle>
                  <CardDescription>
                    Documentos aguardando sua aprovação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {approvalsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : myApprovals && myApprovals.filter(a => a.status === 'pending').length > 0 ? (
                    <div className="space-y-3">
                      {myApprovals
                        .filter(approval => approval.status === 'pending')
                        .slice(0, 5)
                        .map((approval) => (
                          <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex-1">
                              <h5 className="font-medium">{approval.document_title || 'Documento sem título'}</h5>
                              <p className="text-sm text-gray-500">
                                Autor: {approval.document_author_name || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500">
                                Enviado em: {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
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
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum documento pendente de aprovação.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documentos Enviados para Aprovação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    Documentos Enviados
                  </CardTitle>
                  <CardDescription>
                    Documentos que você enviou para aprovação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sentApprovals && sentApprovals.length > 0 ? (
                    <div className="space-y-3">
                      {sentApprovals.slice(0, 5).map((approval) => (
                        <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex-1">
                            <h5 className="font-medium">{approval.document_title || 'Documento sem título'}</h5>
                            <p className="text-sm text-gray-500">
                              Status: {approval.status === 'pending' ? 'Aguardando Aprovação' :
                                approval.status === 'approved' ? 'Aprovado' :
                                  approval.status === 'rejected' ? 'Rejeitado' : approval.status}
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
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum documento enviado para aprovação.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Histórico de Aprovações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Histórico de Aprovações
                </CardTitle>
                <CardDescription>
                  Decisões de aprovação que você tomou
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myApprovals && myApprovals.filter(a => a.status !== 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {myApprovals
                      .filter(approval => approval.status !== 'pending')
                      .slice(0, 10)
                      .map((approval) => (
                        <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex-1">
                            <h5 className="font-medium">{approval.document_title || 'Documento sem título'}</h5>
                            <p className="text-sm text-gray-500">
                              {approval.status === 'approved' ? 'Aprovado' : 'Rejeitado'} em{' '}
                              {approval.approved_at ? new Date(approval.approved_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Autor: {approval.document_author_name || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={approval.status === 'approved' ? 'default' : 'destructive'}
                              className={approval.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {approval.status === 'approved' ? (
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
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma decisão de aprovação tomada ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      case "ai-create":
        return <AIDocumentCreator />
      case "electronic-signature":
        return <ElectronicSignature />
      case "notifications":
        return <UnifiedNotificationsPage />
      case "chat":
        return <ChatPage />
      case "debug-approvals":
        return <DebugApprovalSystem />
      case "admin":
        return (
          <AdminGuard>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
                  <p className="text-gray-600">
                    Gerencie usuários, configurações e relatórios do sistema
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdminView("overview")}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>

              {/* Navegação Admin */}
              {adminView === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Gestão de Usuários */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("users")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Gestão de Usuários
                      </CardTitle>
                      <CardDescription>
                        Gerenciar usuários, permissões e acessos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{entityStats?.total_users || 0}</div>
                      <p className="text-sm text-muted-foreground">usuários cadastrados</p>
                    </CardContent>
                  </Card>

                  {/* Tipos de Documento */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("document-types")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Tipos de Documento
                      </CardTitle>
                      <CardDescription>
                        Configurar tipos e templates de documentos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{documentTypes.length}</div>
                      <p className="text-sm text-muted-foreground">tipos configurados</p>
                    </CardContent>
                  </Card>

                  {/* Departamentos */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("departments")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        Departamentos
                      </CardTitle>
                      <CardDescription>
                        Gerenciar departamentos e estrutura organizacional
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{departments.length}</div>
                      <p className="text-sm text-muted-foreground">departamentos ativos</p>
                    </CardContent>
                  </Card>

                  {/* Categorias */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("categories")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-orange-600" />
                        Categorias
                      </CardTitle>
                      <CardDescription>
                        Organizar documentos por categorias
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{categories.length}</div>
                      <p className="text-sm text-muted-foreground">categorias ativas</p>
                    </CardContent>
                  </Card>

                  {/* Entidades */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("entities")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-cyan-600" />
                        Entidades
                      </CardTitle>
                      <CardDescription>
                        Gerenciar entidades e organizações
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{entityStats?.total_users || 0}</div>
                      <p className="text-sm text-muted-foreground">usuários na entidade</p>
                    </CardContent>
                  </Card>

                  {/* Relatórios */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("productivity-report")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        Relatórios
                      </CardTitle>
                      <CardDescription>
                        Visualizar relatórios e métricas do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{entityStats?.total_documents || 0}</div>
                      <p className="text-sm text-muted-foreground">documentos processados</p>
                    </CardContent>
                  </Card>

                  {/* Notificações */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("notifications")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-yellow-600" />
                        Notificações
                      </CardTitle>
                      <CardDescription>
                        Gerenciar sistema de notificações
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{notificationStats?.total_sent || 0}</div>
                      <p className="text-sm text-muted-foreground">notificações enviadas</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Conteúdo específico de cada seção */}
              {adminView === "users" && <UserManagement />}
              {adminView === "document-types" && (
                <DocumentTypeManagement
                  initialDocumentTypes={documentTypes.map(dt => ({
                    ...dt,
                    documentsCount: documents.filter(doc => doc.document_type_id === dt.id).length
                  }))}
                  totalDocuments={documents.length}
                />
              )}
              {adminView === "departments" && <DepartmentManagement />}
              {adminView === "categories" && <CategoryManagement />}
              {adminView === "productivity-report" && <ProductivityReport />}
              {adminView === "approval-time-report" && <ApprovalTimeReport />}
              {adminView === "audit-report" && <AuditReport />}
              {adminView === "document-access-report" && <DocumentAccessReport />}
              {adminView === "billing" && <BillingManagement />}
              {adminView === "billing-stats" && <BillingStats />}
              {adminView === "notifications" && <NotificationManagement />}
              {adminView === "entity-users" && <EntityUserManagement />}
              {adminView === "entities" && <EntityManagement />}

              {/* Menu de Relatórios */}
              {adminView === "reports" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("productivity-report")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Relatório de Produtividade
                      </CardTitle>
                      <CardDescription>
                        Análise de produtividade por usuário e departamento
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("approval-time-report")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        Tempo de Aprovação
                      </CardTitle>
                      <CardDescription>
                        Análise dos tempos de aprovação de documentos
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("document-access-report")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-green-600" />
                        Documentos Mais Acessados
                      </CardTitle>
                      <CardDescription>
                        Relatório de documentos mais visualizados
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("audit-report")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Auditoria Completa
                      </CardTitle>
                      <CardDescription>
                        Relatório completo de auditoria do sistema
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              )}

              {/* Ações Rápidas de Admin */}
              {adminView === "overview" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                    <CardDescription>
                      Acesso rápido às principais funcionalidades administrativas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={() => setAdminView("users")}
                      >
                        <Users className="h-6 w-6" />
                        <span className="text-sm">Usuários</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={() => setAdminView("departments")}
                      >
                        <Building2 className="h-6 w-6" />
                        <span className="text-sm">Departamentos</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={() => setAdminView("productivity-report")}
                      >
                        <BarChart3 className="h-6 w-6" />
                        <span className="text-sm">Relatórios</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={() => {
                          setActiveView("documents")
                        }}
                      >
                        <FileText className="h-6 w-6" />
                        <span className="text-sm">Documentos</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        pendingApprovalsCount={myApprovals?.filter(a => a.status === 'pending').length || 0}
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>

      {/* Modais */}
      <FixedQuickSearchModal
        open={showQuickSearch}
        onOpenChange={setShowQuickSearch}
      />

      <DocumentCreationSelector
        open={showCreationSelector}
        onOpenChange={setShowCreationSelector}
        onSelectOption={(option) => {
          setShowCreationSelector(false)
          // Implementar lógica baseada na opção selecionada
          console.log('Opção selecionada:', option)
        }}
      />

      {selectedDocument && (
        <>
          <DocumentModal
            open={showDocumentModal}
            onOpenChange={setShowDocumentModal}
            document={selectedDocument}
            mode={documentModalMode}
            onSave={(document) => {
              setShowDocumentModal(false)
              // Implementar lógica de salvamento
              console.log('Documento salvo:', document)
            }}
          />

          <DocumentPreviewModal
            open={showDocumentPreview}
            onOpenChange={setShowDocumentPreview}
            document={selectedDocument}
            onEdit={handleEditFromPreview}
            onViewAudit={handleViewAuditFromPreview}
            onDownload={() => handleDownloadFromPreview(selectedDocument)}
          />

          <AuditModal
            open={showAuditModal}
            onOpenChange={setShowAuditModal}
            document={selectedDocument}
          />
        </>
      )}

      {selectedApproval && (
        <ApprovalReviewModal
          open={showApprovalReviewModal}
          onOpenChange={setShowApprovalReviewModal}
          approval={selectedApproval}
          onSuccess={() => {
            setShowApprovalReviewModal(false)
            // Implementar lógica de sucesso
            console.log('Aprovação processada com sucesso')
          }}
        />
      )}

      {selectedApprovalForDetails && (
        <ApprovalDetailsModal
          open={showApprovalDetailsModal}
          onOpenChange={setShowApprovalDetailsModal}
          approval={selectedApprovalForDetails}
        />
      )}

      {/* Modal de Lista de Documentos */}
      <Dialog open={showDocumentListModal} onOpenChange={setShowDocumentListModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{documentListTitle}</DialogTitle>
            <DialogDescription>
              Lista de documentos filtrados por categoria
            </DialogDescription>
          </DialogHeader>
          <DocumentList />
        </DialogContent>
      </Dialog>
    </div>
  )
})