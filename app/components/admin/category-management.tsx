"use client"

import { useState, useEffect } from "react"
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
  Palette,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// 🎨 Opções de cores baseadas no novo design
const colorOptions = [
  { value: "hsl(var(--trackdoc-blue))", label: "Azul Principal", class: "bg-trackdoc-blue" },
  { value: "hsl(var(--trackdoc-blue-dark))", label: "Azul Escuro", class: "bg-trackdoc-blue-dark" },
  { value: "hsl(var(--trackdoc-blue-light))", label: "Azul Claro", class: "bg-trackdoc-blue-light" },
  { value: "hsl(var(--trackdoc-black))", label: "Preto", class: "bg-trackdoc-black" },
  { value: "hsl(var(--trackdoc-gray))", label: "Cinza", class: "bg-trackdoc-gray" },
  { value: "hsl(var(--trackdoc-gray-light))", label: "Cinza Claro", class: "bg-trackdoc-gray-light" },
  { value: "hsl(var(--success))", label: "Sucesso", class: "bg-success" },
  { value: "hsl(var(--warning))", label: "Aviso", class: "bg-warning" },
  { value: "hsl(var(--destructive))", label: "Erro", class: "bg-destructive" },
]

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

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || category.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.status === "active").length,
    inactive: categories.filter((c) => c.status === "inactive").length,
    totalDocuments: categories.reduce((sum, c) => sum + (c.document_count || 0), 0),
  }

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    try {
      setIsSubmitting(true)
      
      if (selectedCategory) {
        // Editar categoria existente
        await updateCategory(selectedCategory.id, {
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
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
          color: categoryData.color,
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
    if (!categoryToDelete) return
    
    // Verificar se há documentos vinculados ANTES de tentar excluir
    if (categoryToDelete.document_count && categoryToDelete.document_count > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Esta categoria possui ${categoryToDelete.document_count} documento(s) vinculado(s). Remova ou reatribua os documentos antes de excluir a categoria.`,
        variant: "destructive",
      })
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      return
    }
    
    setIsDeleting(true)
    try {
      await deleteCategory(categoryToDelete.id)
      
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      })
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      })
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
    } finally {
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
            <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
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
              <div className="text-center py-8">
                <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhuma categoria encontrada.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: category.color || "#3b82f6" }}
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
                            <div className="flex items-center space-x-1">
                              <Palette className="h-4 w-4" />
                              <span>Cor: {colorOptions.find(c => c.value === category.color)?.label || 'Padrão'}</span>
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
        <div className="grid grid-cols-1 lg:col-span-3 xl:grid-cols-3 gap-6">
          {filteredCategories.length === 0 ? (
            <Card className="lg:col-span-3">
              <CardContent className="text-center py-8">
                <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhuma categoria encontrada.</p>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: category.color || "#3b82f6" }}
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
                            style={{ backgroundColor: category.color || "#3b82f6" }}
                          />
                          <p className="text-xs text-gray-500">
                            {colorOptions.find(c => c.value === category.color)?.label || 'Padrão'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {categoryToDelete?.document_count && categoryToDelete.document_count > 0 
                ? "Não é possível excluir esta categoria" 
                : "Tem certeza que deseja excluir esta categoria?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.document_count && categoryToDelete.document_count > 0 ? (
                <>
                  A categoria <span className="font-semibold">{categoryToDelete?.name}</span> possui{" "}
                  <span className="font-semibold text-red-600">{categoryToDelete.document_count} documento(s) vinculado(s)</span>.
                  <br /><br />
                  Para excluir esta categoria, você precisa primeiro remover ou reatribuir todos os documentos vinculados a ela.
                </>
              ) : (
                <>
                  Esta ação não pode ser desfeita. Isso removerá permanentemente a categoria{" "}
                  <span className="font-semibold">{categoryToDelete?.name}</span> e todos os seus dados associados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {categoryToDelete?.document_count && categoryToDelete.document_count > 0 ? "Fechar" : "Cancelar"}
            </AlertDialogCancel>
            {(!categoryToDelete?.document_count || categoryToDelete.document_count === 0) && (
              <AlertDialogAction 
                onClick={handleDeleteCategory} 
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    color: category?.color || "#3b82f6",
    status: category?.status || "active",
  })

  // Atualizar formData quando category mudar (para edição)
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        color: category.color || "#3b82f6",
        status: category.status || "active",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3b82f6",
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
      <div className="space-y-2">
        <Label>Cor da Categoria</Label>
        <div className="grid grid-cols-5 gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                formData.color === color.value
                  ? "border-gray-800 scale-110"
                  : "border-gray-300 hover:border-gray-500"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.status === "active"}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))}
        />
        <Label>Categoria ativa</Label>
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
