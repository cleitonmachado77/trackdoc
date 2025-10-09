"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, TrendingUp, TrendingDown, AlertTriangle, Users, Download, Timer, RefreshCw } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { toast } from "@/hooks/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ApproverStat {
  id: string
  name: string
  role: string
  averageTime: number
  totalApprovals: number
  pendingCount: number
  overdueCount: number
  efficiency: number
  trend: 'up' | 'down' | 'stable'
}

interface DocumentTypeStat {
  type: string
  avgTime: number
  slaCompliance: number
  count: number
}

interface TimeDistribution {
  range: string
  count: number
  percentage: number
}

const emptyApprovalData = {
  overview: {
    averageApprovalTime: 0, // dias
    fastestApproval: 0,
    slowestApproval: 0,
    pendingApprovals: 0,
    overdueApprovals: 0,
  },
  approverStats: [] as ApproverStat[],
  documentTypeStats: [] as DocumentTypeStat[],
  timeDistribution: [] as TimeDistribution[],
}

const trendIcons = {
  up: <TrendingUp className="h-4 w-4 text-green-600" />,
  down: <TrendingDown className="h-4 w-4 text-red-600" />,
  stable: <Timer className="h-4 w-4 text-gray-600" />,
}

export default function ApprovalTimeReport() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedType, setSelectedType] = useState("all")
  const [loading, setLoading] = useState(false)
  const [approvalData, setApprovalData] = useState<any[]>([])
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const [documentTypeStats, setDocumentTypeStats] = useState<any[]>([])
  const [timeDistribution, setTimeDistribution] = useState<any[]>([])
  const [stats, setStats] = useState({
    averageTime: 0,
    totalApprovals: 0,
    pendingCount: 0,
    overdueCount: 0
  })

  // Função para buscar dados de tempo de aprovação
  const fetchApprovalData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Buscar tipos de documento
      const { data: typeData, error: typeError } = await supabase
        .from('document_types')
        .select('id, name')
        .order('name')

      if (typeError) throw typeError
      setDocumentTypes(typeData || [])

      // Buscar dados de aprovação
      const { data: approvalData, error: approvalError } = await supabase
        .from('approval_requests')
        .select(`
          id,
          status,
          created_at,
          approved_at,
          approver:profiles!approval_requests_approver_id_fkey(full_name, role),
          document:documents!approval_requests_document_id_fkey(
            title,
            document_type:document_types(name)
          )
        `)
        .order('created_at', { ascending: false })

      if (approvalError) throw approvalError

      // Processar dados de aprovação
      const processedData = (approvalData || []).map((approval: any) => {
        const createdDate = new Date(approval.created_at)
        const approvedDate = approval.approved_at ? new Date(approval.approved_at) : null
        const timeDiff = approvedDate ? approvedDate.getTime() - createdDate.getTime() : null
        const hoursDiff = timeDiff ? Math.round(timeDiff / (1000 * 60 * 60)) : null

        return {
          id: approval.id,
          name: approval.approver?.full_name || 'Usuário Desconhecido',
          role: approval.approver?.role || 'Usuário',
          averageTime: hoursDiff || 0,
          totalApprovals: 1,
          pendingCount: approval.status === 'pending' ? 1 : 0,
          overdueCount: hoursDiff && hoursDiff > 24 ? 1 : 0,
          efficiency: hoursDiff ? Math.max(0, 100 - (hoursDiff / 24) * 10) : 0,
          trend: hoursDiff && hoursDiff < 24 ? 'up' : hoursDiff && hoursDiff < 72 ? 'stable' : 'down',
          documentType: approval.document?.document_type?.name || 'N/A'
        }
      })

      // Agrupar por aprovador
      const groupedData = processedData.reduce((acc: any, item: any) => {
        const existing = acc.find((a: any) => a.name === item.name)
        if (existing) {
          existing.totalApprovals += item.totalApprovals
          existing.pendingCount += item.pendingCount
          existing.overdueCount += item.overdueCount
          existing.averageTime = (existing.averageTime + item.averageTime) / 2
        } else {
          acc.push(item)
        }
        return acc
      }, [])

      setApprovalData(groupedData)

      // Calcular estatísticas reais por tipo de documento
      const documentTypeStats = (documentTypes || []).map((type: any) => {
        const typeApprovals = groupedData.filter(item => item.documentType === type.name)
        const totalApprovals = typeApprovals.length
        const avgTime = totalApprovals > 0 ? typeApprovals.reduce((sum, item) => sum + item.averageTime, 0) / totalApprovals : 0
        const slaCompliance = totalApprovals > 0 ? typeApprovals.filter(item => item.averageTime <= 24).length / totalApprovals * 100 : 0
        
        return {
          type: type.name,
          avgTime: Math.round(avgTime),
          totalApprovals,
          slaCompliance: Math.round(slaCompliance),
          trend: avgTime < 24 ? 'up' : avgTime < 72 ? 'stable' : 'down'
        }
      })
      setDocumentTypeStats(documentTypeStats)

      // Calcular distribuição de tempo baseada em dados reais
      const timeDistribution = [
        { range: '0-1 dias', count: groupedData.filter(item => item.averageTime <= 24).length, percentage: 0 },
        { range: '1-3 dias', count: groupedData.filter(item => item.averageTime > 24 && item.averageTime <= 72).length, percentage: 0 },
        { range: '3-7 dias', count: groupedData.filter(item => item.averageTime > 72 && item.averageTime <= 168).length, percentage: 0 },
        { range: '7+ dias', count: groupedData.filter(item => item.averageTime > 168).length, percentage: 0 }
      ]
      const totalCount = timeDistribution.reduce((sum, item) => sum + item.count, 0)
      timeDistribution.forEach(item => {
        item.percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
      })
      setTimeDistribution(timeDistribution)

      // Calcular estatísticas
      const totalApprovals = groupedData.reduce((sum: number, item: any) => sum + item.totalApprovals, 0)
      const avgTime = groupedData.length > 0 
        ? groupedData.reduce((sum: number, item: any) => sum + item.averageTime, 0) / groupedData.length 
        : 0
      const pendingCount = groupedData.reduce((sum: number, item: any) => sum + item.pendingCount, 0)
      const overdueCount = groupedData.reduce((sum: number, item: any) => sum + item.overdueCount, 0)

      setStats({
        averageTime: Math.round(avgTime),
        totalApprovals,
        pendingCount,
        overdueCount
      })

    } catch (error) {
      console.error('Erro ao buscar dados de aprovação:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de tempo de aprovação.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchApprovalData()
  }, [user?.id])

  // Filtrar dados baseado nos filtros selecionados
  const filteredData = approvalData.filter(item => {
    const matchesType = selectedType === "all" || item.documentType === selectedType
    return matchesType
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="quarter">Este Trimestre</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchApprovalData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageTime} horas</div>
            <p className="text-xs text-green-600">Tempo médio de aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Rápida</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApprovals}</div>
            <p className="text-xs text-muted-foreground">Total de aprovações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Lenta</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Aprovações pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueCount}</div>
            <p className="text-xs text-red-600">Acima do SLA</p>
          </CardContent>
        </Card>
      </div>

      {/* Approver Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Aprovadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Carregando dados de aprovação...
              </div>
            ) : filteredData.length === 0 ? (
              <p className="text-center text-gray-500">Nenhum dado de aprovador disponível.</p>
            ) : (
              filteredData.map((approver) => (
                <div key={approver.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {approver.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{approver.name}</h3>
                      <p className="text-sm text-gray-500">{approver.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">{approver.averageTime}d</p>
                      <p className="text-xs text-gray-500">Tempo Médio</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{approver.totalApprovals}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{approver.pendingCount}</p>
                      <p className="text-xs text-gray-500">Pendentes</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${approver.overdueCount > 0 ? "text-red-600" : ""}`}>
                        {approver.overdueCount}
                      </p>
                      <p className="text-xs text-gray-500">Em Atraso</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{approver.efficiency}%</span>
                        {trendIcons[approver.trend]}
                      </div>
                      <Progress value={approver.efficiency} className="h-2 mt-1" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Type Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tempo por Tipo de Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentTypeStats.length === 0 ? (
                <p className="text-center text-gray-500">Nenhum dado de tipo de documento disponível.</p>
              ) : (
                documentTypeStats.map((docType) => (
                  <div key={docType.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{docType.type}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{docType.avgTime}d médio</span>
                        <Badge
                          variant={
                            docType.slaCompliance >= 90
                              ? "default"
                              : docType.slaCompliance >= 80
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {docType.slaCompliance}% SLA
                        </Badge>
                      </div>
                    </div>
                    <Progress value={docType.slaCompliance} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{docType.count} documentos</span>
                      <span>Conformidade SLA: {docType.slaCompliance}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeDistribution.length === 0 ? (
                <p className="text-center text-gray-500">Nenhum dado de distribuição de tempo disponível.</p>
              ) : (
                timeDistribution.map((range) => (
                  <div key={range.range} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{range.range}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{range.count} docs</span>
                        <span className="text-sm font-medium">{range.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={range.percentage} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
