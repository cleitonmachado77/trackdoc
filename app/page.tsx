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
  LayoutGrid,
  List,
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

import DocumentTypeManagement from "./components/admin/document-type-management"
import ProductivityReport from "./components/admin/productivity-report"
import ApprovalTimeReport from "./components/admin/approval-time-report"
import AuditReport from "./components/admin/audit-report"
import DepartmentManagement from "./components/admin/department-management"
import CategoryManagement from "./components/admin/category-management"
import BillingManagement from "./components/admin/billing-management"
import BillingStats from "./components/admin/billing-stats"
import SystemLogs from "./components/admin/system-logs"
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
import PerformanceMonitor from "./components/performance-monitor"

import ChatPage from "./chat/page"
import MinhaContaPage from "./minha-conta/page"
import BibliotecaPage from "./biblioteca/page"
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
  // Hooks para dados reais - otimizados para carregamento lazy
  const { user } = useAuth()
  const { documents, loading: documentsLoading, error: documentsError, createDocument, updateDocument, deleteDocument, changeDocumentStatus, stats: documentStats } = useDocuments()
  const { myApprovals, sentApprovals, loading: approvalsLoading } = useApprovals()
  const { departments } = useDepartments()
  const { categories } = useCategories()
  const { documentTypes, refetch: refetchDocumentTypes } = useDocumentTypes()
  const { stats: entityStats, loading: entityStatsLoading, refreshStats: refreshEntityStats } = useEntityStats()
  const { stats: notificationStats } = useNotifications()
  const { signatures, documents: signatureDocuments, loading: signatureLoading } = useElectronicSignatures()
  const searchParams = useSearchParams()

  // Loading state otimizado
  const isInitialLoading = documentsLoading && documents.length === 0

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
  const [adminViewMode, setAdminViewMode] = useState("list")
  const [chartAreaFilter, setChartAreaFilter] = useState("all")
  const [chartTypeFilter, setChartTypeFilter] = useState("all")
  const [documentModalMode, setDocumentModalMode] = useState<"view" | "edit" | "new-version" | "create">("view")
  const [showCreationSelector, setShowCreationSelector] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDocumentListModal, setShowDocumentListModal] = useState(false)
  const [documentListFilter, setDocumentListFilter] = useState("all")
  const [documentListTitle, setDocumentListTitle] = useState("")
  const [showAllActivities, setShowAllActivities] = useState(false)

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

    // Atividade recente baseada em dados reais
    const recentActivity = (() => {
      const activities = []

      // Adicionar atividades de documentos recentes
      const recentDocuments = documents
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      recentDocuments.forEach(doc => {
        activities.push({
          id: `doc-${doc.id}`,
          action: `Documento "${doc.title}" foi criado`,
          user_name: doc.author?.full_name || 'Usuário',
          created_at: doc.created_at,
          type: 'document',
          icon: 'FileText'
        })

        // Se documento foi aprovado recentemente
        if (doc.status === 'approved' && doc.updated_at !== doc.created_at) {
          activities.push({
            id: `doc-approved-${doc.id}`,
            action: `Documento "${doc.title}" foi aprovado`,
            user_name: doc.author?.full_name || 'Usuário',
            created_at: doc.updated_at,
            type: 'approval',
            icon: 'CheckCircle'
          })
        }
      })

      // Adicionar atividades de aprovações recentes
      const recentApprovals = myApprovals
        ?.filter(approval => approval.status === 'approved')
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 3) || []

      recentApprovals.forEach(approval => {
        const document = documents.find(doc => doc.id === approval.document_id)
        activities.push({
          id: `approval-${approval.id}`,
          action: `Documento "${document?.title || 'Sem título'}" foi aprovado`,
          user_name: user?.user_metadata?.full_name || 'Você',
          created_at: approval.updated_at || approval.created_at,
          type: 'approval',
          icon: 'CheckCircle'
        })
      })

      // Adicionar atividades de documentos rejeitados
      const rejectedDocuments = documents
        .filter(doc => doc.status === 'rejected')
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 2)

      rejectedDocuments.forEach(doc => {
        activities.push({
          id: `doc-rejected-${doc.id}`,
          action: `Documento "${doc.title}" foi rejeitado`,
          user_name: doc.author?.full_name || 'Usuário',
          created_at: doc.updated_at || doc.created_at,
          type: 'rejection',
          icon: 'XCircle'
        })
      })

      // Adicionar atividades de assinaturas recentes
      const recentSignatures = signatures
        .filter(sig => sig.status === 'completed')
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 3)

      recentSignatures.forEach(signature => {
        activities.push({
          id: `signature-${signature.id}`,
          action: `Documento "${signature.title || 'Sem título'}" foi assinado digitalmente`,
          user_name: user?.user_metadata?.full_name || 'Usuário',
          created_at: signature.updated_at || signature.created_at,
          type: 'signature',
          icon: 'PenTool'
        })
      })

      // Ordenar por data mais recente e limitar a 10 itens
      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
    })()

    // Calcular tendências (comparação com período anterior)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous * 100)
    }

    // Calcular dados do período anterior baseado em datas reais
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const sixtyDaysAgo = new Date(now)
    sixtyDaysAgo.setDate(now.getDate() - 60)

    // Documentos criados nos últimos 30 dias
    const recentDocuments = documents.filter(doc => {
      const docDate = new Date(doc.created_at)
      return docDate >= thirtyDaysAgo
    }).length

    // Documentos criados entre 30-60 dias atrás
    const previousPeriodDocuments = documents.filter(doc => {
      const docDate = new Date(doc.created_at)
      return docDate >= sixtyDaysAgo && docDate < thirtyDaysAgo
    }).length

    // Aprovações dos últimos 30 dias
    const recentApprovals = myApprovals?.filter(approval => {
      const approvalDate = new Date(approval.created_at)
      return approvalDate >= thirtyDaysAgo
    }).length || 0

    // Aprovações entre 30-60 dias atrás
    const previousPeriodApprovals = myApprovals?.filter(approval => {
      const approvalDate = new Date(approval.created_at)
      return approvalDate >= sixtyDaysAgo && approvalDate < thirtyDaysAgo
    }).length || 0

    // Assinaturas dos últimos 30 dias
    const recentSignatures = signatures.filter(sig => {
      const sigDate = new Date(sig.created_at)
      return sigDate >= thirtyDaysAgo
    }).length

    // Assinaturas entre 30-60 dias atrás
    const previousPeriodSignatures = signatures.filter(sig => {
      const sigDate = new Date(sig.created_at)
      return sigDate >= sixtyDaysAgo && sigDate < thirtyDaysAgo
    }).length

    const documentsTrend = calculateTrend(recentDocuments, previousPeriodDocuments)
    const approvalsTrend = calculateTrend(recentApprovals, previousPeriodApprovals)
    const signaturesTrend = calculateTrend(recentSignatures, previousPeriodSignatures)

    return (
      <div className="space-y-6">
        {/* Header com Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-trackdoc-black">Dashboard</h1>
            <p className="text-trackdoc-gray mt-1">Visão geral do sistema</p>
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
          <Card className="group relative overflow-hidden bg-card backdrop-blur-sm border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl cursor-pointer"
            onClick={() => handleCardClick('all')}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
          <Card className="group relative overflow-hidden bg-card backdrop-blur-sm border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl cursor-pointer"
            onClick={() => setActiveView('approvals')}>
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-warning/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
          <Card className="group relative overflow-hidden bg-card backdrop-blur-sm border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl cursor-pointer"
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
          <Card className="group relative overflow-hidden bg-card backdrop-blur-sm border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-success/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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

        {/* Ações Rápidas */}
        <Card className="p-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-600" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <Button
                className="h-12 flex flex-col items-center justify-center space-y-1"
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Novo Doc</span>
              </Button>

              <Button
                className="h-12 flex flex-col items-center justify-center space-y-1"
                variant="outline"
                size="sm"
                onClick={() => setActiveView('electronic-signature')}
              >
                <PenTool className="h-4 w-4" />
                <span className="text-xs">Assinar</span>
              </Button>

              <Button
                className="h-12 flex flex-col items-center justify-center space-y-1"
                variant="outline"
                size="sm"
                onClick={() => setActiveView('approvals')}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Aprovações</span>
              </Button>

              <Button
                className="h-12 flex flex-col items-center justify-center space-y-1"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickSearch(true)}
              >
                <Search className="h-4 w-4" />
                <span className="text-xs">Buscar</span>
              </Button>

              <Button
                className="h-12 flex flex-col items-center justify-center space-y-1 relative"
                variant="outline"
                size="sm"
                onClick={() => setActiveView('notifications')}
              >
                <Bell className="h-4 w-4" />
                <span className="text-xs">Notificações</span>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>

              <Button
                className="h-12 flex flex-col items-center justify-center space-y-1"
                variant="outline"
                size="sm"
                onClick={() => { setActiveView('admin'); setAdminView('overview') }}
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs">Admin</span>
              </Button>
            </div>
          </CardContent>
        </Card>

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

          {/* Gráfico de Documentos por Setor */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Documentos por Setor
              </CardTitle>
              <CardDescription>
                Distribuição de documentos por departamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calcular documentos por departamento usando dados reais
                const documentsByDepartment = departments.map(dept => {
                  const deptDocuments = documents.filter(doc => doc.department_id === dept.id)
                  return {
                    name: dept.name,
                    count: deptDocuments.length,
                    percentage: totalDocuments > 0 ? Math.round((deptDocuments.length / totalDocuments) * 100) : 0
                  }
                }).filter(dept => dept.count > 0) // Filtrar departamentos sem documentos
                  .sort((a, b) => b.count - a.count) // Ordenar por quantidade (maior para menor)

                // Adicionar documentos sem departamento
                const documentsWithoutDept = documents.filter(doc => !doc.department_id)
                if (documentsWithoutDept.length > 0) {
                  documentsByDepartment.push({
                    name: 'Outros',
                    count: documentsWithoutDept.length,
                    percentage: totalDocuments > 0 ? Math.round((documentsWithoutDept.length / totalDocuments) * 100) : 0
                  })
                }

                // Cores para os departamentos
                const departmentColors = [
                  '#3B82F6', // Azul
                  '#10B981', // Verde
                  '#F59E0B', // Laranja
                  '#8B5CF6', // Roxo
                  '#EF4444', // Vermelho
                  '#6B7280', // Cinza
                  '#EC4899', // Rosa
                  '#14B8A6', // Teal
                ]

                return documentsByDepartment.length > 0 ? (
                  <div className="space-y-4">
                    {documentsByDepartment.map((dept, index) => (
                      <div key={dept.name} className="space-y-2 group hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: departmentColors[index % departmentColors.length] }}
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              {dept.name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            {dept.count} ({dept.percentage}%)
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out group-hover:shadow-sm"
                            style={{
                              width: `${dept.percentage}%`,
                              backgroundColor: departmentColors[index % departmentColors.length]
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Resumo total */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                        <span>Total de Documentos</span>
                        <span>{totalDocuments}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum documento por departamento encontrado</p>
                    </div>
                  </div>
                )
              })()}
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

        {/* Seção de Atividade Recente */}
        <div className="grid grid-cols-1 gap-6">
          {/* Atividade Recente */}
          <Card className="p-6">
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
                <div className="space-y-3">
                  {recentActivity.slice(0, showAllActivities ? recentActivity.length : 5).map((activity, index) => {
                    // Definir ícone e cor baseado no tipo de atividade
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'document':
                          return { icon: FileText, color: 'bg-blue-100 text-blue-600' }
                        case 'approval':
                          return { icon: CheckCircle, color: 'bg-green-100 text-green-600' }
                        case 'signature':
                          return { icon: PenTool, color: 'bg-purple-100 text-purple-600' }
                        case 'rejection':
                          return { icon: XCircle, color: 'bg-red-100 text-red-600' }
                        default:
                          return { icon: Activity, color: 'bg-gray-100 text-gray-600' }
                      }
                    }

                    const { icon: IconComponent, color } = getActivityIcon(activity.type)

                    return (
                      <div key={activity.id || index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className={`p-2 rounded-full ${color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                          <p className="text-xs text-gray-500">por {activity.user_name}</p>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(activity.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Botão para ver mais atividades */}
                  {recentActivity.length > 5 && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs hover:bg-gray-100 flex items-center justify-center gap-1"
                        onClick={() => setShowAllActivities(!showAllActivities)}
                      >
                        {showAllActivities ? (
                          <>
                            <ChevronLeft className="h-3 w-3 rotate-90" />
                            Mostrar menos atividades
                          </>
                        ) : (
                          <>
                            <ChevronLeft className="h-3 w-3 -rotate-90" />
                            Ver todas as atividades ({recentActivity.length})
                          </>
                        )}
                      </Button>
                    </div>
                  )}
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
      case "biblioteca":
        return <BibliotecaPage />
      case "chat":
        return <ChatPage />
      case "debug-approvals":
        return <div>Debug não disponível em produção</div>
      case "admin":
        return (
          <AdminGuard>
            <div className="space-y-6">
              {/* Header - Apenas na tela principal */}
              {adminView === "overview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
                      <p className="text-gray-600">
                        Gerencie usuários, configurações e relatórios do sistema
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdminViewMode(adminViewMode === 'list' ? 'cards' : 'list')}
                      >
                        {adminViewMode === 'list' ? (
                          <>
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Cards
                          </>
                        ) : (
                          <>
                            <List className="h-4 w-4 mr-2" />
                            Lista
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão Voltar - Apenas em subpáginas */}
              {adminView !== "overview" && (
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdminView("overview")}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar ao Início
                  </Button>
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
                        onClick={() => setActiveView("minha-conta")}
                      >
                        <User className="h-6 w-6" />
                        <span className="text-sm">Minha Conta</span>
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
                        onClick={() => setAdminView("system-logs")}
                      >
                        <BarChart3 className="h-6 w-6" />
                        <span className="text-sm">Logs do Sistema</span>
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

              {/* Navegação Admin */}
              {adminView === "overview" && adminViewMode === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                  {/* Logs do Sistema */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setAdminView("system-logs")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        Logs do Sistema
                      </CardTitle>
                      <CardDescription>
                        Logs completos para verificação e auditoria
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{entityStats?.total_documents || 0}</div>
                      <p className="text-sm text-muted-foreground">eventos registrados</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Visualização em Lista */}
              {adminView === "overview" && adminViewMode === "list" && (
                <div className="space-y-3">
                  {/* Tipos de Documento */}
                  <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAdminView("document-types")}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Tipos de Documento</h3>
                          <p className="text-sm text-gray-600">Configurar tipos e templates de documentos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{documentTypes.length}</div>
                        <p className="text-sm text-gray-500">tipos configurados</p>
                      </div>
                    </div>
                  </div>

                  {/* Departamentos */}
                  <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAdminView("departments")}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Departamentos</h3>
                          <p className="text-sm text-gray-600">Gerenciar departamentos e estrutura organizacional</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
                        <p className="text-sm text-gray-500">departamentos ativos</p>
                      </div>
                    </div>
                  </div>

                  {/* Categorias */}
                  <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAdminView("categories")}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Tag className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Categorias</h3>
                          <p className="text-sm text-gray-600">Organizar documentos por categorias</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                        <p className="text-sm text-gray-500">categorias ativas</p>
                      </div>
                    </div>
                  </div>

                  {/* Entidades */}
                  <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAdminView("entities")}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Entidades</h3>
                          <p className="text-sm text-gray-600">Gerenciar entidades e organizações</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{entityStats?.total_users || 0}</div>
                        <p className="text-sm text-gray-500">usuários na entidade</p>
                      </div>
                    </div>
                  </div>

                  {/* Logs do Sistema */}
                  <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAdminView("system-logs")}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Logs do Sistema</h3>
                          <p className="text-sm text-gray-600">Logs completos para verificação e auditoria</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{entityStats?.total_documents || 0}</div>
                        <p className="text-sm text-gray-500">eventos registrados</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Conteúdo específico de cada seção */}
              {adminView === "document-types" && (
                <DocumentTypeManagement
                  key="document-types-management" // Key estável para evitar remontagem
                  initialDocumentTypes={documentTypes.map(dt => ({
                    ...dt,
                    documentsCount: documents.filter(doc => doc.document_type_id === dt.id).length
                  }))}
                  totalDocuments={documents.length}
                  onDataChange={refetchDocumentTypes}
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

              {adminView === "entity-users" && <EntityUserManagement />}
              {adminView === "entities" && <EntityManagement />}
              {adminView === "system-logs" && <SystemLogs />}

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

  // Mostrar loading otimizado durante carregamento inicial
  if (isInitialLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 bg-sidebar border-r border-border flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-300 rounded mb-4"></div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Carregando TrackDoc</h2>
            <p className="text-gray-600">Preparando seu ambiente de trabalho...</p>
          </div>
        </main>
      </div>
    )
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

      {/* Modal de Upload de Documento */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Upload de Documento</DialogTitle>
            <DialogDescription>
              Faça upload de um novo documento para o sistema
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 max-h-[calc(90vh-120px)]">
            <DocumentUploadWithApproval onSuccess={() => setShowUploadModal(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Monitor de Performance (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
    </div>
  )
})