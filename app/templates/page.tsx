"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useWorkflowTemplates, WorkflowTemplate } from "@/hooks/useWorkflowTemplates"
import { useAuth } from "@/lib/contexts/auth-context"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Eye,
  Search,
  Filter,
  MoreHorizontal
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function TemplatesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Estados para modais
  const [showTemplateDetails, setShowTemplateDetails] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  
  // Hooks
  const { 
    templates, 
    loading, 
    error,
    fetchTemplates,
    activateTemplate,
    deactivateTemplate,
    deleteTemplate
  } = useWorkflowTemplates()
  
  // Estados para ações
  const [activatingTemplate, setActivatingTemplate] = useState<string | null>(null)
  const [deactivatingTemplate, setDeactivatingTemplate] = useState<string | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null)

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user])

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || template.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // Ativar template
  const handleActivateTemplate = async (templateId: string, templateName: string) => {
    setActivatingTemplate(templateId)
    try {
      await activateTemplate(templateId)
      toast({
        title: "Template ativado",
        description: `Template "${templateName}" foi ativado com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao ativar template:', error)
      toast({
        title: "Erro",
        description: "Erro ao ativar template. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setActivatingTemplate(null)
    }
  }

  // Desativar template
  const handleDeactivateTemplate = async (templateId: string, templateName: string) => {
    setDeactivatingTemplate(templateId)
    try {
      await deactivateTemplate(templateId)
      toast({
        title: "Template desativado",
        description: `Template "${templateName}" foi desativado com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao desativar template:', error)
      toast({
        title: "Erro",
        description: "Erro ao desativar template. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeactivatingTemplate(null)
    }
  }

  // Deletar template
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    setDeletingTemplate(templateId)
    try {
      await deleteTemplate(templateId)
      toast({
        title: "Template deletado",
        description: `Template "${templateName}" foi deletado com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao deletar template:', error)
      toast({
        title: "Erro",
        description: "Erro ao deletar template. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeletingTemplate(null)
    }
  }

  // Abrir detalhes do template
  const handleViewTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateDetails(true)
  }

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />
      case 'inactive':
        return <Pause className="h-4 w-4" />
      case 'draft':
        return <Edit className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates de Fluxo</h1>
          <p className="text-gray-600">Gerencie os templates de tramitação de documentos</p>
        </div>
        
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome ou descrição do template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setFilterStatus("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== "all" 
                  ? "Tente ajustar os filtros para encontrar templates."
                  : "Não há templates de fluxo criados no momento."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <Badge className={getStatusColor(template.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(template.status)}
                          {template.status === 'active' ? 'Ativo' : 
                           template.status === 'draft' ? 'Rascunho' :
                           template.status === 'inactive' ? 'Inativo' : template.status}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span><strong>Descrição:</strong> {template.description || 'Sem descrição'}</span>
                      </div>
                      
                      <div>
                        <span><strong>Criado por:</strong> {template.created_by_user?.full_name || 'N/A'}</span>
                      </div>
                      
                      <div>
                        <span><strong>Criado em:</strong> {new Date(template.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-blue-800">
                          Etapas: {template.workflow_steps?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTemplate(template)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTemplate(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        
                        {template.status === 'draft' && (
                          <DropdownMenuItem 
                            onClick={() => handleActivateTemplate(template.id, template.name)}
                            disabled={activatingTemplate === template.id}
                          >
                            {activatingTemplate === template.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Ativar
                          </DropdownMenuItem>
                        )}
                        
                        {template.status === 'active' && (
                          <DropdownMenuItem 
                            onClick={() => handleDeactivateTemplate(template.id, template.name)}
                            disabled={deactivatingTemplate === template.id}
                          >
                            {deactivatingTemplate === template.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            ) : (
                              <Pause className="h-4 w-4 mr-2" />
                            )}
                            Desativar
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          disabled={deletingTemplate === template.id}
                          className="text-red-600"
                        >
                          {deletingTemplate === template.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Detalhes do Template */}
      <Dialog open={showTemplateDetails} onOpenChange={setShowTemplateDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Template</DialogTitle>
            <DialogDescription>
              Informações completas sobre o template de fluxo
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Nome do Template</Label>
                  <p className="text-sm text-gray-600">{selectedTemplate.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedTemplate.status)}>
                      {selectedTemplate.status === 'active' ? 'Ativo' : 
                       selectedTemplate.status === 'draft' ? 'Rascunho' :
                       selectedTemplate.status === 'inactive' ? 'Inativo' : selectedTemplate.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Descrição</Label>
                  <p className="text-sm text-gray-600">{selectedTemplate.description || 'Sem descrição'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Criado por</Label>
                  <p className="text-sm text-gray-600">{selectedTemplate.created_by_user?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Data de Criação</Label>
                  <p className="text-sm text-gray-600">{new Date(selectedTemplate.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="font-semibold">Última Atualização</Label>
                  <p className="text-sm text-gray-600">{new Date(selectedTemplate.updated_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                {selectedTemplate.status === 'draft' && (
                  <Button
                    onClick={() => {
                      handleActivateTemplate(selectedTemplate.id, selectedTemplate.name)
                      setShowTemplateDetails(false)
                    }}
                    disabled={activatingTemplate === selectedTemplate.id}
                    className="flex items-center gap-2"
                  >
                    {activatingTemplate === selectedTemplate.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Ativar Template
                  </Button>
                )}
                
                {selectedTemplate.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleDeactivateTemplate(selectedTemplate.id, selectedTemplate.name)
                      setShowTemplateDetails(false)
                    }}
                    disabled={deactivatingTemplate === selectedTemplate.id}
                    className="flex items-center gap-2"
                  >
                    {deactivatingTemplate === selectedTemplate.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                    Desativar Template
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDetails(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
