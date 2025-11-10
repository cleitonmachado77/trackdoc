"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  User,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface LogEntry {
  id: string
  action: string
  user_id?: string
  entity_id?: string
  resource_type?: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  user_name?: string
  severity: 'info' | 'warning' | 'error' | 'success'
}

const severityColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800'
}

const severityIcons = {
  info: Activity,
  warning: AlertCircle,
  error: AlertCircle,
  success: CheckCircle
}

export default function SystemLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [userEntityId, setUserEntityId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadUserEntity()
    }
  }, [user])

  useEffect(() => {
    if (userEntityId) {
      loadLogs()
    }
  }, [userEntityId, severityFilter, actionFilter, dateFilter])

  const loadUserEntity = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('entity_id, entity_role, role')
        .eq('id', user?.id)
        .single()

      // Verificar se o usuário é administrador da entidade
      const isEntityAdmin = profile?.entity_role === 'admin' || profile?.role === 'admin'
      
      if (!isEntityAdmin) {
        setError('Acesso negado. Apenas administradores da entidade podem visualizar os logs.')
        setLoading(false)
        return
      }

      setUserEntityId(profile?.entity_id || null)
    } catch (error) {
      console.error('Erro ao carregar entidade do usuário:', error)
      setError('Erro ao verificar permissões de acesso.')
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!userEntityId) {
        setError('Entidade não encontrada.')
        return
      }

      // Calcular data de início baseada no filtro
      let startDate = new Date()
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'all':
          startDate = new Date('2020-01-01')
          break
      }

      const allLogs: LogEntry[] = []

      // 1. Buscar logs de documentos
      try {
        const { data: documentLogs } = await supabase
          .from('documents')
          .select(`
            id,
            title,
            status,
            created_at,
            updated_at,
            author_id,
            profiles!documents_author_id_fkey(full_name, email)
          `)
          .eq('entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })

        documentLogs?.forEach(doc => {
          const authorProfile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles
          
          // Log de criação
          allLogs.push({
            id: `doc-create-${doc.id}`,
            action: `Documento criado: ${doc.title}`,
            user_id: doc.author_id,
            entity_id: userEntityId,
            resource_type: 'document',
            resource_id: doc.id,
            details: { document_title: doc.title, status: doc.status },
            created_at: doc.created_at,
            user_name: authorProfile?.full_name || 'Usuário desconhecido',
            severity: 'info' as const
          })

          // Log de atualização se diferente da criação
          if (doc.updated_at !== doc.created_at) {
            allLogs.push({
              id: `doc-update-${doc.id}`,
              action: `Documento atualizado: ${doc.title}`,
              user_id: doc.author_id,
              entity_id: userEntityId,
              resource_type: 'document',
              resource_id: doc.id,
              details: { document_title: doc.title, status: doc.status },
              created_at: doc.updated_at,
              user_name: authorProfile?.full_name || 'Usuário desconhecido',
              severity: doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'info'
            })
          }
        })
      } catch (err) {
        console.warn('Erro ao buscar logs de documentos:', err)
      }

      // 2. Buscar logs de aprovações
      try {
        const { data: approvalLogs } = await supabase
          .from('approval_requests')
          .select(`
            id,
            status,
            comments,
            approved_at,
            created_at,
            updated_at,
            approver_id,
            document_id,
            profiles!approval_requests_approver_id_fkey(full_name),
            documents!approval_requests_document_id_fkey(title, entity_id)
          `)
          .eq('documents.entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())

        approvalLogs?.forEach(approval => {
          const approverProfile = Array.isArray(approval.profiles) ? approval.profiles[0] : approval.profiles
          const document = Array.isArray(approval.documents) ? approval.documents[0] : approval.documents
          
          if (document?.entity_id === userEntityId) {
            allLogs.push({
              id: `approval-${approval.id}`,
              action: `Aprovação ${approval.status}: ${document?.title || 'Documento'}`,
              user_id: approval.approver_id,
              entity_id: userEntityId,
              resource_type: 'approval',
              resource_id: approval.id,
              details: { 
                document_title: document?.title,
                status: approval.status,
                comments: approval.comments
              },
              created_at: approval.approved_at || approval.updated_at || approval.created_at,
              user_name: approverProfile?.full_name || 'Aprovador desconhecido',
              severity: approval.status === 'approved' ? 'success' : approval.status === 'rejected' ? 'error' : 'warning'
            })
          }
        })
      } catch (err) {
        console.warn('Erro ao buscar logs de aprovações:', err)
      }

      // 3. Buscar logs de assinaturas eletrônicas
      try {
        const { data: signatureLogs } = await supabase
          .from('document_signatures')
          .select(`
            id,
            status,
            created_at,
            updated_at,
            user_id,
            document_id,
            profiles!document_signatures_user_id_fkey(full_name),
            documents!document_signatures_document_id_fkey(title, entity_id)
          `)
          .eq('documents.entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())

        signatureLogs?.forEach(signature => {
          const signerProfile = Array.isArray(signature.profiles) ? signature.profiles[0] : signature.profiles
          const document = Array.isArray(signature.documents) ? signature.documents[0] : signature.documents
          
          if (document?.entity_id === userEntityId) {
            allLogs.push({
              id: `signature-${signature.id}`,
              action: `Assinatura ${signature.status}: ${document?.title || 'Documento'}`,
              user_id: signature.user_id,
              entity_id: userEntityId,
              resource_type: 'signature',
              resource_id: signature.id,
              details: { 
                document_title: document?.title,
                status: signature.status
              },
              created_at: signature.updated_at || signature.created_at,
              user_name: signerProfile?.full_name || 'Usuário desconhecido',
              severity: signature.status === 'completed' ? 'success' : signature.status === 'failed' ? 'error' : 'info'
            })
          }
        })
      } catch (err) {
        console.warn('Erro ao buscar logs de assinaturas:', err)
      }

      // 4. Buscar logs de usuários da entidade
      try {
        const { data: userLogs } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            status,
            entity_role,
            created_at,
            updated_at,
            last_login
          `)
          .eq('entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())

        userLogs?.forEach(userProfile => {
          // Log de criação de usuário
          allLogs.push({
            id: `user-create-${userProfile.id}`,
            action: `Usuário criado: ${userProfile.full_name || userProfile.email}`,
            user_id: userProfile.id,
            entity_id: userEntityId,
            resource_type: 'user',
            resource_id: userProfile.id,
            details: { 
              user_name: userProfile.full_name,
              email: userProfile.email,
              role: userProfile.entity_role
            },
            created_at: userProfile.created_at,
            user_name: userProfile.full_name || 'Sistema',
            severity: 'info' as const
          })

          // Log de último login se disponível
          if (userProfile.last_login && new Date(userProfile.last_login) >= startDate) {
            allLogs.push({
              id: `user-login-${userProfile.id}-${userProfile.last_login}`,
              action: `Login realizado: ${userProfile.full_name || userProfile.email}`,
              user_id: userProfile.id,
              entity_id: userEntityId,
              resource_type: 'auth',
              resource_id: userProfile.id,
              details: { 
                user_name: userProfile.full_name,
                email: userProfile.email
              },
              created_at: userProfile.last_login,
              user_name: userProfile.full_name || 'Usuário',
              severity: 'success' as const
            })
          }

          // Log de alteração de status se diferente de ativo
          if (userProfile.status !== 'active') {
            allLogs.push({
              id: `user-status-${userProfile.id}`,
              action: `Status do usuário alterado: ${userProfile.full_name || userProfile.email} - ${userProfile.status}`,
              user_id: userProfile.id,
              entity_id: userEntityId,
              resource_type: 'user',
              resource_id: userProfile.id,
              details: { 
                user_name: userProfile.full_name,
                email: userProfile.email,
                status: userProfile.status
              },
              created_at: userProfile.updated_at || userProfile.created_at,
              user_name: 'Sistema',
              severity: userProfile.status === 'inactive' ? 'warning' : 'error'
            })
          }
        })
      } catch (err) {
        console.warn('Erro ao buscar logs de usuários:', err)
      }

      // 5. Buscar logs de notificações enviadas
      try {
        const { data: notificationLogs } = await supabase
          .from('notifications')
          .select(`
            id,
            title,
            type,
            status,
            created_at,
            created_by,
            profiles!notifications_created_by_fkey(full_name, entity_id)
          `)
          .eq('profiles.entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())

        notificationLogs?.forEach(notification => {
          const creatorProfile = Array.isArray(notification.profiles) ? notification.profiles[0] : notification.profiles
          
          if (creatorProfile?.entity_id === userEntityId) {
            allLogs.push({
              id: `notification-${notification.id}`,
              action: `Notificação enviada: ${notification.title}`,
              user_id: notification.created_by,
              entity_id: userEntityId,
              resource_type: 'notification',
              resource_id: notification.id,
              details: { 
                title: notification.title,
                type: notification.type,
                status: notification.status
              },
              created_at: notification.created_at,
              user_name: creatorProfile?.full_name || 'Sistema',
              severity: notification.status === 'sent' ? 'success' : notification.status === 'failed' ? 'error' : 'info'
            })
          }
        })
      } catch (err) {
        console.warn('Erro ao buscar logs de notificações:', err)
      }

      // 6. Buscar logs de uploads de arquivos
      try {
        const { data: fileLogs } = await supabase
          .from('document_files')
          .select(`
            id,
            filename,
            file_size,
            created_at,
            uploaded_by,
            document_id,
            profiles!document_files_uploaded_by_fkey(full_name),
            documents!document_files_document_id_fkey(title, entity_id)
          `)
          .eq('documents.entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())

        fileLogs?.forEach(file => {
          const uploaderProfile = Array.isArray(file.profiles) ? file.profiles[0] : file.profiles
          const document = Array.isArray(file.documents) ? file.documents[0] : file.documents
          
          if (document?.entity_id === userEntityId) {
            allLogs.push({
              id: `file-upload-${file.id}`,
              action: `Arquivo enviado: ${file.filename}`,
              user_id: file.uploaded_by,
              entity_id: userEntityId,
              resource_type: 'file',
              resource_id: file.id,
              details: { 
                filename: file.filename,
                file_size: file.file_size,
                document_title: document?.title
              },
              created_at: file.created_at,
              user_name: uploaderProfile?.full_name || 'Usuário desconhecido',
              severity: 'success' as const
            })
          }
        })
      } catch (err) {
        console.warn('Erro ao buscar logs de arquivos:', err)
      }

      // 7. Buscar logs da tabela de auditoria (se existir)
      try {
        const { data: auditLogs } = await supabase
          .from('audit_logs')
          .select(`
            id,
            action,
            user_id,
            entity_id,
            resource_type,
            resource_id,
            details,
            severity,
            ip_address,
            created_at,
            profiles!audit_logs_user_id_fkey(full_name)
          `)
          .eq('entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })

        auditLogs?.forEach(log => {
          const userProfile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles
          
          allLogs.push({
            id: `audit-${log.id}`,
            action: log.action,
            user_id: log.user_id,
            entity_id: log.entity_id,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            details: log.details,
            ip_address: log.ip_address,
            created_at: log.created_at,
            user_name: userProfile?.full_name || 'Sistema',
            severity: log.severity || 'info'
          })
        })
      } catch (err) {
        console.warn('Tabela audit_logs não encontrada, usando logs das tabelas principais:', err)
      }

      // 8. Buscar logs de alterações na entidade
      try {
        const { data: entityLogs } = await supabase
          .from('entities')
          .select(`
            id,
            name,
            settings,
            created_at,
            updated_at
          `)
          .eq('id', userEntityId)
          .single()

        if (entityLogs && entityLogs.updated_at !== entityLogs.created_at) {
          allLogs.push({
            id: `entity-update-${entityLogs.id}`,
            action: `Configurações da entidade atualizadas: ${entityLogs.name}`,
            user_id: user?.id || 'system',
            entity_id: userEntityId,
            resource_type: 'entity',
            resource_id: entityLogs.id,
            details: { 
              entity_name: entityLogs.name,
              settings: entityLogs.settings
            },
            created_at: entityLogs.updated_at,
            user_name: 'Administrador',
            severity: 'info' as const
          })
        }
      } catch (err) {
        console.warn('Erro ao buscar logs da entidade:', err)
      }

      // 9. Buscar logs de comentários em documentos
      try {
        const { data: commentLogs } = await supabase
          .from('document_comments')
          .select(`
            id,
            content,
            created_at,
            author_id,
            document_id,
            profiles!document_comments_author_id_fkey(full_name),
            documents!document_comments_document_id_fkey(title, entity_id)
          `)
          .eq('documents.entity_id', userEntityId)
          .gte('created_at', startDate.toISOString())

        commentLogs?.forEach(comment => {
          const authorProfile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
          const document = Array.isArray(comment.documents) ? comment.documents[0] : comment.documents
          
          if (document?.entity_id === userEntityId) {
            allLogs.push({
              id: `comment-${comment.id}`,
              action: `Comentário adicionado: ${document?.title || 'Documento'}`,
              user_id: comment.author_id,
              entity_id: userEntityId,
              resource_type: 'comment',
              resource_id: comment.id,
              details: { 
                document_title: document?.title,
                comment_preview: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : '')
              },
              created_at: comment.created_at,
              user_name: authorProfile?.full_name || 'Usuário desconhecido',
              severity: 'info' as const
            })
          }
        })
      } catch (err) {
        console.warn('Erro ao buscar logs de comentários:', err)
      }

      // Ordenar todos os logs por data (mais recentes primeiro)
      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Aplicar filtros
      let filteredLogs = allLogs

      if (severityFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.severity === severityFilter)
      }

      if (actionFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(actionFilter.toLowerCase())
        )
      }

      // Limitar a 200 logs para performance
      setLogs(filteredLogs.slice(0, 200))

    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      setError('Erro ao carregar logs do sistema.')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      return (
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Ação', 'Usuário', 'Severidade', 'IP', 'Detalhes'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.action,
        log.user_name || 'Sistema',
        log.severity,
        log.ip_address || 'N/A',
        log.details?.description || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `system-logs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Verificação de acesso negado
  if (error) {
    return (
      <div className="space-y-6">

        
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Apenas administradores da entidade podem visualizar os logs do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">Logs do Sistema</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs} disabled={loading || filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Severidade</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="criado">Criação</SelectItem>
                  <SelectItem value="aprovado">Aprovação</SelectItem>
                  <SelectItem value="rejeitado">Rejeição</SelectItem>
                  <SelectItem value="logado">Login</SelectItem>
                  <SelectItem value="configuração">Configuração</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Logs</p>
                <p className="text-2xl font-bold mt-1">{filteredLogs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sucessos</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {filteredLogs.filter(log => log.severity === 'success').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avisos</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {filteredLogs.filter(log => log.severity === 'warning').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Erros</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {filteredLogs.filter(log => log.severity === 'error').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Registro de Atividades
          </CardTitle>
          <CardDescription>
            {filteredLogs.length} log(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando logs...</span>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const SeverityIcon = severityIcons[log.severity]
                return (
                  <div key={log.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full ${severityColors[log.severity]}`}>
                      <SeverityIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{log.action}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={severityColors[log.severity]}>
                            {log.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {log.user_name}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center">
                              <Settings className="h-3 w-3 mr-1" />
                              {log.ip_address}
                            </span>
                          )}
                          {log.resource_type && (
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {log.resource_type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {log.details?.description && (
                        <p className="mt-2 text-sm text-gray-500">
                          {log.details.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado para os filtros selecionados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}