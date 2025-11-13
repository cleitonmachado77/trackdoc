"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, Trash2, Edit, FolderOpen, Loader2 } from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  display_order: number
  is_active: boolean
  document_count?: number
}

interface LibraryCategoryManagerProps {
  entityId: string
  onCategoryChange?: () => void | Promise<void>
}

export function LibraryCategoryManager({ entityId, onCategoryChange }: LibraryCategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "FolderOpen",
    color: "#3b82f6",
  })

  useEffect(() => {
    loadCategories()
  }, [entityId])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("library_categories")
        .select("*")
        .eq("entity_id", entityId)
        .order("display_order", { ascending: true })

      if (error) throw error

      // Contar documentos por categoria
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (cat) => {
          const { count } = await supabase
            .from("public_library")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("is_active", true)

          return { ...cat, document_count: count || 0 }
        })
      )

      setCategories(categoriesWithCount)
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (editingCategory) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from("library_categories")
          .update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
          })
          .eq("id", editingCategory.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        })
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from("library_categories")
          .insert({
            entity_id: entityId,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            created_by: user?.id,
          })

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      loadCategories()
      onCategoryChange?.()
    } catch (error: any) {
      console.error("Erro ao salvar categoria:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a categoria",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setShowDeleteConfirm(true)
  }

  const deleteCategory = async () => {
    if (!categoryToDelete) return

    // Verificar se há documentos vinculados
    if (categoryToDelete.document_count && categoryToDelete.document_count > 0) {
      // Fechar o modal primeiro
      setShowDeleteConfirm(false)
      
      // Aguardar um momento para o modal fechar
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Mostrar o toast
      toast({
        title: "Não é possível excluir",
        description: `Esta categoria possui ${categoryToDelete.document_count} documento(s) vinculado(s). Remova ou reatribua os documentos antes de excluir a categoria.`,
        variant: "destructive",
      })
      
      // Limpar o estado
      setCategoryToDelete(null)
      return
    }

    setDeleting(categoryToDelete.id)
    try {
      const { error } = await supabase
        .from("library_categories")
        .delete()
        .eq("id", categoryToDelete.id)

      if (error) throw error

      // Fechar o modal primeiro
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      
      // Recarregar dados
      loadCategories()
      onCategoryChange?.()
      
      // Aguardar um momento
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Mostrar o toast
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      
      // Fechar o modal primeiro
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      
      // Aguardar um momento
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Mostrar o toast
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "FolderOpen",
      color: category.color || "#3b82f6",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "FolderOpen",
      color: "#3b82f6",
    })
    setEditingCategory(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Categorias</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                Organize seus documentos em categorias
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Categoria *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Políticas, Manuais, Formulários"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da categoria"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-4">Carregando...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma categoria criada</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color || "#3b82f6" }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.description || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {category.document_count} doc{category.document_count !== 1 ? "s" : ""}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(category)}
                      disabled={deleting === category.id}
                    >
                      {deleting === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* AlertDialog para confirmação de exclusão */}
      <AlertDialog 
        open={showDeleteConfirm} 
        onOpenChange={(open) => {
          setShowDeleteConfirm(open)
          if (!open) {
            setCategoryToDelete(null)
          }
        }}
      >
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
                  <span className="font-semibold">{categoryToDelete?.name}</span>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={!!deleting}
              onClick={() => {
                setShowDeleteConfirm(false)
                setCategoryToDelete(null)
              }}
            >
              {categoryToDelete?.document_count && categoryToDelete.document_count > 0 ? "Fechar" : "Cancelar"}
            </AlertDialogCancel>
            {(!categoryToDelete?.document_count || categoryToDelete.document_count === 0) && (
              <AlertDialogAction 
                onClick={deleteCategory} 
                disabled={!!deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
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
