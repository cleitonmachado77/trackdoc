"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useDepartments, type Department } from "@/hooks/use-departments"
import { useUsers, type User } from "@/hooks/use-users"
import { DepartmentEmployeesModal } from "./department-employees-modal"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  Users,
  FileText,
  CheckCircle,
  Clock,
  Grid3X3,
  List,
  Loader2,
  AlertTriangle,
} from "lucide-react"


// Definições de tipos
interface DepartmentFormData {
  name: string
  description: string
  manager_id: string
  status: "active" | "inactive"
}

interface DepartmentStats {
  total: number
  active: number
  inactive: number
  totalEmployees: number
  totalDocuments: number
}

type ViewMode = "grid" | "list"
type StatusFilter = "all" | "active" | "inactive"

// Constantes
const STATUS_COLORS = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-red-100 text-red-800 border-red-200",
} as const

const STATUS_LABELS = {
  active: "Ativo",
  inactive: "Inativo",
} as const

const DEPARTMENT_COLOR = "#3b82f6" // Azul padrão para departamentos

// Componente principal
export default function DepartmentManagement() {
  const { toast } = useToast()
  const { 
    departments, 
    loading: departmentsLoading, 
    error: departmentsError, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment, 
    refetch 
  } = useDepartments()
  const { users, loading: usersLoading } = useUsers()
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Departamentos filtrados (memoizado para performance)
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.manager_name || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || dept.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [departments, searchTerm, statusFilter])

  // Estatísticas (memoizadas para performance)
  const stats: DepartmentStats = useMemo(() => ({
    total: departments.length,
    active: departments.filter((d) => d.status === "active").length,
    inactive: departments.filter((d) => d.status === "inactive").length,
    totalEmployees: departments.reduce((sum, d) => sum + (d.user_count || 0), 0),
    totalDocuments: departments.reduce((sum, d) => sum + (d.document_count || 0), 0),
  }), [departments])

  // Handlers
  const handleSaveDepartment = useCallback(async (departmentData: DepartmentFormData) => {
    if (!departmentData.manager_id) {
      toast({
        title: "Gerente obrigatório",
        description: "É necessário selecionar um gerente para o departamento.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (selectedDepartment) {
        await updateDepartment(selectedDepartment.id, {
          name: departmentData.name,
          description: departmentData.description,
          manager_id: departmentData.manager_id,
          status: departmentData.status,
        })
        toast({
          title: "Departamento atualizado",
          description: "O departamento foi atualizado com sucesso.",
        })
      } else {
        await createDepartment({
          name: departmentData.name,
          description: departmentData.description,
          manager_id: departmentData.manager_id,
          status: departmentData.status,
        })
        toast({
          title: "Departamento criado",
          description: "O departamento foi criado com sucesso.",
        })
      }
      
      setShowDepartmentModal(false)
      setSelectedDepartment(null)
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o departamento.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedDepartment, updateDepartment, createDepartment, toast])

  const handleDeleteDepartment = useCallback(async () => {
    if (!departmentToDelete) return

    // Verificar se há documentos vinculados ANTES de tentar excluir
    if (departmentToDelete.document_count && departmentToDelete.document_count > 0) {
      setShowDeleteConfirm(false)
      setDepartmentToDelete(null)
      toast({
        title: "Não é possível excluir",
        description: `Este departamento possui ${departmentToDelete.document_count} documento(s) vinculado(s). Remova ou reatribua os documentos antes de excluir o departamento.`,
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      await deleteDepartment(departmentToDelete.id)
      setShowDeleteConfirm(false)
      setDepartmentToDelete(null)
      toast({
        title: "Departamento excluído",
        description: "O departamento foi excluído com sucesso.",
      })
    } catch (error: unknown) {
      setShowDeleteConfirm(false)
      setDepartmentToDelete(null)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o departamento.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }, [departmentToDelete, deleteDepartment, toast])

  const handleEditDepartment = useCallback((department: Department) => {
    setSelectedDepartment(department)
    setShowDepartmentModal(true)
  }, [])

  const handleNewDepartment = useCallback(() => {
    setSelectedDepartment(null)
    setShowDepartmentModal(true)
  }, [])

  const handleDeleteRequest = useCallback((department: Department) => {
    setDepartmentToDelete(department)
    setShowDeleteConfirm(true)
  }, [])

  // Estados de loading e erro
  if (departmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 font-medium">Carregando departamentos...</span>
      </div>
    )
  }

  if (departmentsError) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 p-3 w-fit rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar departamentos</h3>
        <p className="text-red-600 mb-6">{departmentsError}</p>
        <Button onClick={refetch} className="bg-blue-600 hover:bg-blue-700">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-start mb-6">
        <h1 className="text-3xl font-bold text-foreground">Departamentos</h1>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500">Departamentos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
            <p className="text-xs text-gray-500">Em operação</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inativos</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.inactive}</div>
            <p className="text-xs text-gray-500">Desativados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.totalEmployees}</div>
            <p className="text-xs text-gray-500">Total geral</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.totalDocuments}</div>
            <p className="text-xs text-gray-500">Criados</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou gerente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleNewDepartment} className="w-full lg:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Departamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo Principal */}
      {viewMode === "list" ? (
        <DepartmentsListView 
          departments={filteredDepartments}
          onEdit={handleEditDepartment}
          onDelete={handleDeleteRequest}
        />
      ) : (
        <DepartmentsGridView 
          departments={filteredDepartments}
          onEdit={handleEditDepartment}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Modal de formulário */}
      <Dialog 
        open={showDepartmentModal} 
        onOpenChange={(open) => {
          setShowDepartmentModal(open)
          if (!open) {
            setSelectedDepartment(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment ? "Editar Departamento" : "Novo Departamento"}
            </DialogTitle>
          </DialogHeader>
          <DepartmentForm
            key={selectedDepartment?.id || 'new'}
            department={selectedDepartment}
            users={users}
            usersLoading={usersLoading}
            onSave={handleSaveDepartment}
            onCancel={() => {
              setShowDepartmentModal(false)
              setSelectedDepartment(null)
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para exclusão */}
      {showDeleteConfirm && departmentToDelete && (
        <Dialog 
          open={showDeleteConfirm} 
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setShowDeleteConfirm(false)
              setDepartmentToDelete(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {departmentToDelete.document_count && departmentToDelete.document_count > 0 
                  ? "Não é possível excluir este departamento" 
                  : "Confirmar exclusão"}
              </DialogTitle>
              <DialogDescription>
                {departmentToDelete.document_count && departmentToDelete.document_count > 0 ? (
                  <>
                    O departamento <span className="font-semibold">"{departmentToDelete.name}"</span> possui{" "}
                    <span className="font-semibold text-red-600">{departmentToDelete.document_count} documento(s) vinculado(s)</span>.
                    <br /><br />
                    Para excluir este departamento, você precisa primeiro remover ou reatribuir todos os documentos vinculados a ele.
                  </>
                ) : (
                  <>
                    Tem certeza que deseja excluir o departamento{" "}
                    <span className="font-semibold">"{departmentToDelete.name || 'Desconhecido'}"</span>?
                    <br /><br />
                    Esta ação não pode ser desfeita e removerá permanentemente:
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>O departamento e suas configurações</li>
                      <li>Vínculos com funcionários</li>
                      <li>Histórico de associações</li>
                    </ul>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDepartmentToDelete(null)
                }}
                disabled={isDeleting}
              >
                {departmentToDelete.document_count && departmentToDelete.document_count > 0 ? "Fechar" : "Cancelar"}
              </Button>
              {(!departmentToDelete.document_count || departmentToDelete.document_count === 0) && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteDepartment}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir departamento'
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Interfaces para props dos componentes
interface DepartmentsViewProps {
  departments: Department[]
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
}

// Componente para visualização em lista
function DepartmentsListView({ departments, onEdit, onDelete }: DepartmentsViewProps) {
  if (departments.length === 0) {
    return <EmptyDepartmentsState />
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {departments.map((department) => (
            <div key={department.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <DepartmentAvatar name={department.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {department.name}
                      </h3>
                      <DepartmentStatusBadge status={department.status} />
                    </div>
                    
                    {department.description && (
                      <p 
                        className="text-sm text-gray-600 mb-3 leading-relaxed overflow-hidden"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {department.description}
                      </p>
                    )}
                    
                    <DepartmentInfo department={department} />
                  </div>
                </div>
                
                <DepartmentActions 
                  department={department}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para visualização em grid
function DepartmentsGridView({ departments, onEdit, onDelete }: DepartmentsViewProps) {
  if (departments.length === 0) {
    return <EmptyDepartmentsState />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {departments.map((department) => (
        <Card key={department.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3 mb-3">
              <DepartmentAvatar name={department.name} />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-foreground truncate">
                  {department.name}
                </CardTitle>
                <DepartmentStatusBadge status={department.status} />
              </div>
            </div>
            
            {department.description && (
              <p 
                className="text-sm text-muted-foreground leading-relaxed overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {department.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col justify-between space-y-4">
            <DepartmentManagerInfo department={department} />
            <DepartmentStatsGrid department={department} />
            <DepartmentActions 
              department={department}
              onEdit={onEdit}
              onDelete={onDelete}
              layout="card"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Subcomponentes reutilizáveis
function DepartmentAvatar({ name }: { name: string }) {
  const initials = name.substring(0, 2).toUpperCase()
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"
      style={{ backgroundColor: DEPARTMENT_COLOR }}
    >
      {initials}
    </div>
  )
}

function DepartmentStatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <Badge className={`${STATUS_COLORS[status]} text-xs font-medium mt-1`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

function DepartmentInfo({ department }: { department: Department }) {
  const managerName = department.manager_name
  
  return (
    <div className="flex items-center space-x-6 text-sm text-gray-500">
      {managerName && (
        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
              {managerName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-blue-700 font-medium truncate">{managerName}</span>
        </div>
      )}
      <div className="flex items-center space-x-1 text-gray-600">
        <Users className="h-4 w-4" />
        <span className="font-medium">{department.user_count || 0} funcionários</span>
      </div>
      <div className="flex items-center space-x-1 text-gray-600">
        <FileText className="h-4 w-4" />
        <span className="font-medium">{department.document_count || 0} documentos</span>
      </div>
    </div>
  )
}

function DepartmentManagerInfo({ department }: { department: Department }) {
  const managerName = department.manager_name
  
  if (!managerName) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <div>
          <p className="text-sm font-medium text-yellow-800">Sem gerente atribuído</p>
          <p className="text-xs text-yellow-600">Este departamento precisa de um gerente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <Avatar className="h-9 w-9 ring-2 ring-white">
        <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
          {managerName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{managerName}</p>
        <p className="text-xs text-blue-600 font-medium">Gerente</p>
      </div>
    </div>
  )
}

function DepartmentStatsGrid({ department }: { department: Department }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="text-center p-3 bg-accent rounded-lg border">
        <p className="text-xl font-bold text-primary">{department.user_count || 0}</p>
        <p className="text-xs text-muted-foreground font-medium">Funcionários</p>
      </div>
      <div className="text-center p-3 bg-accent rounded-lg border">
        <p className="text-xl font-bold text-success">{department.document_count || 0}</p>
        <p className="text-xs text-muted-foreground font-medium">Documentos</p>
      </div>
    </div>
  )
}

interface DepartmentActionsProps {
  department: Department
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
  layout?: "default" | "card"
}

function DepartmentActions({ 
  department, 
  onEdit, 
  onDelete,
  layout = "default"
}: DepartmentActionsProps) {
  const isCardLayout = layout === "card"
  
  return (
    <div className={`flex items-center ${isCardLayout ? 'justify-between pt-2 border-t border-border' : 'space-x-2 flex-shrink-0 ml-4'}`}>
      <DepartmentEmployeesModal
        departmentId={department.id}
        departmentName={department.name}
        trigger={
          <Button variant="outline" size="sm" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Funcionários
          </Button>
        }
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(department)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => onDelete(department)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function EmptyDepartmentsState() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <div className="mx-auto mb-4 p-3 w-fit rounded-full bg-gray-50">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum departamento encontrado</h3>
        <p className="text-gray-500 mb-4">
          Não há departamentos que correspondam aos seus critérios de busca.
        </p>
        <p className="text-sm text-gray-400">
          Tente ajustar os filtros ou criar um novo departamento.
        </p>
      </CardContent>
    </Card>
  )
}

// Interface para props do formulário
interface DepartmentFormProps {
  department: Department | null
  users: User[]
  usersLoading: boolean
  onSave: (data: DepartmentFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

// Componente de formulário separado
function DepartmentForm({ 
  department, 
  users, 
  usersLoading, 
  onSave, 
  onCancel, 
  isSubmitting 
}: DepartmentFormProps) {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: "",
    manager_id: "",
    status: "active",
  })

  // Atualizar form data quando department mudar
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || "",
        description: department.description || "",
        manager_id: department.manager_id || "",
        status: department.status || "active",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        manager_id: "",
        status: "active",
      })
    }
  }, [department])

  const handleInputChange = useCallback((field: keyof DepartmentFormData) => 
    (value: string | boolean) => {
      const newValue = field === 'status' ? (value ? 'active' : 'inactive') : value
      
      setFormData(prev => ({
        ...prev,
        [field]: newValue
      }))
    }, []
  )

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave(formData)
  }, [formData, onSave])

  const isFormValid = useMemo(() => {
    return !!(formData.name.trim() && formData.manager_id)
  }, [formData.name, formData.manager_id])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Departamento *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name')(e.target.value)}
          placeholder="Ex: Tecnologia da Informação"
          required
          maxLength={100}
        />
        {formData.name.length > 80 && (
          <p className="text-xs text-yellow-600">
            {formData.name.length}/100 caracteres
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description')(e.target.value)}
          placeholder="Descreva as responsabilidades e função do departamento"
          rows={3}
          maxLength={500}
        />
        {formData.description.length > 400 && (
          <p className="text-xs text-yellow-600">
            {formData.description.length}/500 caracteres
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager">Gerente *</Label>
        <Select 
          key={`manager-${department?.id || 'new'}`}
          value={formData.manager_id || undefined} 
          onValueChange={handleInputChange('manager_id')}
          disabled={usersLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={usersLoading ? "Carregando..." : "Selecione um gerente"} />
          </SelectTrigger>
          <SelectContent>
            {usersLoading ? (
              <SelectItem value="loading" disabled>
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando usuários...</span>
                </div>
              </SelectItem>
            ) : users.length > 0 ? (
              users.map((user: User) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex flex-col">
                    <span>{user.full_name}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-users" disabled>
                Nenhum usuário disponível
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {!formData.manager_id && (
          <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Gerente obrigatório</p>
              <p className="mt-1">É necessário atribuir um gerente ao departamento.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          key={`status-${formData.status}`}
          checked={formData.status === "active"}
          onCheckedChange={(checked) => {
            // Remover foco do switch
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur()
            }
            handleInputChange('status')(checked)
          }}
          disabled={isSubmitting}
        />
        <Label className="text-sm">Departamento ativo</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !isFormValid}
          className="min-w-[120px]"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {department ? "Atualizar" : "Criar"} Departamento
        </Button>
      </div>
    </form>
  )
}