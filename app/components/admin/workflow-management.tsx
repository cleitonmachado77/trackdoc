"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  GitBranch,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  Eye,
  Calendar,
  LayoutGrid,
  List,
} from "lucide-react"

interface Workflow {
  id: number
  name: string
  description: string
  documentTypes: string[]
  steps: Array<{
    id: number
    name: string
    users: string[]
    required: boolean
  }>
  status: 'active' | 'inactive'
  documentsCount: number
}

interface WorkflowDocument {
  id: string
  title: string
  number: string
  version: string
  author: string
  sector: string
  createdAt: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  currentStep: string
}

const mockWorkflows: Workflow[] = [
  {
    id: 1,
    name: "Aprovação de Políticas",
    description: "Fluxo para aprovação de documentos de política corporativa",
    documentTypes: ["Política", "Procedimento"],
    steps: [
      { id: 1, name: "Gerente de Setor", users: ["Maria Santos"], required: true },
      { id: 2, name: "Diretoria", users: ["Carlos Oliveira"], required: true },
      { id: 3, name: "Compliance", users: ["Ana Costa"], required: false },
    ],
    status: "active",
    documentsCount: 0, // Alterado para 0
  },
  {
    id: 2,
    name: "Aprovação de Relatórios",
    description: "Fluxo simplificado para relatórios mensais",
    documentTypes: ["Relatório"],
    steps: [
      { id: 1, name: "Supervisor", users: ["João Silva"], required: true },
      { id: 2, name: "Gerente", users: ["Maria Santos"], required: true },
    ],
    status: "active",
    documentsCount: 0, // Alterado para 0
  },
  {
    id: 3,
    name: "Aprovação de Atas",
    description: "Fluxo para atas de reunião",
    documentTypes: ["Ata"],
    steps: [{ id: 1, name: "Secretário", users: ["Ana Costa"], required: true }],
    status: "inactive",
    documentsCount: 0, // Alterado para 0
  },
]

// mockWorkflowDocuments removido para garantir que não haja documentos vinculados
const mockWorkflowDocuments: Record<number, WorkflowDocument[]> = {}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
}

const documentStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const documentStatusLabels = {
  draft: "Rascunho",
  pending: "Em Aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
}

export default function WorkflowManagement() {
  const [workflows, setWorkflows] = useState(mockWorkflows)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [selectedWorkflowDocuments, setSelectedWorkflowDocuments] = useState<WorkflowDocument[]>([])
  const [selectedWorkflowName, setSelectedWorkflowName] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredWorkflows = workflows.filter((workflow) =>
    (workflow.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    inactive: workflows.filter((w) => w.status === "inactive").length,
    totalDocuments: workflows.reduce((sum, w) => sum + w.documentsCount, 0),
  }

  const handleShowWorkflowDocuments = (workflow: Workflow) => {
    const documents = mockWorkflowDocuments[workflow.id] || []
    setSelectedWorkflowDocuments(documents)
    setSelectedWorkflowName(workflow.name)
    setShowDocumentsModal(true)
  }

  const handleSaveWorkflow = (workflowData: Partial<Workflow>) => {
    if (workflowData.id) {
      setWorkflows((prevWorkflows) =>
        prevWorkflows.map((workflow) =>
          workflow.id === workflowData.id ? { ...workflow, ...workflowData } : workflow,
        ),
      )
    } else {
      const newWorkflow: Workflow = {
        id: Date.now(),
        name: workflowData.name || '',
        description: workflowData.description || '',
        documentTypes: workflowData.documentTypes || [],
        steps: workflowData.steps || [],
        status: workflowData.status || 'active',
        documentsCount: 0,
      }
      setWorkflows((prevWorkflows) => [...prevWorkflows, newWorkflow])
    }
    setShowWorkflowModal(false)
    setSelectedWorkflow(null)
  }

  const handleDeleteWorkflow = () => {
    if (workflowToDelete) {
      setWorkflows((prevWorkflows) => prevWorkflows.filter((workflow) => workflow.id !== workflowToDelete.id))
      setShowDeleteConfirm(false)
      setWorkflowToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fluxos</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxos Inativos</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos em Fluxo</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar fluxos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Dialog open={showWorkflowModal} onOpenChange={setShowWorkflowModal}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedWorkflow(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Fluxo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedWorkflow ? "Editar Fluxo" : "Novo Fluxo de Aprovação"}</DialogTitle>
                  </DialogHeader>
                  <WorkflowForm workflow={selectedWorkflow} onSave={handleSaveWorkflow} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={statusColors[workflow.status]}>
                      {workflow.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWorkflow(workflow)
                            setShowWorkflowModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setWorkflowToDelete(workflow)
                            setShowDeleteConfirm(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Tipos de Documento:</p>
                    <div className="flex flex-wrap gap-2">
                      {workflow.documentTypes.map((type) => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Fluxo de Aprovação:</p>
                    <div className="space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium">{step.name}</span>
                          {step.required && <Badge variant="secondary">Obrigatório</Badge>}
                          {index < workflow.steps.length - 1 && <ArrowRight className="h-3 w-3 text-gray-400" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                    <button
                      onClick={() => handleShowWorkflowDocuments(workflow)}
                      className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      {workflow.documentsCount} documentos usando este fluxo
                    </button>
                    <span>{workflow.steps.length} etapas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredWorkflows.map((workflow, index) => (
                <div key={workflow.id} className={`p-4 ${index !== filteredWorkflows.length - 1 ? "border-b" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <GitBranch className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <h3 className="font-medium text-lg">{workflow.name}</h3>
                          <Badge className={statusColors[workflow.status]} variant="secondary">
                            {workflow.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 mt-1">
                          <span>{workflow.steps.length} etapas</span>
                          <span>{workflow.documentsCount} documentos</span>
                          <span>Tipos: {workflow.documentTypes.join(", ")}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWorkflow(workflow)
                            setShowWorkflowModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setWorkflowToDelete(workflow)
                            setShowDeleteConfirm(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos - {selectedWorkflowName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWorkflowDocuments.length > 0 ? (
              <div className="space-y-3">
                {selectedWorkflowDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{doc.number}</span>
                          <span>v{doc.version}</span>
                          <span>{doc.author}</span>
                          <span>{doc.sector}</span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {doc.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <Badge className={documentStatusColors[doc.status]}>{documentStatusLabels[doc.status]}</Badge>
                        <p className="text-xs text-gray-500 mt-1">Etapa: {doc.currentStep}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum documento encontrado para este fluxo</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este fluxo de aprovação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente o fluxo{" "}
              <span className="font-semibold">{workflowToDelete?.name}</span> e todos os seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteWorkflow} className="bg-red-600 hover:bg-red-700">
              Excluir
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WorkflowForm({ workflow, onSave }: { workflow: Workflow | null; onSave: (data: Partial<Workflow>) => void }) {
  const [formData, setFormData] = useState({
    name: workflow?.name || "",
    description: workflow?.description || "",
    documentTypes: workflow?.documentTypes || [],
    steps: workflow?.steps || [{ id: 1, name: "", users: [], required: true }],
    status: workflow?.status || "active",
  })

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { id: Date.now(), name: "", users: [], required: true }],
    }))
  }

  const removeStep = (stepId: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId),
    }))
  }

  const updateStep = (stepId: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === stepId ? { ...step, [field]: value } : step)),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Fluxo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Aprovação de Políticas"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: 'active' | 'inactive') => setFormData((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o propósito deste fluxo de aprovação"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipos de Documento</Label>
        <div className="flex flex-wrap gap-2">
          {["Política", "Procedimento", "Relatório", "Ata", "Manual"].map((type) => (
            <Button
              key={type}
              variant={formData.documentTypes.includes(type) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  documentTypes: prev.documentTypes.includes(type)
                    ? prev.documentTypes.filter((t) => t !== type)
                    : [...prev.documentTypes, type],
                }))
              }}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Etapas de Aprovação</Label>
          <Button variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etapa
          </Button>
        </div>

        <div className="space-y-4">
          {formData.steps.map((step, index) => (
            <Card key={step.id}>
              <CardContent className="pt-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome da Etapa</Label>
                        <Input
                          value={step.name}
                          onChange={(e) => updateStep(step.id, "name", e.target.value)}
                          placeholder="Ex: Aprovação do Gerente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Aprovadores</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar usuários" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="joao">João Silva</SelectItem>
                            <SelectItem value="maria">Maria Santos</SelectItem>
                            <SelectItem value="carlos">Carlos Oliveira</SelectItem>
                            <SelectItem value="ana">Ana Costa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={step.required}
                          onCheckedChange={(checked) => updateStep(step.id, "required", checked)}
                        />
                        <Label>Aprovação obrigatória</Label>
                      </div>
                      {formData.steps.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={() => {}}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(formData)}>Salvar Fluxo</Button>
      </div>
    </div>
  )
}
