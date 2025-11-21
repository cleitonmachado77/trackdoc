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
  Layers,
  Loader2
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

  // Simplified state
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showDocumentSelector, setShowDocumentSelector] = useState(false)

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
      console.log('📚 [BIBLIOTECA] Carregando documentos para entity_id:', entityId)
      
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, description, file_name, file_type, status, approval_required")
        .eq("entity_id", entityId)
        .in("status", ["approved", "draft", "pending_approval"])
        .order("title")

      if (error) {
        console.error('❌ [BIBLIOTECA] Erro ao carregar documentos:', error)
        throw error
      }
      
      console.log('✅ [BIBLIOTECA] Documentos carregados:', data?.length || 0)
      
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

  const handleAddDocuments = async () => {
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

      // Preparar dados para inserção usando título e descrição originais
      const insertData = docs.map(doc => ({
        entity_id: entityId,
        document_id: doc.id,
        title: doc.title,
        description: doc.description,
        file_path: doc.file_path,
        file_name: doc.file_name,
        file_size: doc.file_size,
        file_type: doc.file_type,
        category_id: selectedCategoryId || null,
        is_active: true,
        created_by: user?.id,
      }))

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

      setShowDocumentSelector(false)
      setSelectedDocuments([])
      setSelectedCategoryId("")
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
          <Button 
            variant="outline" 
            onClick={() => {
              if (!entityId) return
              const link = `${window.location.origin}/biblioteca-publica/${entityId}`
              window.open(link, '_blank')
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Abrir Biblioteca
          </Button>
          <Button variant="outline" onClick={copyPublicLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger 
            value="documents"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none [&[data-state=active]]:!bg-blue-600 [&[data-state=active]]:!text-white [&[data-state=active]]:hover:!bg-blue-600 [&[data-state=active]]:focus:!bg-blue-600"
          >
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger 
            value="categories"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none [&[data-state=active]]:!bg-blue-600 [&[data-state=active]]:!text-white [&[data-state=active]]:hover:!bg-blue-600 [&[data-state=active]]:focus:!bg-blue-600"
          >
            <FolderOpen className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex gap-2">
            <Dialog open={showDocumentSelector} onOpenChange={setShowDocumentSelector}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Documentos
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Documentos à Biblioteca</DialogTitle>
              <DialogDescription>
                Selecione os documentos que deseja disponibilizar publicamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria (opcional)</Label>
                <Select 
                  value={selectedCategoryId || "none"} 
                  onValueChange={(value) => setSelectedCategoryId(value === "none" ? "" : value)}
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredDocuments.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum documento encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredDocuments.map((doc) => {
                      const isInLibrary = items.some(item => item.document_id === doc.id)
                      const isSelected = selectedDocuments.includes(doc.id)
                      
                      const statusColors: Record<string, string> = {
                        approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                        draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
                        pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                        archived: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }
                      
                      const statusLabels: Record<string, string> = {
                        approved: "Aprovado",
                        draft: "Rascunho",
                        pending_approval: "Pendente",
                        rejected: "Rejeitado",
                        archived: "Arquivado"
                      }
                      
                      // Determinar o status a ser exibido
                      const getDisplayStatus = () => {
                        const docStatus = (doc as any).status
                        const approvalRequired = (doc as any).approval_required
                        
                        // Se o documento não requer aprovação e está como draft ou pending_approval
                        if (!approvalRequired && (docStatus === 'draft' || docStatus === 'pending_approval')) {
                          return { label: "Sem aprovação", color: "text-gray-600 bg-gray-100" }
                        }
                        
                        return { 
                          label: statusLabels[docStatus] || docStatus,
                          color: statusColors[docStatus] || ""
                        }
                      }
                      
                      const displayStatus = getDisplayStatus()
                      
                      return (
                        <div
                          key={doc.id}
                          className={`p-3 flex items-center gap-3 hover:bg-accent transition-colors ${
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
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{doc.title}</div>
                              {(doc as any).status && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${displayStatus.color}`}
                                >
                                  {displayStatus.label}
                                </Badge>
                              )}
                            </div>
                            {doc.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2">
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

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedDocuments.length} documento(s) selecionado(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDocumentSelector(false)
                      setSelectedDocuments([])
                      setSelectedCategoryId("")
                      setSearchTerm("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddDocuments}
                    disabled={uploading || selectedDocuments.length === 0}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      `Adicionar ${selectedDocuments.length > 0 ? selectedDocuments.length : ''}`
                    )}
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
