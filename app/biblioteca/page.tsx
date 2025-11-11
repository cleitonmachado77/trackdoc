"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { 
  Plus, 
  FileText, 
  Link as LinkIcon, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy,
  Upload,
  Search,
  FolderOpen,
  Layers
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LibraryCategoryManager } from "@/app/components/library-category-manager"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PublicLibraryItem {
  id: string
  entity_id: string
  document_id: string | null
  title: string
  description: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  is_active: boolean
  display_order: number
  category: string | null
  category_id: string | null
  public_slug: string
  created_at: string
}

interface Document {
  id: string
  title: string
  description: string | null
  file_name: string | null
  file_type: string | null
}

interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
}

export default function BibliotecaPage() {
  const [items, setItems] = useState<PublicLibraryItem[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [entityId, setEntityId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    source: "existing", // "existing" ou "new"
    documentId: "",
    title: "",
    description: "",
    categoryId: "",
    isActive: true,
  })
  
  // Bulk add state
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [bulkCategoryId, setBulkCategoryId] = useState("")
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadUserEntity()
  }, [])

  useEffect(() => {
    if (entityId) {
      loadLibraryItems()
      loadDocuments()
      loadCategories()
    }
  }, [entityId])

  const loadUserEntity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("entity_id")
        .eq("id", user.id)
        .single()

      if (profile?.entity_id) {
        setEntityId(profile.entity_id)
      }
    } catch (error) {
      console.error("Erro ao carregar entidade:", error)
    }
  }

  const loadLibraryItems = async () => {
    if (!entityId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("public_library")
        .select("*")
        .eq("entity_id", entityId)
        .order("display_order", { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Erro ao carregar biblioteca:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens da biblioteca",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    if (!entityId) return

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, description, file_name, file_type")
        .eq("entity_id", entityId)
        .eq("status", "approved")
        .order("title")

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    }
  }

  const loadCategories = async () => {
    if (!entityId) return

    try {
      const { data, error } = await supabase
        .from("library_categories")
        .select("id, name, description, color")
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entityId) return

    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      let insertData: any = {
        entity_id: entityId,
        title: formData.title,
        description: formData.description,
        category_id: formData.categoryId || null,
        is_active: formData.isActive,
        created_by: user?.id,
      }

      if (formData.source === "existing" && formData.documentId) {
        // Buscar dados do documento existente
        const { data: doc } = await supabase
          .from("documents")
          .select("*")
          .eq("id", formData.documentId)
          .single()

        if (doc) {
          insertData = {
            ...insertData,
            document_id: doc.id,
            title: formData.title || doc.title,
            description: formData.description || doc.description,
            file_path: doc.file_path,
            file_name: doc.file_name,
            file_size: doc.file_size,
            file_type: doc.file_type,
          }
        }
      } else if (formData.source === "new" && uploadedFile) {
        // Upload do novo arquivo
        const fileExt = uploadedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${entityId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, uploadedFile)

        if (uploadError) throw uploadError

        insertData = {
          ...insertData,
          file_path: filePath,
          file_name: uploadedFile.name,
          file_size: uploadedFile.size,
          file_type: uploadedFile.type,
        }
      }

      const { error } = await supabase
        .from("public_library")
        .insert(insertData)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Item adicionado à biblioteca pública",
      })

      setIsDialogOpen(false)
      resetForm()
      loadLibraryItems()
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o item",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("public_library")
        .update({ is_active: !currentStatus })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Item ${!currentStatus ? "ativado" : "desativado"}`,
      })

      loadLibraryItems()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este item da biblioteca?")) return

    try {
      const { error } = await supabase
        .from("public_library")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Item removido da biblioteca",
      })

      loadLibraryItems()
    } catch (error) {
      console.error("Erro ao deletar item:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        variant: "destructive",
      })
    }
  }

  const copyPublicLink = () => {
    if (!entityId) return
    
    const link = `${window.location.origin}/biblioteca-publica/${entityId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copiado!",
      description: "O link público foi copiado para a área de transferência. Todos os documentos ativos serão exibidos.",
    })
  }

  const handleBulkAdd = async () => {
    if (!entityId || selectedDocuments.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um documento",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()

      // Buscar dados dos documentos selecionados
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .in("id", selectedDocuments)

      if (docsError) {
        console.error("Erro ao buscar documentos:", docsError)
        throw docsError
      }

      if (!docs || docs.length === 0) {
        throw new Error("Nenhum documento encontrado")
      }

      // Preparar dados para inserção
      const insertData = docs.map(doc => ({
        entity_id: entityId,
        document_id: doc.id,
        title: doc.title,
        description: doc.description,
        file_path: doc.file_path,
        file_name: doc.file_name,
        file_size: doc.file_size,
        file_type: doc.file_type,
        category_id: bulkCategoryId || null,
        is_active: true,
        created_by: user?.id,
      }))

      console.log("Inserindo documentos:", insertData)

      const { error } = await supabase
        .from("public_library")
        .insert(insertData)

      if (error) {
        console.error("Erro ao inserir na biblioteca:", error)
        throw error
      }

      toast({
        title: "Sucesso",
        description: `${selectedDocuments.length} documento(s) adicionado(s) à biblioteca`,
      })

      setIsBulkDialogOpen(false)
      setSelectedDocuments([])
      setBulkCategoryId("")
      loadLibraryItems()
    } catch (error: any) {
      console.error("Erro ao adicionar documentos:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar os documentos",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      source: "existing",
      documentId: "",
      title: "",
      description: "",
      categoryId: "",
      isActive: true,
    })
    setUploadedFile(null)
    setSearchTerm("")
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full h-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca Pública</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie documentos públicos acessíveis por link externo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyPublicLink}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Copiar Link Público
          </Button>
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="categories">
            <FolderOpen className="h-4 w-4 mr-2" />
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Documento
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar à Biblioteca Pública</DialogTitle>
              <DialogDescription>
                Selecione um documento existente ou adicione informações de um novo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Fonte do Documento</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.source === "existing" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, source: "existing" })}
                  >
                    Documento Existente
                  </Button>
                  <Button
                    type="button"
                    variant={formData.source === "new" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, source: "new" })}
                  >
                    Novo Documento
                  </Button>
                </div>
              </div>

              {formData.source === "existing" && (
                <div className="space-y-2">
                  <Label htmlFor="document">Selecionar Documento</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className={`p-3 cursor-pointer hover:bg-accent ${
                            formData.documentId === doc.id ? "bg-accent" : ""
                          }`}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              documentId: doc.id,
                              title: doc.title,
                              description: doc.description || "",
                            })
                          }}
                        >
                          <div className="font-medium">{doc.title}</div>
                          {doc.description && (
                            <div className="text-sm text-muted-foreground">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {formData.source === "new" && (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload de Arquivo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setUploadedFile(file)
                          if (!formData.title) {
                            setFormData({
                              ...formData,
                              title: file.name.replace(/\.[^/.]+$/, "")
                            })
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="file"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      {uploadedFile ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-primary">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              setUploadedFile(null)
                            }}
                          >
                            Remover arquivo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            Clique para selecionar um arquivo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOC, XLS, PPT, TXT, JPG, PNG (máx. 50MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.categoryId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color || "#3b82f6" }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Ativo na biblioteca</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading || (formData.source === "new" && !uploadedFile)}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Adicionar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>

          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Layers className="h-4 w-4 mr-2" />
                Adicionar Múltiplos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Múltiplos Documentos</DialogTitle>
                <DialogDescription>
                  Selecione vários documentos para adicionar à biblioteca de uma vez
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoria (opcional)</Label>
                  <Select 
                    value={bulkCategoryId || "none"} 
                    onValueChange={(value) => setBulkCategoryId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color || "#3b82f6" }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Buscar documentos</Label>
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {filteredDocuments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhum documento encontrado
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredDocuments.map((doc) => {
                        const isInLibrary = items.some(item => item.document_id === doc.id)
                        const isSelected = selectedDocuments.includes(doc.id)
                        
                        return (
                          <div
                            key={doc.id}
                            className={`p-3 flex items-center gap-3 hover:bg-accent ${
                              isInLibrary ? "opacity-50" : ""
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isInLibrary}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDocuments([...selectedDocuments, doc.id])
                                } else {
                                  setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id))
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{doc.title}</div>
                              {doc.description && (
                                <div className="text-sm text-muted-foreground">
                                  {doc.description}
                                </div>
                              )}
                              {isInLibrary && (
                                <Badge variant="secondary" className="mt-1">
                                  Já na biblioteca
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {selectedDocuments.length} documento(s) selecionado(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsBulkDialogOpen(false)
                        setSelectedDocuments([])
                        setBulkCategoryId("")
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleBulkAdd}
                      disabled={uploading || selectedDocuments.length === 0}
                    >
                      {uploading ? "Adicionando..." : `Adicionar ${selectedDocuments.length}`}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Documentos na Biblioteca</CardTitle>
          <CardDescription>
            Gerencie os documentos disponíveis publicamente
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum documento na biblioteca pública
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%] min-w-[300px]">Título</TableHead>
                  <TableHead className="w-[20%] min-w-[150px]">Categoria</TableHead>
                  <TableHead className="w-[15%] min-w-[100px]">Status</TableHead>
                  <TableHead className="w-[25%] min-w-[200px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category_id && categories.find(c => c.id === item.category_id) ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: categories.find(c => c.id === item.category_id)?.color || "#3b82f6" }}
                          />
                          {categories.find(c => c.id === item.category_id)?.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem categoria</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(item.id, item.is_active)}
                          title={item.is_active ? "Desativar" : "Ativar"}
                        >
                          {item.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Gerenciar Categorias</CardTitle>
              <CardDescription>
                Organize seus documentos em categorias personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entityId && (
                <LibraryCategoryManager
                  entityId={entityId}
                  onCategoryChange={loadCategories}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
