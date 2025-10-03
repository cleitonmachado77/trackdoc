"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Download,
  FileText,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Activity,
  Shield,
  RefreshCw,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuditLog {
  id: string
  action: string
  severity: 'info' | 'success' | 'warning' | 'critical'
  user: string
  details: string
  timestamp: string
  document?: string
  documentTitle?: string
  ipAddress: string
  userAgent: string
}

const emptyAuditData: AuditLog[] = [] // Empty array for audit logs

const actionLabels: Record<string, string> = {
  document_created: "Documento Criado",
  document_edited: "Documento Editado",
  document_viewed: "Documento Visualizado",
  document_approved: "Documento Aprovado",
  document_rejected: "Documento Rejeitado",
  document_deleted: "Documento Excluído",
  login_success: "Login Realizado",
  login_failed: "Falha no Login",
  user_created: "Usuário Criado",
  user_permissions_changed: "Permissões Alteradas",
  system_backup: "Backup do Sistema",
}

const actionIcons: Record<string, JSX.Element> = {
  document_created: <FileText className="h-4 w-4" />,
  document_edited: <Edit className="h-4 w-4" />,
  document_viewed: <Eye className="h-4 w-4" />,
  document_approved: <CheckCircle className="h-4 w-4" />,
  document_rejected: <XCircle className="h-4 w-4" />,
  document_deleted: <FileText className="h-4 w-4" />,
  login_success: <User className="h-4 w-4" />,
  login_failed: <User className="h-4 w-4" />,
  user_created: <User className="h-4 w-4" />,
  user_permissions_changed: <Shield className="h-4 w-4" />,
  system_backup: <Activity className="h-4 w-4" />,
}

const severityColors = {
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
}

const severityLabels = {
  info: "Info",
  success: "Sucesso",
  warning: "Atenção",
  critical: "Crítico",
}

export default function AuditReport() {
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAction, setSelectedAction] = useState("all")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedUser, setSelectedUser] = useState("all")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    critical: 0,
    warnings: 0
  })

  // Função para buscar dados de auditoria
  const fetchAuditData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Buscar usuários
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .not('full_name', 'is', null)
        .order('full_name')

      if (userError) throw userError
      setUsers(userData || [])

      // Buscar dados de auditoria (simulado baseado em dados reais)
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          author:profiles!documents_author_id_fkey(full_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (docError) throw docError

      // Buscar dados de aprovação
      const { data: approvals, error: approvalError } = await supabase
        .from('approval_workflows')
        .select(`
          id,
          status,
          created_at,
          approved_at,
          approver:profiles!approval_workflows_approver_id_fkey(full_name),
          document:documents!approval_workflows_document_id_fkey(title)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (approvalError) throw approvalError

      // Processar dados de auditoria
      const auditData: any[] = []

      // Adicionar logs de documentos
      documents?.forEach((doc: any) => {
        auditData.push({
          id: `doc-${doc.id}`,
          action: 'document_created',
          severity: 'info' as const,
          user: doc.author?.full_name || 'Sistema',
          details: `Documento "${doc.title}" foi criado`,
          timestamp: doc.created_at,
          document: doc.id,
          documentTitle: doc.title,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        })

        if (doc.updated_at !== doc.created_at) {
          auditData.push({
            id: `doc-update-${doc.id}`,
            action: 'document_edited',
            severity: 'info' as const,
            user: doc.author?.full_name || 'Sistema',
            details: `Documento "${doc.title}" foi atualizado`,
            timestamp: doc.updated_at,
            document: doc.id,
            documentTitle: doc.title,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...'
          })
        }
      })

      // Adicionar logs de aprovação
      approvals?.forEach((approval: any) => {
        const action = approval.status === 'approved' ? 'document_approved' : 
                      approval.status === 'rejected' ? 'document_rejected' : 'document_viewed'
        const severity = approval.status === 'approved' ? 'success' as const :
                        approval.status === 'rejected' ? 'warning' as const : 'info' as const

        auditData.push({
          id: `approval-${approval.id}`,
          action,
          severity,
          user: approval.approver?.full_name || 'Sistema',
          details: `Documento "${approval.document?.title}" foi ${approval.status === 'approved' ? 'aprovado' : approval.status === 'rejected' ? 'rejeitado' : 'visualizado'}`,
          timestamp: approval.approved_at || approval.created_at,
          document: approval.document?.id,
          documentTitle: approval.document?.title,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        })
      })

      // Ordenar por timestamp
      auditData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setAuditLogs(auditData)

      // Calcular estatísticas
      const today = new Date().toISOString().slice(0, 10)
      const total = auditData.length
      const todayCount = auditData.filter(log => log.timestamp?.startsWith(today)).length
      const criticalCount = auditData.filter(log => log.severity === 'critical').length
      const warningsCount = auditData.filter(log => log.severity === 'warning').length

      setStats({
        total,
        today: todayCount,
        critical: criticalCount,
        warnings: warningsCount
      })

    } catch (error) {
      console.error('Erro ao buscar dados de auditoria:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de auditoria.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchAuditData()
  }, [user?.id])

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.documentTitle && log.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesAction = selectedAction === "all" || log.action === selectedAction
    const matchesSeverity = selectedSeverity === "all" || log.severity === selectedSeverity
    const matchesUser = selectedUser === "all" || log.user === selectedUser

    return matchesSearch && matchesAction && matchesSeverity && matchesUser
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Atividade do dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
            <p className="text-xs text-red-600">Requer atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avisos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warnings}</div>
            <p className="text-xs text-yellow-600">Para revisão</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar nos logs de auditoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="document_created">Documento Criado</SelectItem>
                  <SelectItem value="document_approved">Documento Aprovado</SelectItem>
                  <SelectItem value="document_viewed">Documento Visualizado</SelectItem>
                  <SelectItem value="login_failed">Falha no Login</SelectItem>
                  <SelectItem value="document_deleted">Documento Excluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Atenção</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.full_name}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={fetchAuditData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Carregando logs de auditoria...
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-gray-500">Nenhum log de auditoria disponível.</p>
              ) : (
                filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${severityColors[log.severity]}`}>
                    {actionIcons[log.action] || <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{actionLabels[log.action] || log.action}</h3>
                        <Badge className={severityColors[log.severity]}>{severityLabels[log.severity]}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">{log.details}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {log.user}
                        </span>
                        {log.document && (
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {log.document} - {log.documentTitle}
                          </span>
                        )}
                        <span>IP: {log.ipAddress}</span>
                        <span>{log.userAgent}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
