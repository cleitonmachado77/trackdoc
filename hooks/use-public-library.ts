/**
 * Hook customizado para gerenciar a Biblioteca Pública
 * 
 * Este hook fornece funções e estado para interagir com a
 * funcionalidade de Biblioteca Pública de forma simplificada.
 */

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface PublicLibraryItem {
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
  tags: string[] | null
  public_slug: string
  metadata: any
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface UsePublicLibraryOptions {
  entityId?: string
  autoLoad?: boolean
}

export function usePublicLibrary(options: UsePublicLibraryOptions = {}) {
  const { entityId, autoLoad = true } = options

  const [items, setItems] = useState<PublicLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Carregar itens da biblioteca
  const loadItems = useCallback(async (forceEntityId?: string) => {
    const targetEntityId = forceEntityId || entityId
    if (!targetEntityId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("public_library")
        .select("*")
        .eq("entity_id", targetEntityId)
        .order("display_order", { ascending: true })

      if (fetchError) throw fetchError

      setItems(data || [])
    } catch (err) {
      setError(err as Error)
      console.error("Erro ao carregar biblioteca:", err)
    } finally {
      setLoading(false)
    }
  }, [entityId])

  // Adicionar documento existente
  const addExistingDocument = useCallback(async (
    documentId: string,
    targetEntityId: string,
    options?: {
      category?: string
      isActive?: boolean
    }
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Buscar documento
      const { data: document, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (docError) throw docError

      // Adicionar à biblioteca
      const { data, error: insertError } = await supabase
        .from("public_library")
        .insert({
          entity_id: targetEntityId,
          document_id: document.id,
          title: document.title,
          description: document.description,
          file_path: document.file_path,
          file_name: document.file_name,
          file_size: document.file_size,
          file_type: document.file_type,
          category: options?.category || null,
          is_active: options?.isActive ?? true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Atualizar lista
      await loadItems(targetEntityId)

      return { success: true, data }
    } catch (err) {
      setError(err as Error)
      console.error("Erro ao adicionar documento:", err)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [loadItems])

  // Criar novo documento
  const createDocument = useCallback(async (
    targetEntityId: string,
    title: string,
    description?: string,
    options?: {
      category?: string
      isActive?: boolean
      filePath?: string
      fileName?: string
      fileSize?: number
      fileType?: string
    }
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: insertError } = await supabase
        .from("public_library")
        .insert({
          entity_id: targetEntityId,
          title,
          description: description || null,
          category: options?.category || null,
          is_active: options?.isActive ?? true,
          file_path: options?.filePath || null,
          file_name: options?.fileName || null,
          file_size: options?.fileSize || null,
          file_type: options?.fileType || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Atualizar lista
      await loadItems(targetEntityId)

      return { success: true, data }
    } catch (err) {
      setError(err as Error)
      console.error("Erro ao criar documento:", err)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [loadItems])

  // Atualizar documento
  const updateDocument = useCallback(async (
    documentId: string,
    updates: Partial<PublicLibraryItem>
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from("public_library")
        .update(updates)
        .eq("id", documentId)
        .select()
        .single()

      if (updateError) throw updateError

      // Atualizar lista local
      setItems(prev => prev.map(item => 
        item.id === documentId ? { ...item, ...updates } : item
      ))

      return { success: true, data }
    } catch (err) {
      setError(err as Error)
      console.error("Erro ao atualizar documento:", err)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [])

  // Ativar/Desativar documento
  const toggleActive = useCallback(async (documentId: string, isActive: boolean) => {
    return updateDocument(documentId, { is_active: isActive })
  }, [updateDocument])

  // Remover documento
  const removeDocument = useCallback(async (documentId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from("public_library")
        .delete()
        .eq("id", documentId)

      if (deleteError) throw deleteError

      // Atualizar lista local
      setItems(prev => prev.filter(item => item.id !== documentId))

      return { success: true }
    } catch (err) {
      setError(err as Error)
      console.error("Erro ao remover documento:", err)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualizar ordem
  const updateOrder = useCallback(async (documentId: string, order: number) => {
    return updateDocument(documentId, { display_order: order })
  }, [updateDocument])

  // Gerar link público
  const generatePublicLink = useCallback((slug: string) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/biblioteca-publica/${slug}`
  }, [])

  // Copiar link
  const copyPublicLink = useCallback(async (slug: string) => {
    try {
      const link = generatePublicLink(slug)
      await navigator.clipboard.writeText(link)
      return { success: true, link }
    } catch (err) {
      console.error("Erro ao copiar link:", err)
      return { success: false, error: err }
    }
  }, [generatePublicLink])

  // Buscar por categoria
  const getByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category)
  }, [items])

  // Buscar documentos ativos
  const getActiveItems = useCallback(() => {
    return items.filter(item => item.is_active)
  }, [items])

  // Buscar documentos inativos
  const getInactiveItems = useCallback(() => {
    return items.filter(item => !item.is_active)
  }, [items])

  // Agrupar por categoria
  const groupByCategory = useCallback(() => {
    return items.reduce((acc, item) => {
      const category = item.category || "Sem Categoria"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as Record<string, PublicLibraryItem[]>)
  }, [items])

  // Carregar automaticamente se autoLoad estiver ativo
  useEffect(() => {
    if (autoLoad && entityId) {
      loadItems()
    }
  }, [autoLoad, entityId, loadItems])

  return {
    // Estado
    items,
    loading,
    error,

    // Ações
    loadItems,
    addExistingDocument,
    createDocument,
    updateDocument,
    toggleActive,
    removeDocument,
    updateOrder,

    // Utilidades
    generatePublicLink,
    copyPublicLink,
    getByCategory,
    getActiveItems,
    getInactiveItems,
    groupByCategory,

    // Estatísticas
    stats: {
      total: items.length,
      active: items.filter(i => i.is_active).length,
      inactive: items.filter(i => !i.is_active).length,
      categories: [...new Set(items.map(i => i.category).filter(Boolean))].length,
    }
  }
}

// Hook para buscar biblioteca pública (sem autenticação)
export function usePublicLibraryBySlug(slug: string) {
  const [items, setItems] = useState<PublicLibraryItem[]>([])
  const [entity, setEntity] = useState<{ name: string; logo_url: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!slug) return

    const loadPublicLibrary = async () => {
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

        if (firstError) throw firstError

        // Buscar todos os itens ativos
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
      } catch (err) {
        setError(err as Error)
        console.error("Erro ao carregar biblioteca pública:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPublicLibrary()
  }, [slug])

  // Agrupar por categoria
  const groupByCategory = useCallback(() => {
    return items.reduce((acc, item) => {
      const category = item.category || "Sem Categoria"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as Record<string, PublicLibraryItem[]>)
  }, [items])

  return {
    items,
    entity,
    loading,
    error,
    groupByCategory,
    stats: {
      total: items.length,
      categories: [...new Set(items.map(i => i.category).filter(Boolean))].length,
    }
  }
}
