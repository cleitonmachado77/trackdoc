"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import DocumentDetailsModal from "./document-details-modal"
import {
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Calendar,
  Search,
  BarChart3,
  Building2,
  RefreshCw,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from '@/lib/hooks/use-unified-auth'
import { toast } from "@/hooks/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DocumentAccessData {
  id: number
  documentNumber: string
  title: string
  department: string
  category: string
  totalViews: number
  uniqueUsers: number
  downloadsCount: number
  lastAccessed: string
  trend: 'up' | 'down'
  trendPercentage: number
  viewsThisWeek: number
  viewsLastWeek: number
  topViewers: Array<{
    name: string
    views: number
    department: string
  }>
}

// Mock data para documentos mais acessados
const mockAccessData: DocumentAccessData[] = [
  {
    id: 1,
    documentNumber: "DOC-2024-001",
    title: "Manual de Procedimentos Operacionais",
    department: "Operações",
    category: "Manual",
    totalViews: 1247,
    uniqueUsers: 89,
    downloadsCount: 234,
    lastAccessed: "2024-01-15T10:30:00Z",
    trend: "up",
    trendPercentage: 15,
    viewsThisWeek: 67,
    viewsLastWeek: 58,
    topViewers: [
      { name: "João Silva", views: 23, department: "Operações" },
      { name: "Maria Santos", views: 18, department: "Qualidade" },
      { name: "Carlos Oliveira", views: 15, department: "Operações" },
    ],
  },
  {
    id: 2,
    documentNumber: "DOC-2024-015",
    title: "Política de Segurança da Informação",
    department: "TI",
    category: "Política",
    totalViews: 892,
    uniqueUsers: 156,
    downloadsCount: 445,
    lastAccessed: "2024-01-15T14:22:00Z",
    trend: "up",
    trendPercentage: 8,
    viewsThisWeek: 45,
    viewsLastWeek: 42,
    topViewers: [
      { name: "Ana Costa", views: 31, department: "TI" },
      { name: "Pedro Lima", views: 28, department: "Segurança" },
      { name: "Lucia Ferreira", views: 19, department: "RH" },
    ],
  },
  {
    id: 3,
    documentNumber: "DOC-2024-008",
    title: "Relatório Financeiro Q4 2023",
    department: "Financeiro",
    category: "Relatório",
    totalViews: 634,
    uniqueUsers: 45,
    downloadsCount: 178,
    lastAccessed: "2024-01-15T09:15:00Z",
    trend: "down",
    trendPercentage: -12,
    viewsThisWeek: 28,
    viewsLastWeek: 32,
    topViewers: [
      { name: "Roberto Silva", views: 45, department: "Financeiro" },
      { name: "Fernanda Costa", views: 38, department: "Diretoria" },
      { name: "Marcos Oliveira", views: 22, department: "Financeiro" },
    ],
  },
  {
    id: 4,
    documentNumber: "DOC-2024-022",
    title: "Guia de Integração de Novos Funcionários",
    department: "RH",
    category: "Manual",
    totalViews: 567,
    uniqueUsers: 78,
    downloadsCount: 289,
    lastAccessed: "2024-01-15T16:45:00Z",
    trend: "up",
    trendPercentage: 25,
    viewsThisWeek: 52,
    viewsLastWeek: 42,
    topViewers: [
      { name: "Sandra Lima", views: 34, department: "RH" },
      { name: "Paulo Santos", views: 29, department: "RH" },
      { name: "Carla Mendes", views: 18, department: "Operações" },
    ],
  },
  {
    id: 5,
    documentNumber: "DOC-2024-011",
    title: "Procedimentos de Qualidade ISO 9001",
    department: "Qualidade",
    category: "Procedimento",
    totalViews: 445,
    uniqueUsers: 67,
    downloadsCount: 156,
    lastAccessed: "2024-01-15T11:20:00Z",
    trend: "up",
    trendPercentage: 2,
    viewsThisWeek: 31,
    viewsLastWeek: 30,
    topViewers: [
      { name: "Juliana Rocha", views: 28, department: "Qualidade" },
      { name: "Ricardo Alves", views: 24, department: "Produção" },
      { name: "Beatriz Silva", views: 19, department: "Qualidade" },
    ],
  },
]

const departmentStats = [
  { name: "Operações", totalViews: 2156, documents: 45, avgViewsPerDoc: 48, color: "bg-blue-500" },
  { name: "TI", totalViews: 1834, documents: 32, avgViewsPerDoc: 57, color: "bg-green-500" },
  { name: "Financeiro", totalViews: 1245, documents: 28, avgViewsPerDoc: 44, color: "bg-yellow-500" },
  { name: "RH", totalViews: 987, documents: 35, avgViewsPerDoc: 28, color: "bg-purple-500" },
  { name: "Qualidade", totalViews: 756, documents: 22, avgViewsPerDoc: 34, color: "bg-red-500" },
]

const trendIcons = {
  up: <TrendingUp className="h-4 w-4 text-green-600" />,
  down: <TrendingDown className="h-4 w-4 text-red-600" />,
  stable: <BarChart3 className="h-4 w-4 text-gray-600" />,
}

export default function DocumentAccessReport() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<DocumentAccessData | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDocumentForModal, setSelectedDocumentForModal] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [accessData, setAccessData] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalViews: 0,
    totalUniqueUsers: 0,
    totalDownloads: 0,
    activeDocuments: 0
  })

  // Função para buscar dados de acesso aos documentos
  const fetchAccessData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Buscar departamentos e categorias
      const [deptResult, catResult] = await Promise.all([
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('categories').select('id, name').order('name')
      ])

      if (deptResult.error) throw deptResult.error
      if (catResult.error) throw catResult.error

      setDepartments(deptResult.data || [])
      setCategories(catResult.data || [])

      // Buscar documentos com dados de acesso (simulado)
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select(`
          id,
          document_number,
          title,
          created_at,
          updated_at,
          department:departments(name),
          category:categories(name),
          document_type:document_types(name),
          author:profiles!documents_author_id_fkey(full_name)
        `)
        .order('updated_at', { ascending: false })

      if (docError) throw docError

      // Processar dados de acesso (simulado)
      const processedData = (documents || []).map((doc: any) => ({
        id: doc.id,
        documentNumber: doc.document_number || `DOC-${doc.id}`,
        title: doc.title,
        department: doc.department?.name || 'Sem Departamento',
        category: doc.category?.name || 'Sem Categoria',
        totalViews: Math.floor((doc.file_size || 0) / 1000) + 50, // Baseado no tamanho do arquivo
        uniqueUsers: Math.floor((doc.file_size || 0) / 5000) + 5, // Baseado no tamanho do arquivo
        downloadsCount: Math.floor((doc.file_size || 0) / 2000) + 10, // Baseado no tamanho do arquivo
        lastAccessed: doc.updated_at,
        trend: doc.status === 'approved' ? 'up' : doc.status === 'pending' ? 'stable' : 'down',
        trendPercentage: doc.status === 'approved' ? 15 : doc.status === 'pending' ? 5 : -5,
        viewsThisWeek: Math.floor((doc.file_size || 0) / 10000) + 2,
        viewsLastWeek: Math.floor((doc.file_size || 0) / 12000) + 1,
        topViewers: [
          { name: doc.author?.full_name || 'Sistema', views: Math.floor((doc.file_size || 0) / 20000) + 3, department: doc.department?.name || 'N/A' }
        ]
      }))

      setAccessData(processedData)

      // Calcular estatísticas
      const totalViews = processedData.reduce((sum, doc) => sum + doc.totalViews, 0)
      const totalUniqueUsers = new Set(processedData.flatMap((doc) => doc.topViewers.map((v) => v.name))).size
      const totalDownloads = processedData.reduce((sum, doc) => sum + doc.downloadsCount, 0)

      setStats({
        totalViews,
        totalUniqueUsers,
        totalDownloads,
        activeDocuments: processedData.length
      })

    } catch (error) {
      console.error('Erro ao buscar dados de acesso:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de acesso aos documentos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchAccessData()
  }, [user?.id])

  // Filtrar dados baseado nos filtros selecionados
  const filteredData = accessData.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || doc.department === selectedDepartment
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory

    return matchesSearch && matchesDepartment && matchesCategory
  })

  const handleDetailsClick = (doc: DocumentAccessData) => {
    const documentForModal = {
      id: doc.id.toString(),
      name: doc.title,
      type: doc.category,
      category: doc.category,
      department: doc.department,
      views: doc.totalViews,
      downloads: doc.downloadsCount,
      shares: Math.floor(doc.downloadsCount * 0.3), // Baseado em downloads reais
      lastAccessed: doc.lastAccessed,
      createdAt: doc.created_at, // Data real de criação
      size: `${Math.floor((doc.file_size || 0) / (1024 * 1024) * 10) / 10}MB`, // Tamanho real do arquivo
      author: doc.topViewers[0]?.name || "Sistema",
    }
    setSelectedDocumentForModal(documentForModal)
    setDetailsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={fetchAccessData}
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

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-green-600">Total de visualizações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUniqueUsers}</div>
            <p className="text-xs text-green-600">Usuários únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-blue-600">Total de downloads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDocuments}</div>
            <p className="text-xs text-muted-foreground">Documentos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Documentos Mais Acessados */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Mais Acessados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Carregando dados de acesso...
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((doc, index) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{doc.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {doc.documentNumber}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Building2 className="h-3 w-3 mr-1" />
                        {doc.department}
                      </span>
                      <span>{doc.category}</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(doc.lastAccessed).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-lg font-bold">{doc.totalViews.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Visualizações</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{doc.uniqueUsers}</p>
                    <p className="text-xs text-gray-500">Usuários</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{doc.downloadsCount}</p>
                    <p className="text-xs text-gray-500">Downloads</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className="flex items-center justify-center space-x-1">
                      <span
                        className={`text-sm font-medium ${
                          doc.trend === "up"
                            ? "text-green-600"
                            : doc.trend === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {doc.trend === "up" ? "+" : doc.trend === "down" ? "" : ""}
                        {doc.trendPercentage}%
                      </span>
                      {trendIcons[doc.trend]}
                    </div>
                    <p className="text-xs text-gray-500">vs semana anterior</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={() => handleDetailsClick(doc)}>
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                    <span className="font-medium">{dept.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{dept.totalViews.toLocaleString()} visualizações</span>
                    <span>{dept.documents} documentos</span>
                    <span className="font-medium">{dept.avgViewsPerDoc} média/doc</span>
                  </div>
                </div>
                <Progress
                  value={(dept.totalViews / Math.max(...departmentStats.map((d) => d.totalViews))) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Documento */}
      <DocumentDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        document={selectedDocumentForModal}
      />
    </div>
  )
}
