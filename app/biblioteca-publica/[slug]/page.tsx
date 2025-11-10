"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { FileText, Download, ExternalLink, Building2, FolderOpen } from "lucide-react"

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
}

interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
}

interface Entity {
  name: string
  logo_url: string | null
}

export default function BibliotecaPublicaPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [items, setItems] = useState<LibraryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadLibrary()
    }
  }, [slug])

  const loadLibrary = async () => {
    try {
      setLoading(true)
      setError(null)

      // Primeiro, tentar buscar a entidade diretamente pelo slug
      const { data: entityBySlug, error: entitySlugError } = await supabase
        .from("entities")
        .select("id, name, logo_url")
        .eq("id", slug)
        .single()

      let entityId: string | null = null
      let entityInfo: Entity | null = null

      if (!entitySlugError && entityBySlug) {
        // Slug é o ID da entidade
        entityId = entityBySlug.id
        entityInfo = { name: entityBySlug.name, logo_url: entityBySlug.logo_url }
      } else {
        // Tentar buscar pelo public_slug de algum documento
        const { data: firstItem, error: firstError } = await supabase
          .from("public_library")
          .select("entity_id")
          .eq("public_slug", slug)
          .eq("is_active", true)
          .limit(1)
          .single()

        if (firstError || !firstItem) {
          setError("Biblioteca não encontrada")
          return
        }

        entityId = firstItem.entity_id

        // Buscar informações da entidade
        const { data: entityData, error: entityError } = await supabase
          .from("entities")
          .select("name, logo_url")
          .eq("id", entityId)
          .single()

        if (entityError) throw entityError
        entityInfo = entityData
      }

      if (!entityId || !entityInfo) {
        setError("Biblioteca não encontrada")
        return
      }

      // Buscar categorias da entidade
      const { data: categoriesData } = await supabase
        .from("library_categories")
        .select("*")
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      setCategories(categoriesData || [])

      // Buscar todos os documentos ativos da entidade
      const { data: libraryData, error: libraryError } = await supabase
        .from("public_library")
        .select("*")
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (libraryError) throw libraryError

      setItems(libraryData || [])
      setEntity(entityInfo)
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

  const viewFile = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from("documents")
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        window.open(data.publicUrl, "_blank")
      }
    } catch (error) {
      console.error("Erro ao visualizar arquivo:", error)
      alert("Erro ao visualizar arquivo")
    }
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-8 w-8 text-primary" />
    
    if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />
    if (fileType.includes("word") || fileType.includes("doc")) return <FileText className="h-8 w-8 text-blue-500" />
    if (fileType.includes("excel") || fileType.includes("sheet")) return <FileText className="h-8 w-8 text-green-500" />
    if (fileType.includes("powerpoint") || fileType.includes("presentation")) return <FileText className="h-8 w-8 text-orange-500" />
    
    return <FileText className="h-8 w-8 text-primary" />
  }

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

  if (error || !entity) {
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

  // Agrupar por categoria
  const groupedItems: Record<string, { category: Category | null; items: LibraryItem[] }> = {}
  
  items.forEach((item) => {
    const category = categories.find(c => c.id === item.category_id) || null
    const key = category?.id || "uncategorized"
    
    if (!groupedItems[key]) {
      groupedItems[key] = { category, items: [] }
    }
    groupedItems[key].items.push(item)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {entity.logo_url ? (
                <div className="h-16 w-16 rounded-lg overflow-hidden border flex items-center justify-center bg-white p-2">
                  <img
                    src={entity.logo_url}
                    alt={entity.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                  <Building2 className="h-8 w-8 text-gray-600" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {entity.name}
                </h1>
                <p className="text-gray-600 mt-1">Biblioteca Pública de Documentos</p>
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
      <div className="container mx-auto px-4 py-12">
        {items.length === 0 ? (
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
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white"
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                            {getFileIcon(item.file_type)}
                          </div>
                          {item.file_type && (
                            <Badge 
                              variant="secondary" 
                              className="font-mono text-xs"
                            >
                              {item.file_type.split('/').pop()?.toUpperCase().substring(0, 4)}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                          {item.description && (
                            <CardDescription className="mt-2 line-clamp-2">
                              {item.description}
                            </CardDescription>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          {item.file_path && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => viewFile(item.file_path!)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-16">
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
    </div>
  )
}
