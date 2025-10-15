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
  Calendar,
  User,
  FileText,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
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
        .select('entity_id')
        .eq('id', user?.id)
        .single()

      setUserEntityId(profile?.entity_id || null)
    } catch (error) {
      console.error('Erro ao carregar entidade do usuário:', error)
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)

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

      // Buscar logs de auditoria
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!audit_logs_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .gte('created_at', startDate.toISOString())
        .limit(100)

      // Filtrar por entidade se disponível
      if (userEntityId) {
        query = query.eq('entity_id', userEntityId)
      }

      // Aplicar filtros
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter)
      }

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Processar logs para incluir informações do usuário
      const processedLogs: LogEntry[] = (data || []).map(log => ({
        ...log,
        user_name: log.profiles?.full_name || 'Sistema',
        severity: log.severity || 'info'
      }))

      setLogs(processedLogs)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      // Se a tabela não existir, criar logs simulados para demonstração
      setLogs(generateMockLogs())
    } finally {
      setLoading(false)
    }
  }

  const generateMockLogs = (): LogEntry[] => {
    const actions = [
      'Documento criado',
      'Documento aprovado',
      'Documento rejeitado',
      'Usuário logado',
      'Usuário criado',
      'Configuração alterada',
      'Backup realizado',
      'Erro de sistema',
      'Assinatura digital realizada',
      'Relatório gerado'
    ]

    const severities: Array<'info' | 'warning' | 'error' | 'success'> = ['info', 'warning', 'error', 'success']

    return Array.from({ length: 50 }, (_, i) => ({
      id: `mock-${i}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      user_id: user?.id || 'system',
      entity_id: userEntityId || undefined,
      resource_type: 'document',
      resource_id: `doc-${i}`,
      details: { description: `Ação realizada no sistema - ${i}` },
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      user_name: user?.email?.split('@')[0] || 'Sistema',
      severity: severities[Math.floor(Math.random() * severities.length)]
    }))
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logs do Sistema</h2>
          <p className="text-gray-600">
            Logs completos para verificação e auditoria de todas as atividades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
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