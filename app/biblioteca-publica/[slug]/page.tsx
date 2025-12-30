"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@supabase/ssr"
import { FileText, Download, Building2, FolderOpen, Eye, Search, LayoutGrid, List } from "lucide-react"
import UniversalDocumentViewer from "@/app/components/universal-document-viewer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface LibraryItem {
  id: string
  title: string
  description: string | null
  file_path: string | null
  file_name: string | null
  file_type: string | null
  category_id: string | null
  created_at: string
  document_id: string | null
  // Campos adicionais do documento relacionado
  document?: {
    version: number
    status: string
    approved_at: string | null
    author?: { full_name: string }
    department?: { name: string }
  } | null
}

interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
}

interface OwnerInfo {
  name: string
  logo_url: string | null
  isEntity: boolean
}

export default function BibliotecaPublicaPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [items, setItems] = useState<LibraryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [owner, setOwner] = useState<OwnerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadLibrary()
    }
  }, [slug])

  // Atualizar título da aba quando o owner for carregado
  useEffect(() => {
    if (owner) {
      document.title = `Biblioteca Pública | ${owner.name}`
    }
  }, [owner])

  const loadLibrary = async () => {
    try {
      setLoading(true)
      setError(null)

      let ownerInfo: OwnerInfo | null = null
      let entityId: string | null = null
      let userId: string | null = null

      // 1. Primeiro, tentar buscar a entidade diretamente pelo slug
      const { data: entityBySlug, error: entitySlugError } = await supabase
        .from("entities")
        .select("id, name, logo_url")
        .eq("id", slug)
        .single()

      if (!entitySlugError && entityBySlug) {
        // Slug é o ID da entidade
        entityId = entityBySlug.id
        ownerInfo = { 
          name: entityBySlug.name, 
          logo_url: entityBySlug.logo_url,
          isEntity: true 
        }
      } else {
        // 2. Tentar buscar como usuário solo (slug é user_id)
        const { data: userProfile, error: userError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", slug)
          .single()

        if (!userError && userProfile) {
          // Slug é o ID do usuário solo
          userId = userProfile.id
          ownerInfo = {
            name: userProfile.full_name || "Usuário",
            logo_url: null,
            isEntity: false
          }
        } else {
          // 3. Tentar buscar pelo public_slug de algum documento
          const { data: firstItem, error: firstError } = await supabase
            .from("public_library")
            .select("entity_id, created_by")
            .eq("public_slug", slug)
            .eq("is_active", true)
            .limit(1)
            .single()

          if (firstError || !firstItem) {
            setError("Biblioteca não encontrada")
            return
          }

          if (firstItem.entity_id) {
            entityId = firstItem.entity_id
            // Buscar informações da entidade
            const { data: entityData, error: entityError } = await supabase
              .from("entities")
              .select("name, logo_url")
              .eq("id", entityId)
              .single()

            if (entityError) throw entityError
            ownerInfo = { 
              name: entityData.name, 
              logo_url: entityData.logo_url,
              isEntity: true 
            }
          } else if (firstItem.created_by) {
            userId = firstItem.created_by
            // Buscar informações do usuário solo
            const { data: userData, error: userError } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", userId)
              .single()

            if (userError) throw userError
            ownerInfo = {
              name: userData.full_name || "Usuário",
              logo_url: null,
              isEntity: false
            }
          }
        }
      }

      if (!ownerInfo || (!entityId && !userId)) {
        setError("Biblioteca não encontrada")
        return
      }

      // Buscar categorias
      let categoriesQuery = supabase
        .from("library_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (entityId) {
        categoriesQuery = categoriesQuery.eq("entity_id", entityId)
      } else if (userId) {
        categoriesQuery = categoriesQuery.eq("created_by", userId)
      }

      const { data: categoriesData } = await categoriesQuery
      setCategories(categoriesData || [])

      // Buscar todos os documentos ativos (sem relacionamentos complexos para evitar erro 400)
      let libraryQuery = supabase
        .from("public_library")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (entityId) {
        libraryQuery = libraryQuery.eq("entity_id", entityId)
      } else if (userId) {
        libraryQuery = libraryQuery.eq("created_by", userId)
      }

      const { data: libraryData, error: libraryError } = await libraryQuery

      if (libraryError) throw libraryError

      // Buscar informações adicionais dos documentos relacionados
      const documentIds = (libraryData || [])
        .filter(item => item.document_id)
        .map(item => item.document_id)

      let documentsMap: Record<string, any> = {}
      
      if (documentIds.length > 0) {
        const { data: documentsData } = await supabase
          .from("documents")
          .select(`
            id,
            version,
            status,
            approved_at,
            author:profiles!documents_author_id_fkey(full_name),
            department:departments!documents_department_id_fkey(name)
          `)
          .in("id", documentIds)

        if (documentsData) {
          documentsMap = documentsData.reduce((acc, doc) => {
            acc[doc.id] = doc
            return acc
          }, {} as Record<string, any>)
        }
      }

      // Combinar dados da biblioteca com informações dos documentos
      const enrichedItems = (libraryData || []).map(item => ({
        ...item,
        document: item.document_id ? documentsMap[item.document_id] || null : null
      }))

      setItems(enrichedItems)
      setOwner(ownerInfo)
    } catch (error: any) {
      console.error("Erro ao carregar biblioteca:", error)
      setError("Erro ao carregar biblioteca pública")
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath)

      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error)
      alert("Erro ao baixar arquivo")
    }
  }

  const viewFile = (item: LibraryItem) => {
    setSelectedItem(item)
    setViewerOpen(true)
    setScale(1)
    setRotation(0)
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="mt-6 text-lg text-muted-foreground font-medium">Carregando biblioteca...</p>
        </div>
      </div>
    )
  }

  if (error || !owner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Biblioteca não encontrada</CardTitle>
            <CardDescription className="text-base">
              {error || "A biblioteca pública que você está procurando não existe ou não está mais disponível."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Filtrar itens pela pesquisa e categoria
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategoryId || 
      item.category_id === selectedCategoryId ||
      (selectedCategoryId === "uncategorized" && !item.category_id)
    
    return matchesSearch && matchesCategory
  })

  // Agrupar por categoria
  const groupedItems: Record<string, { category: Category | null; items: LibraryItem[] }> = {}
  
  filteredItems.forEach((item) => {
    const category = categories.find(c => c.id === item.category_id) || null
    const key = category?.id || "uncategorized"
    
    if (!groupedItems[key]) {
      groupedItems[key] = { category, items: [] }
    }
    groupedItems[key].items.push(item)
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {owner.isEntity && owner.logo_url ? (
                <div className="h-16 w-16 rounded-lg overflow-hidden border flex items-center justify-center bg-white p-2">
                  <img
                    src={owner.logo_url}
                    alt={owner.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                  {owner.isEntity ? (
                    <Building2 className="h-8 w-8 text-gray-600" />
                  ) : (
                    <FileText className="h-8 w-8 text-gray-600" />
                  )}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {owner.isEntity ? owner.name : `Biblioteca de ${owner.name}`}
                </h1>
                <p className="text-gray-600 mt-1">
                  {owner.isEntity ? "Biblioteca Pública de Documentos" : "Documentos Públicos"}
                </p>
              </div>
            </div>
            
            {/* Logo Tracdock */}
            <div className="h-10 flex items-center">
              <img
                src="/logo-horizontal-preto.png"
                alt="Tracdock"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-12">
        {/* Barra de Pesquisa e Filtros */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Pesquisar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-12 w-12 transition-colors ${viewMode === "list" ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white hover:bg-gray-100 text-gray-700"}`}
                title="Visualização em lista"
              >
                <List className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-12 w-12 transition-colors ${viewMode === "grid" ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white hover:bg-gray-100 text-gray-700"}`}
                title="Visualização em grade"
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Filtro de Categorias */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
                className={`transition-colors ${selectedCategoryId === null ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white hover:bg-gray-100 text-gray-700"}`}
              >
                Todas
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`flex items-center gap-2 transition-colors ${selectedCategoryId === category.id ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white hover:bg-gray-100 text-gray-700"}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${selectedCategoryId === category.id ? "border border-white" : ""}`}
                    style={{ backgroundColor: category.color || "#3b82f6" }}
                  />
                  {category.name}
                </Button>
              ))}
              <Button
                variant={selectedCategoryId === "uncategorized" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId("uncategorized")}
                className={`transition-colors ${selectedCategoryId === "uncategorized" ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white hover:bg-gray-100 text-gray-700"}`}
              >
                Sem Categoria
              </Button>
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <FileText className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? "Nenhum documento encontrado" : "Nenhum documento disponível"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Tente ajustar sua pesquisa" 
                  : "Esta biblioteca ainda não possui documentos públicos"}
              </p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <FileText className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum documento disponível</h3>
              <p className="text-muted-foreground">
                Esta biblioteca ainda não possui documentos públicos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedItems).map(([key, { category, items: categoryItems }]) => (
              <div key={key} className="space-y-6">
                <div className="flex items-center gap-3">
                  {category ? (
                    <>
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: category.color || "#3b82f6" }}
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                        {category.description && (
                          <p className="text-gray-600">{category.description}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-8 w-8 text-gray-400" />
                      <h2 className="text-2xl font-bold text-gray-600">Sem Categoria</h2>
                    </>
                  )}
                </div>
                
                {viewMode === "list" ? (
                  /* Modo Lista */
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <Card 
                        key={item.id} 
                        className="group hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                    {item.title}
                                  </h3>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                  {/* Informações adicionais do documento */}
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                    {item.document?.author?.full_name && (
                                      <span>
                                        <span className="font-medium">Autor:</span> {item.document.author.full_name}
                                      </span>
                                    )}
                                    {item.document?.version && (
                                      <span>
                                        <span className="font-medium">Versão:</span> {item.document.version}
                                      </span>
                                    )}
                                    {item.document?.department?.name && (
                                      <span>
                                        <span className="font-medium">Departamento:</span> {item.document.department.name}
                                      </span>
                                    )}
                                    {item.created_at && (
                                      <span>
                                        <span className="font-medium">Publicado em:</span> {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                    {item.document?.approved_at && (
                                      <span>
                                        <span className="font-medium">Aprovado em:</span> {new Date(item.document.approved_at).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {item.file_path && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => viewFile(item)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(item.file_path!, item.file_name || "documento")}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Modo Grid */
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryItems.map((item) => (
                      <Card 
                        key={item.id} 
                        className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white"
                      >
                        <CardHeader className="space-y-3 pb-3">
                          <div>
                            <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                              {item.title}
                            </CardTitle>
                            {item.description && (
                              <CardDescription className="mt-1 text-xs line-clamp-2">
                                {item.description}
                              </CardDescription>
                            )}
                          </div>
                          {/* Informações adicionais do documento */}
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {item.document?.author?.full_name && (
                              <p>
                                <span className="font-medium">Autor:</span> {item.document.author.full_name}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {item.document?.version && (
                                <span>
                                  <span className="font-medium">v</span>{item.document.version}
                                </span>
                              )}
                              {item.document?.department?.name && (
                                <span className="truncate max-w-[120px]" title={item.document.department.name}>
                                  {item.document.department.name}
                                </span>
                              )}
                            </div>
                            {item.created_at && (
                              <p>
                                <span className="font-medium">Publicado:</span> {new Date(item.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            {item.document?.approved_at && (
                              <p>
                                <span className="font-medium">Aprovado:</span> {new Date(item.document.approved_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-col gap-2">
                            {item.file_path && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => viewFile(item)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => downloadFile(item.file_path!, item.file_name || "documento")}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Fixado na parte inferior */}
      <div className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-horizontal-preto.png"
                alt="Tracdock"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-600">Sistema de Gestão de Documentos</p>
              <p className="text-xs text-gray-500 mt-1">
                © {new Date().getFullYear()} Todos os direitos reservados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl truncate">
                  {selectedItem?.title}
                </DialogTitle>
                {selectedItem?.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {selectedItem.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="text-xs px-2">
                  {Math.round(scale * 100)}%
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                {selectedItem?.file_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(selectedItem.file_path!, selectedItem.file_name || "documento")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedItem && selectedItem.file_path && (
              <UniversalDocumentViewer
                url={selectedItem.file_path}
                fileType={selectedItem.file_type || ''}
                fileName={selectedItem.file_name || ''}
                scale={scale}
                rotation={rotation}
                onLoadSuccess={() => {}}
                onLoadError={() => {}}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
