"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { FileText, Download, ExternalLink, Building2 } from "lucide-react"

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
  category: string | null
  created_at: string
}

interface Entity {
  name: string
  logo_url: string | null
}

export default function BibliotecaPublicaPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [items, setItems] = useState<LibraryItem[]>([])
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

      // Buscar primeiro item para pegar o entity_id
      const { data: firstItem, error: firstError } = await supabase
        .from("public_library")
        .select("entity_id")
        .eq("public_slug", slug)
        .eq("is_active", true)
        .single()

      if (firstError) {
        setError("Biblioteca não encontrada")
        return
      }

      // Buscar todos os itens da entidade
      const { data: libraryData, error: libraryError } = await supabase
        .from("public_library")
        .select("*")
        .eq("entity_id", firstItem.entity_id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (libraryError) throw libraryError

      // Buscar informações da entidade
      const { data: entityData, error: entityError } = await supabase
        .from("entities")
        .select("name, logo_url")
        .eq("id", firstItem.entity_id)
        .single()

      if (entityError) throw entityError

      setItems(libraryData || [])
      setEntity(entityData)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando biblioteca...</p>
        </div>
      </div>
    )
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Biblioteca não encontrada</CardTitle>
            <CardDescription>
              {error || "A biblioteca pública que você está procurando não existe ou não está mais disponível."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Agrupar por categoria
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Sem Categoria"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, LibraryItem[]>)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {entity.logo_url ? (
              <img
                src={entity.logo_url}
                alt={entity.name}
                className="h-16 w-16 object-contain rounded-lg"
              />
            ) : (
              <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{entity.name}</h1>
              <p className="text-muted-foreground">Biblioteca Pública de Documentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum documento disponível no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="text-2xl font-semibold mb-4">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <FileText className="h-8 w-8 text-primary" />
                          {item.file_type && (
                            <Badge variant="outline">
                              {item.file_type.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="mt-4">{item.title}</CardTitle>
                        {item.description && (
                          <CardDescription>{item.description}</CardDescription>
                        )}
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
                                variant="default"
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
      <div className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by TrackDoc - Sistema de Gestão de Documentos</p>
        </div>
      </div>
    </div>
  )
}
