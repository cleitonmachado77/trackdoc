/**
 * Exemplos de uso da API da Biblioteca Pública
 * 
 * Este arquivo contém exemplos de como interagir com a funcionalidade
 * de Biblioteca Pública programaticamente.
 */

import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================================================
// EXEMPLO 1: Adicionar documento existente à biblioteca
// ============================================================================
export async function addExistingDocumentToLibrary(
  documentId: string,
  entityId: string,
  category?: string
) {
  try {
    // Buscar informações do documento
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single()

    if (docError) throw docError

    // Adicionar à biblioteca pública
    const { data, error } = await supabase
      .from("public_library")
      .insert({
        entity_id: entityId,
        document_id: document.id,
        title: document.title,
        description: document.description,
        file_path: document.file_path,
        file_name: document.file_name,
        file_size: document.file_size,
        file_type: document.file_type,
        category: category || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    console.log("✅ Documento adicionado à biblioteca:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Erro ao adicionar documento:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 2: Criar novo documento na biblioteca
// ============================================================================
export async function createNewLibraryDocument(
  entityId: string,
  title: string,
  description: string,
  category?: string
) {
  try {
    const { data, error } = await supabase
      .from("public_library")
      .insert({
        entity_id: entityId,
        title,
        description,
        category: category || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    console.log("✅ Novo documento criado na biblioteca:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Erro ao criar documento:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 3: Listar documentos da biblioteca de uma entidade
// ============================================================================
export async function getLibraryDocuments(entityId: string) {
  try {
    const { data, error } = await supabase
      .from("public_library")
      .select("*")
      .eq("entity_id", entityId)
      .order("display_order", { ascending: true })

    if (error) throw error

    console.log(`✅ ${data.length} documentos encontrados`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Erro ao buscar documentos:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 4: Buscar documentos públicos por slug
// ============================================================================
export async function getPublicLibraryBySlug(slug: string) {
  try {
    // Buscar primeiro item para pegar o entity_id
    const { data: firstItem, error: firstError } = await supabase
      .from("public_library")
      .select("entity_id")
      .eq("public_slug", slug)
      .eq("is_active", true)
      .single()

    if (firstError) throw firstError

    // Buscar todos os documentos ativos da entidade
    const { data: items, error: itemsError } = await supabase
      .from("public_library")
      .select("*")
      .eq("entity_id", firstItem.entity_id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (itemsError) throw itemsError

    // Buscar informações da entidade
    const { data: entity, error: entityError } = await supabase
      .from("entities")
      .select("name, logo_url")
      .eq("id", firstItem.entity_id)
      .single()

    if (entityError) throw entityError

    console.log(`✅ Biblioteca pública encontrada: ${entity.name}`)
    return { success: true, items, entity }
  } catch (error) {
    console.error("❌ Erro ao buscar biblioteca pública:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 5: Ativar/Desativar documento
// ============================================================================
export async function toggleDocumentActive(documentId: string, isActive: boolean) {
  try {
    const { data, error } = await supabase
      .from("public_library")
      .update({ is_active: isActive })
      .eq("id", documentId)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Documento ${isActive ? "ativado" : "desativado"}`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Erro ao atualizar status:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 6: Remover documento da biblioteca
// ============================================================================
export async function removeFromLibrary(documentId: string) {
  try {
    const { error } = await supabase
      .from("public_library")
      .delete()
      .eq("id", documentId)

    if (error) throw error

    console.log("✅ Documento removido da biblioteca")
    return { success: true }
  } catch (error) {
    console.error("❌ Erro ao remover documento:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 7: Atualizar ordem de exibição
// ============================================================================
export async function updateDisplayOrder(documentId: string, order: number) {
  try {
    const { data, error } = await supabase
      .from("public_library")
      .update({ display_order: order })
      .eq("id", documentId)
      .select()
      .single()

    if (error) throw error

    console.log("✅ Ordem de exibição atualizada")
    return { success: true, data }
  } catch (error) {
    console.error("❌ Erro ao atualizar ordem:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 8: Buscar documentos por categoria
// ============================================================================
export async function getDocumentsByCategory(entityId: string, category: string) {
  try {
    const { data, error } = await supabase
      .from("public_library")
      .select("*")
      .eq("entity_id", entityId)
      .eq("category", category)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) throw error

    console.log(`✅ ${data.length} documentos encontrados na categoria "${category}"`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Erro ao buscar documentos por categoria:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO 9: Gerar link público
// ============================================================================
export function generatePublicLink(slug: string, baseUrl?: string) {
  const base = baseUrl || window.location.origin
  return `${base}/biblioteca-publica/${slug}`
}

// ============================================================================
// EXEMPLO 10: Copiar link para clipboard
// ============================================================================
export async function copyPublicLinkToClipboard(slug: string) {
  try {
    const link = generatePublicLink(slug)
    await navigator.clipboard.writeText(link)
    console.log("✅ Link copiado para a área de transferência")
    return { success: true, link }
  } catch (error) {
    console.error("❌ Erro ao copiar link:", error)
    return { success: false, error }
  }
}

// ============================================================================
// EXEMPLO DE USO COMPLETO
// ============================================================================
export async function exampleUsage() {
  // 1. Adicionar documento existente
  const result1 = await addExistingDocumentToLibrary(
    "doc-uuid-123",
    "entity-uuid-456",
    "Políticas"
  )

  // 2. Criar novo documento
  const result2 = await createNewLibraryDocument(
    "entity-uuid-456",
    "Manual do Usuário",
    "Guia completo de uso da plataforma",
    "Manuais"
  )

  // 3. Listar documentos
  const result3 = await getLibraryDocuments("entity-uuid-456")

  // 4. Buscar biblioteca pública
  const result4 = await getPublicLibraryBySlug("abc123def456")

  // 5. Ativar documento
  const result5 = await toggleDocumentActive("library-doc-uuid", true)

  // 6. Copiar link
  const result6 = await copyPublicLinkToClipboard("abc123def456")

  console.log("Exemplos executados com sucesso!")
}

// ============================================================================
// TIPOS TYPESCRIPT
// ============================================================================
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

export interface Entity {
  name: string
  logo_url: string | null
}

export interface PublicLibraryResponse {
  success: boolean
  items?: PublicLibraryItem[]
  entity?: Entity
  error?: any
}
