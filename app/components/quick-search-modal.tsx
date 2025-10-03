"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  FileText,
  Users,
  GitBranch,
  Building2,
  Clock,
  TrendingUp,
  Filter,
  X,
  Eye,
  Edit,
  Calendar,
  Tag,
  ArrowRight,
} from "lucide-react"

// Mock data para busca
const mockSearchData: SearchResults = {
  documents: [
    {
      id: 1,
      type: "document",
      number: "DOC-2024-001",
      title: "Política de Segurança da Informação",
      author: "João Silva",
      version: "2.1",
      status: "approved",
      sector: "TI",
      docType: "Política",
      createdAt: "2024-01-15",
      tags: ["segurança", "política", "TI"],
    },
    {
      id: 2,
      type: "document",
      number: "DOC-2024-002",
      title: "Relatório Mensal de Vendas",
      author: "Maria Santos",
      version: "1.0",
      status: "pending",
      sector: "Vendas",
      docType: "Relatório",
      createdAt: "2024-01-18",
      tags: ["vendas", "relatório", "mensal"],
    },
    {
      id: 3,
      type: "document",
      number: "DOC-2024-003",
      title: "Procedimento de Backup",
      author: "João Silva",
      version: "1.2",
      status: "approved",
      sector: "TI",
      docType: "Procedimento",
      createdAt: "2024-01-10",
      tags: ["backup", "procedimento", "TI"],
    },
  ],
  users: [
    {
      id: 1,
      type: "user",
      name: "João Silva",
      email: "joao.silva@empresa.com",
      role: "Administrador",
      department: "TI",
      status: "active",
      avatar: "JS",
    },
    {
      id: 2,
      type: "user",
      name: "Maria Santos",
      email: "maria.santos@empresa.com",
      role: "Gerente",
      department: "Vendas",
      status: "active",
      avatar: "MS",
    },
    {
      id: 3,
      type: "user",
      name: "Ana Costa",
      email: "ana.costa@empresa.com",
      role: "Aprovador",
      department: "RH",
      status: "active",
      avatar: "AC",
    },
  ],
  workflows: [
    {
      id: 1,
      type: "workflow",
      name: "Aprovação de Políticas",
      description: "Fluxo para aprovação de documentos de política corporativa",
      status: "active",
      documentsCount: 15,
      steps: 3,
    },
    {
      id: 2,
      type: "workflow",
      name: "Aprovação de Relatórios",
      description: "Fluxo simplificado para relatórios mensais",
      status: "active",
      documentsCount: 8,
      steps: 2,
    },
  ],
  departments: [
    {
      id: 1,
      type: "department",
      name: "Tecnologia da Informação",
      shortName: "TI",
      manager: "João Silva",
      employeeCount: 15,
      documentsCount: 45,
      status: "active",
    },
    {
      id: 2,
      type: "department",
      name: "Vendas e Marketing",
      shortName: "Vendas",
      manager: "Maria Santos",
      employeeCount: 22,
      documentsCount: 38,
      status: "active",
    },
  ],
}

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  pending: "Em Aprovação",
  draft: "Rascunho",
  rejected: "Rejeitado",
  active: "Ativo",
  inactive: "Inativo",
}

const recentSearches = ["política segurança", "relatório vendas", "João Silva", "aprovação", "TI"]

const popularSearches = [
  "documentos pendentes",
  "políticas aprovadas",
  "usuários ativos",
  "fluxos de aprovação",
  "relatórios mensais",
]

interface SearchDocument {
  id: number
  type: string
  number: string
  title: string
  author: string
  version: string
  status: string
  sector: string
  docType: string
  createdAt: string
  tags: string[]
}

interface SearchUser {
  id: number
  type: string
  name: string
  email: string
  role: string
  department: string
  status: string
  avatar: string
}

interface SearchWorkflow {
  id: number
  type: string
  name: string
  description: string
  status: string
  documentsCount: number
  steps: number
}

interface SearchDepartment {
  id: number
  type: string
  name: string
  shortName: string
  manager: string
  employeeCount: number
  documentsCount: number
  status: string
}

interface SearchResults {
  documents: SearchDocument[]
  users: SearchUser[]
  workflows: SearchWorkflow[]
  departments: SearchDepartment[]
}

interface QuickSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function QuickSearchModal({ open, onOpenChange }: QuickSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [searchResults, setSearchResults] = useState<SearchResults>({
    documents: [],
    users: [],
    workflows: [],
    departments: [],
  })
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Simular busca
  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsSearching(true)
      const timer = setTimeout(() => {
        const results: SearchResults = {
          documents: mockSearchData.documents.filter(
            (item) =>
              item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
          ),
          users: mockSearchData.users.filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.department.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
          workflows: mockSearchData.workflows.filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
          departments: mockSearchData.departments.filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.manager.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
        }
        setSearchResults(results)
        setIsSearching(false)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setSearchResults({
        documents: [],
        users: [],
        workflows: [],
        departments: [],
      })
    }
  }, [searchTerm])

  const getTotalResults = () => {
    return (
      searchResults.documents.length +
      searchResults.users.length +
      searchResults.workflows.length +
      searchResults.departments.length
    )
  }

  const handleQuickSearch = (term: string) => {
    setSearchTerm(term)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchResults({
      documents: [],
      users: [],
      workflows: [],
      departments: [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Busca Rápida</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search Input */}
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar documentos, usuários, fluxos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20 h-12 text-lg"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {searchTerm && (
                  <Button variant="ghost" size="sm" onClick={clearSearch}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Search Suggestions */}
            {!searchTerm && (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Buscas Recentes</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSearch(term)}
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Buscas Populares</p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSearch(term)}
                        className="text-xs"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="px-6 py-2 border-b">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all" className="text-xs">
                      Todos ({getTotalResults()})
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs">
                      Documentos ({searchResults.documents.length})
                    </TabsTrigger>
                    <TabsTrigger value="users" className="text-xs">
                      Usuários ({searchResults.users.length})
                    </TabsTrigger>
                    <TabsTrigger value="workflows" className="text-xs">
                      Fluxos ({searchResults.workflows.length})
                    </TabsTrigger>
                    <TabsTrigger value="departments" className="text-xs">
                      Departamentos ({searchResults.departments.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Search className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Buscando...</p>
                      </div>
                    </div>
                  ) : getTotalResults() === 0 && searchTerm ? (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Nenhum resultado encontrado</p>
                      <p className="text-gray-400 text-sm">Tente usar termos diferentes ou verifique a ortografia</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <TabsContent value="all" className="mt-0 space-y-6">
                        {searchResults.documents.length > 0 && (
                          <SearchSection title="Documentos" icon={FileText} items={searchResults.documents} />
                        )}
                        {searchResults.users.length > 0 && (
                          <SearchSection title="Usuários" icon={Users} items={searchResults.users} />
                        )}
                        {searchResults.workflows.length > 0 && (
                          <SearchSection title="Fluxos de Aprovação" icon={GitBranch} items={searchResults.workflows} />
                        )}
                        {searchResults.departments.length > 0 && (
                          <SearchSection title="Departamentos" icon={Building2} items={searchResults.departments} />
                        )}
                      </TabsContent>

                      <TabsContent value="documents" className="mt-0">
                        <SearchSection title="Documentos" icon={FileText} items={searchResults.documents} />
                      </TabsContent>

                      <TabsContent value="users" className="mt-0">
                        <SearchSection title="Usuários" icon={Users} items={searchResults.users} />
                      </TabsContent>

                      <TabsContent value="workflows" className="mt-0">
                        <SearchSection title="Fluxos de Aprovação" icon={GitBranch} items={searchResults.workflows} />
                      </TabsContent>

                      <TabsContent value="departments" className="mt-0">
                        <SearchSection title="Departamentos" icon={Building2} items={searchResults.departments} />
                      </TabsContent>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SearchSection({ title, icon: Icon, items }: { title: string; icon: React.ComponentType<{ className?: string }>; items: any[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <SearchResultItem key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  )
}

function SearchResultItem({ item }: { item: SearchDocument | SearchUser | SearchWorkflow | SearchDepartment }) {
  // Type guard para verificar se é um documento
  const isDocument = (item: any): item is SearchDocument => item.type === 'document'
  
  // Type guard para verificar se é um usuário
  const isUser = (item: any): item is SearchUser => item.type === 'user'
  
  // Type guard para verificar se é um workflow
  const isWorkflow = (item: any): item is SearchWorkflow => item.type === 'workflow'
  
  // Type guard para verificar se é um departamento
  const isDepartment = (item: any): item is SearchDepartment => item.type === 'department'

  const renderDocumentItem = () => {
    if (!isDocument(item)) return null
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                  <span>{item.number}</span>
                  <span>v{item.version}</span>
                  <span>{item.author}</span>
                  <span>{item.sector}</span>
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {item.createdAt}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderUserItem = () => {
    if (!isUser(item)) return null
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{item.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{item.role}</Badge>
                  <span className="text-sm text-gray-500">{item.department}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWorkflowItem = () => {
    if (!isWorkflow(item)) return null
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GitBranch className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                  <span>{item.documentsCount} documentos</span>
                  <span>{item.steps} etapas</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderDepartmentItem = () => {
    if (!isDepartment(item)) return null
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">Gerente: {item.manager}</p>
                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                  <span>{item.employeeCount} funcionários</span>
                  <span>{item.documentsCount} documentos</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  switch (item.type) {
    case "document":
      return renderDocumentItem()
    case "user":
      return renderUserItem()
    case "workflow":
      return renderWorkflowItem()
    case "department":
      return renderDepartmentItem()
    default:
      return null
  }
}
