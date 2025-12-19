"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useCategories, Category } from "@/hooks/use-categories"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  FileText,
  CheckCircle,
  Clock,
  Grid3X3,
  List,
  Loader2,
} from "lucide-react"



// Cor padrão para categorias
const DEFAULT_CATEGORY_COLOR = "#3b82f6"

const statusColors = {
  active: "bg-success/20 text-success",
  inactive: "bg-destructive/20 text-destructive",
}

export default function CategoryManagement() {
  const { toast } = useToast()
  const { categories, loading, error, createCategory, updateCategory, deleteCategory, refetch } = useCategories()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // "grid" ou "list"
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || category.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [categories, searchTerm, statusFilter])

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter((c) => c.status === "active").length,
    inactive: categories.filter((c) => c.status === "inactive").length,
    totalDocuments: categories.reduce((sum, c) => sum + (c.document_count || 0), 0),
  }), [categories])

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    try {
      setIsSubmitting(true)
      
      if (selectedCategory) {
        // Editar categoria existente
        await updateCategory(selectedCategory.id, {
          name: categoryData.name,
          description: categoryData.description,
          color: DEFAULT_CATEGORY_COLOR,
          status: categoryData.status,
        })
        toast({
          title: "Categoria atualizada",
          description: "A categoria foi atualizada com sucesso.",
        })
      } else {
        // Criar nova categoria
        await createCategory({
          name: categoryData.name,
          description: categoryData.description,
          color: DEFAULT_CATEGORY_COLOR,
          status: categoryData.status,
        })
        toast({
          title: "Categoria criada",
          description: "A categoria foi criada com sucesso.",
        })
      }
      
      setShowCategoryModal(false)
      setSelectedCategory(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar a categoria.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    console.log('[DEBUG] handleDeleteCategory iniciado', { categoryToDelete })
    if (!categoryToDelete) return
    
    // Verificar se há documentos vinculados ANTES de tentar excluir
    if (categoryToDelete.document_count && categoryToDelete.document_count > 0) {
      console.log('[DEBUG] Categoria tem documentos vinculados, fechando modal')
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      console.log('[DEBUG] Mostrando toast de erro')
      toast({
        title: "Não é possível excluir",
        description: `Esta categoria possui ${categoryToDelete.document_count} documento(s) vinculado(s). Remova ou reatribua os documentos antes de excluir a categoria.`,
        variant: "destructive",
      })
      console.log('[DEBUG] handleDeleteCategory finalizado (com documentos)')
      return
    }
    
    console.log('[DEBUG] Iniciando exclusão')
    setIsDeleting(true)
    try {
      console.log('[DEBUG] Chamando deleteCategory')
      await deleteCategory(categoryToDelete.id)
      console.log('[DEBUG] deleteCategory concluído, fechando modal')
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      console.log('[DEBUG] Mostrando toast de sucesso')
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      })
      console.log('[DEBUG] handleDeleteCategory finalizado (sucesso)')
    } catch (error) {
      console.log('[DEBUG] Erro ao excluir:', error)
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      })
      console.log('[DEBUG] handleDeleteCategory finalizado (erro)')
    } finally {
      console.log('[DEBUG] Resetando isDeleting')
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando categorias...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Erro ao carregar categorias: {error}</p>
        <Button onClick={refetch}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-start mb-6">
        <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Categorias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Desativadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Categorizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>
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
            <Dialog 
              open={showCategoryModal} 
              onOpenChange={(open) => {
                setShowCategoryModal(open)
                if (!open) {
                  setSelectedCategory(null)
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedCategory(null)} disabled={isSubmitting || isDeleting}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                  <DialogDescription>
                    {selectedCategory 
                      ? "Edite as informações da categoria." 
                      : "Crie uma nova categoria para organizar seus documentos."}
                  </DialogDescription>
                </DialogHeader>
                <CategoryForm
                  category={selectedCategory}
                  onSave={handleSaveCategory}
                  onCancel={() => {
                    setShowCategoryModal(false)
                    setSelectedCategory(null)
                  }}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {viewMode === "list" ? (
        /* Lista de Categorias */
        <Card>
          <CardContent className="p-0">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 p-3 w-fit rounded-full bg-gray-50">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "Não há categorias que correspondam aos seus critérios de busca."
                    : "Você ainda não criou nenhuma categoria."}
                </p>
                <p className="text-sm text-gray-400">
                  {searchTerm 
                    ? "Tente ajustar os filtros ou criar uma nova categoria."
                    : "Clique no botão 'Nova Categoria' para começar."}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: DEFAULT_CATEGORY_COLOR }}
                        >
                          {category.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <Badge className={statusColors[category.status]}>
                              {category.status === "active" ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>{category.document_count || 0} documentos</span>
                            </div>

                          </div>
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
                              setSelectedCategory(category)
                              setShowCategoryModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setCategoryToDelete(category)
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
            )}
          </CardContent>
        </Card>
      ) : (
        /* Grid de Categorias */
        filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mx-auto mb-4 p-3 w-fit rounded-full bg-gray-50">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Não há categorias que correspondam aos seus critérios de busca."
                  : "Você ainda não criou nenhuma categoria."}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm 
                  ? "Tente ajustar os filtros ou criar uma nova categoria."
                  : "Clique no botão 'Nova Categoria' para começar."}
              </p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:col-span-3 xl:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: DEFAULT_CATEGORY_COLOR }}
                      >
                        {category.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <p className="text-sm text-gray-500">{category.name.substring(0, 10)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[category.status]}>
                        {category.status === "active" ? "Ativa" : "Inativa"}
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
                              setSelectedCategory(category)
                              setShowCategoryModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setCategoryToDelete(category)
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
                    <p className="text-sm text-gray-600">{category.description}</p>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{category.document_count || 0}</p>
                        <p className="text-xs text-gray-500">Documentos</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: DEFAULT_CATEGORY_COLOR }}
                          />
                          <p className="text-xs text-gray-500">Padrão</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
        )
      )}

      {/* Dialog de Confirmação */}
      {showDeleteConfirm && categoryToDelete && (
        <Dialog 
          open={showDeleteConfirm} 
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setShowDeleteConfirm(false)
              setCategoryToDelete(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {categoryToDelete.document_count && categoryToDelete.document_count > 0 
                  ? "Não é possível excluir esta categoria" 
                  : "Tem certeza que deseja excluir esta categoria?"}
              </DialogTitle>
              <DialogDescription>
                {categoryToDelete.document_count && categoryToDelete.document_count > 0 ? (
                  <>
                    A categoria <span className="font-semibold">{categoryToDelete.name}</span> possui{" "}
                    <span className="font-semibold text-red-600">{categoryToDelete.document_count} documento(s) vinculado(s)</span>.
                    <br /><br />
                    Para excluir esta categoria, você precisa primeiro remover ou reatribuir todos os documentos vinculados a ela.
                  </>
                ) : (
                  <>
                    Esta ação não pode ser desfeita. Isso removerá permanentemente a categoria{" "}
                    <span className="font-semibold">{categoryToDelete.name}</span> e todos os seus dados associados.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setCategoryToDelete(null)
                }}
                disabled={isDeleting}
              >
                {categoryToDelete.document_count && categoryToDelete.document_count > 0 ? "Fechar" : "Cancelar"}
              </Button>
              {(!categoryToDelete.document_count || categoryToDelete.document_count === 0) && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteCategory}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir'
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

function CategoryForm({ category, onSave, onCancel, isSubmitting }: {
  category?: Category | null
  onSave: (data: Partial<Category>) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    status: category?.status || "active",
  })

  // Atualizar formData quando category mudar (para edição)
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        status: category.status || "active",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        status: "active",
      })
    }
  }, [category])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Categoria</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Documentos Financeiros"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o propósito desta categoria"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="category-status"
          checked={formData.status === "active"}
          onCheckedChange={(checked) => {
            setFormData((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))
            // Remover foco para forçar atualização visual
            setTimeout(() => {
              const element = document.getElementById('category-status')
              if (element) element.blur()
            }, 0)
          }}
        />
        <Label htmlFor="category-status" className="cursor-pointer">Categoria ativa</Label>
      </div>
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {category ? "Atualizar" : "Criar"} Categoria
        </Button>
      </div>
    </form>
  )
}
