"use server"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Tipos para as entidades
interface Category {
  id: number
  name: string
  description: string
  color: string
  status: "active" | "inactive"
}

interface Department {
  id: string
  name: string
  description?: string
  manager_id?: string
  entity_id?: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

interface DocumentType {
  id: string
  name: string
  prefix: string
  color: string
  requiredFields: string[]
  approvalRequired: boolean
  retentionPeriod: number
  status: "active" | "inactive"
  template: string | null
  documentsCount: number
}

/* --- CATEGORIES --- */
export async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseServerClient()
  
  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return []
    }
    
    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()
    
    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return []
    }
    
    // Buscar categorias da entidade do usuário OU sem entidade (criadas por usuários únicos)
    let query = supabase
      .from("categories")
      .select("*")
      .order("name")
    
    // Se o usuário tem entidade, buscar apenas as categorias da sua entidade
    if (profileData?.entity_id) {
      query = query.eq("entity_id", profileData.entity_id)
    } else {
      // Se o usuário não tem entidade, buscar apenas as categorias sem entidade (criadas por ele)
      query = query.is("entity_id", null)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error("Erro ao buscar categorias:", error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error("Erro inesperado ao buscar categorias:", error)
    return []
  }
}

export async function createCategory(categoryData: Omit<Category, "id">) {
  const supabase = createSupabaseServerClient()
  
  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return { success: false, error: "Usuário não autenticado" }
    }
    
    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()
    
    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return { success: false, error: "Erro ao buscar perfil do usuário" }
    }
    
    // Criar categoria com entity_id
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        status: categoryData.status,
        entity_id: profileData?.entity_id || null, // Atrelar à entidade do usuário
      })
      .select()
      .single()
    
    if (error) {
      console.error("Erro ao criar categoria:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/admin/categories")
    return { success: true, data }
  } catch (error) {
    console.error("Erro inesperado ao criar categoria:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function updateCategory(id: number, categoryData: Partial<Category>) {
  const supabase = createSupabaseServerClient()
  
  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return { success: false, error: "Usuário não autenticado" }
    }
    
    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()
    
    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return { success: false, error: "Erro ao buscar perfil do usuário" }
    }
    
    // Verificar se a categoria pertence à entidade do usuário
    const { data: existingCategory, error: checkError } = await supabase
      .from("categories")
      .select("entity_id")
      .eq("id", id)
      .single()
    
    if (checkError) {
      console.error("Erro ao verificar categoria:", checkError)
      return { success: false, error: "Categoria não encontrada" }
    }
    
    // Verificar se o usuário tem permissão para editar esta categoria
    if (profileData?.entity_id) {
      // Usuário tem entidade - só pode editar categorias da sua entidade
      if (existingCategory?.entity_id !== profileData.entity_id) {
        return { success: false, error: "Sem permissão para editar esta categoria" }
      }
    } else {
      // Usuário sem entidade - só pode editar categorias sem entidade
      if (existingCategory?.entity_id !== null) {
        return { success: false, error: "Sem permissão para editar esta categoria" }
      }
    }
    
    // Atualizar categoria
    const { data, error } = await supabase
      .from("categories")
      .update({
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        status: categoryData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Erro ao atualizar categoria:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/admin/categories")
    return { success: true, data }
  } catch (error) {
    console.error("Erro inesperado ao atualizar categoria:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function deleteCategory(id: number) {
  const supabase = createSupabaseServerClient()
  
  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return { success: false, error: "Usuário não autenticado" }
    }
    
    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()
    
    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return { success: false, error: "Erro ao buscar perfil do usuário" }
    }
    
    // Verificar se a categoria pertence à entidade do usuário
    const { data: existingCategory, error: checkError } = await supabase
      .from("categories")
      .select("entity_id")
      .eq("id", id)
      .single()
    
    if (checkError) {
      console.error("Erro ao verificar categoria:", checkError)
      return { success: false, error: "Categoria não encontrada" }
    }
    
    // Verificar se o usuário tem permissão para deletar esta categoria
    if (profileData?.entity_id) {
      // Usuário tem entidade - só pode deletar categorias da sua entidade
      if (existingCategory?.entity_id !== profileData.entity_id) {
        return { success: false, error: "Sem permissão para deletar esta categoria" }
      }
    } else {
      // Usuário sem entidade - só pode deletar categorias sem entidade
      if (existingCategory?.entity_id !== null) {
        return { success: false, error: "Sem permissão para deletar esta categoria" }
      }
    }
    
    // Verificar se há documentos vinculados a esta categoria
    const { count: docCount, error: countError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id)
    
    if (countError) {
      console.error("Erro ao verificar documentos:", countError)
      return { success: false, error: "Erro ao verificar dependências" }
    }
    
    if (docCount && docCount > 0) {
      return { success: false, error: `Não é possível deletar a categoria. Existem ${docCount} documento(s) vinculado(s).` }
    }
    
    // Deletar categoria
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Erro ao deletar categoria:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error) {
    console.error("Erro inesperado ao deletar categoria:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

/* --- DEPARTMENTS --- */
export async function getDepartments(): Promise<Department[]> {
  const supabase = createSupabaseServerClient()

  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return []
    }

    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return []
    }

    // Buscar departamentos da entidade do usuário
    const { data, error } = await supabase
      .from("departments")
      .select(`
        *,
        manager:profiles!departments_manager_id_fkey(full_name)
      `)
      .eq("entity_id", profileData?.entity_id || 'ebde2fef-30e2-458b-8721-d86df2f6865b')
      .order("name")

    if (error) {
      console.error("Erro ao buscar departamentos:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro inesperado ao buscar departamentos:", error)
    return []
  }
}

export async function createDepartment(departmentData: Omit<Department, "id">) {
  const supabase = createSupabaseServerClient()

  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return { success: false, error: "Usuário não autenticado" }
    }

    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return { success: false, error: "Erro ao buscar perfil do usuário" }
    }

    // Criar departamento com entity_id
    const { data, error } = await supabase
      .from("departments")
      .insert({
        name: departmentData.name,
        description: departmentData.description,
        manager_id: departmentData.manager_id === "" ? null : departmentData.manager_id,
        status: departmentData.status || 'active',
        entity_id: profileData?.entity_id || 'ebde2fef-30e2-458b-8721-d86df2f6865b'
      })
      .select(`
        *,
        manager:profiles!departments_manager_id_fkey(full_name)
      `)
      .single()

    if (error) {
      console.error("Erro ao criar departamento:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/departments")
    return { success: true, data }
  } catch (error) {
    console.error("Erro inesperado ao criar departamento:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function updateDepartment(id: string, departmentData: Partial<Department>) {
  const supabase = createSupabaseServerClient()

  try {
    // Verificar se o departamento existe e pertence à entidade do usuário
    const { data: existingDept, error: fetchError } = await supabase
      .from("departments")
      .select("entity_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingDept) {
      console.error("Erro ao buscar departamento:", fetchError)
      return { success: false, error: "Departamento não encontrado" }
    }

    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return { success: false, error: "Usuário não autenticado" }
    }

    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return { success: false, error: "Erro ao buscar perfil do usuário" }
    }

    // Verificar se o usuário pode editar este departamento
    if (existingDept.entity_id !== profileData?.entity_id) {
      return { success: false, error: "Sem permissão para editar este departamento" }
    }

    // Atualizar departamento
    const { data, error } = await supabase
      .from("departments")
      .update({
        name: departmentData.name,
        description: departmentData.description,
        manager_id: departmentData.manager_id === "" ? null : departmentData.manager_id,
        status: departmentData.status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        *,
        manager:profiles!departments_manager_id_fkey(full_name)
      `)
      .single()

    if (error) {
      console.error("Erro ao atualizar departamento:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/departments")
    return { success: true, data }
  } catch (error) {
    console.error("Erro inesperado ao atualizar departamento:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function deleteDepartment(id: string) {
  const supabase = createSupabaseServerClient()

  try {
    // Verificar se o departamento existe e pertence à entidade do usuário
    const { data: existingDept, error: fetchError } = await supabase
      .from("departments")
      .select("entity_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingDept) {
      console.error("Erro ao buscar departamento:", fetchError)
      return { success: false, error: "Departamento não encontrado" }
    }

    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return { success: false, error: "Usuário não autenticado" }
    }

    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return { success: false, error: "Erro ao buscar perfil do usuário" }
    }

    // Verificar se o usuário pode deletar este departamento
    if (existingDept.entity_id !== profileData?.entity_id) {
      return { success: false, error: "Sem permissão para deletar este departamento" }
    }

    // Verificar se há documentos vinculados a este departamento
    const { count: docCount, error: countError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("department_id", id)

    if (countError) {
      console.error("Erro ao verificar documentos:", countError)
      return { success: false, error: "Erro ao verificar dependências" }
    }

    if (docCount && docCount > 0) {
      return { success: false, error: `Não é possível deletar o departamento. Existem ${docCount} documento(s) vinculado(s).` }
    }

    // Deletar departamento
    const { error: deleteError } = await supabase
      .from("departments")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Erro ao deletar departamento:", deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath("/admin/departments")
    return { success: true }
  } catch (error) {
    console.error("Erro inesperado ao deletar departamento:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

/* --- DOCUMENT TYPES --- */
export async function getDocumentTypes(): Promise<DocumentType[]> {
  const supabase = createSupabaseServerClient()

  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return []
    }

    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return []
    }

    console.log("🔍 [getDocumentTypes] Usuário:", user.id, "Entidade:", profileData?.entity_id)

    // Buscar tipos de documento ativos da entidade do usuário OU sem entidade (criados por usuários únicos)
    let query = supabase
      .from("document_types")
      .select("*")
      .eq("status", "active")
      .order("name")

    // Se o usuário tem entidade, buscar apenas os tipos da sua entidade
    if (profileData?.entity_id) {
      query = query.eq("entity_id", profileData.entity_id)
    } else {
      // Se o usuário não tem entidade, buscar apenas os tipos sem entidade (criados por ele)
      query = query.is("entity_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar tipos de documento:", error)
      return []
    }

    console.log("🔍 [getDocumentTypes] Tipos encontrados:", data?.length || 0)

    // Mapear os dados para o formato esperado
    const mappedData = data?.map(item => ({
      id: item.id,
      name: item.name,
      prefix: item.prefix || 'DOC',
      color: item.color || '#10B981',
      requiredFields: item.required_fields || ['title', 'author'],
      approvalRequired: item.approval_required || false,
      retentionPeriod: item.retention_period || 24,
      status: item.status || 'active',
      template: item.template || null,
      documentsCount: 0
    })) || []

    return mappedData
  } catch (error) {
    console.error("Erro inesperado ao buscar tipos de documento:", error)
    return []
  }
}

export async function getDocumentsCount(): Promise<number> {
  const supabase = createSupabaseServerClient()

  try {
    // Obter usuário atual e sua entidade
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Erro ao obter usuário atual:", userError)
      return 0
    }

    // Buscar a entidade do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("entity_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return 0
    }

    // Buscar contagem de documentos da entidade do usuário
    let query = supabase
      .from("documents")
      .select("*", { count: "exact", head: true })

    // Se o usuário tem entidade, contar apenas documentos da sua entidade
    if (profileData?.entity_id) {
      query = query.eq("entity_id", profileData.entity_id)
    } else {
      // Se o usuário não tem entidade, contar apenas documentos sem entidade (criados por ele)
      query = query.is("entity_id", null)
    }

    const { count, error } = await query

    if (error) {
      console.error("Erro ao buscar contagem de documentos:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Erro inesperado ao buscar contagem de documentos:", error)
    return 0
  }
}

export async function createDocumentType(documentTypeData: Omit<DocumentType, "id">) {
  const supabase = createSupabaseServerClient()

  // Primeiro, obter o usuário atual e sua entidade
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Erro ao obter usuário atual:", userError)
    return { success: false, error: "Usuário não autenticado" }
  }

  // Buscar a entidade do usuário
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("entity_id")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Erro ao buscar perfil do usuário:", profileError)
    return { success: false, error: "Erro ao buscar perfil do usuário" }
  }

  // Usar inserção direta no banco com a entidade do usuário
  const { data, error } = await supabase
    .from("document_types")
    .insert({
      name: documentTypeData.name,
      prefix: documentTypeData.prefix,
      color: documentTypeData.color,
      required_fields: documentTypeData.requiredFields,
      approval_required: documentTypeData.approvalRequired,
      retention_period: documentTypeData.retentionPeriod,
      status: documentTypeData.status,
      template: documentTypeData.template,
      entity_id: profileData?.entity_id || null, // Atrelar à entidade do usuário
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar tipo de documento:", error)
    
    // Tratar erro de duplicata de forma mais amigável
    if (error.message.includes('duplicate key value violates unique constraint')) {
      if (error.message.includes('document_types_name_key') || error.message.includes('document_types_name_entity_unique')) {
        return { success: false, error: "Já existe um tipo de documento com este nome. Escolha um nome diferente." }
      }
    }
    
    return { success: false, error: error.message }
  }

  // Mapear os dados retornados para o formato esperado pelo componente
  const mappedData = {
    id: data.id,
    name: data.name,
    prefix: data.prefix || 'DOC',
    color: data.color || '#10B981',
    requiredFields: data.required_fields || ['title', 'author'],
    approvalRequired: data.approval_required || false,
    retentionPeriod: data.retention_period || 24,
    status: data.status || 'active',
    template: data.template,
    documentsCount: 0 // Será calculado posteriormente se necessário
  }

  // Removido revalidatePath para evitar quebra de layout
  return { success: true, data: mappedData }
}

export async function updateDocumentType(id: string, documentTypeData: Partial<DocumentType>) {
  const supabase = createSupabaseServerClient()

  // Primeiro, obter o usuário atual e sua entidade
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Erro ao obter usuário atual:", userError)
    return { success: false, error: "Usuário não autenticado" }
  }

  // Buscar a entidade do usuário
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("entity_id")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Erro ao buscar perfil do usuário:", profileError)
    return { success: false, error: "Erro ao buscar perfil do usuário" }
  }

  // Verificar se o tipo de documento pertence à entidade do usuário
  const { data: existingType, error: checkError } = await supabase
    .from("document_types")
    .select("entity_id")
    .eq("id", id)
    .single()

  if (checkError) {
    console.error("Erro ao verificar tipo de documento:", checkError)
    return { success: false, error: "Tipo de documento não encontrado" }
  }

  // Verificar se o usuário tem permissão para editar este tipo
  // Usuários com entidade só podem editar tipos da sua entidade
  // Usuários sem entidade só podem editar tipos sem entidade (criados por eles)
  if (profileData?.entity_id) {
    // Usuário tem entidade - só pode editar tipos da sua entidade
    if (existingType?.entity_id !== profileData.entity_id) {
      return { success: false, error: "Sem permissão para editar este tipo de documento" }
    }
  } else {
    // Usuário sem entidade - só pode editar tipos sem entidade
    if (existingType?.entity_id !== null) {
      return { success: false, error: "Sem permissão para editar este tipo de documento" }
    }
  }

  // Usar atualização direta no banco
  const { data, error } = await supabase
    .from("document_types")
    .update({
      name: documentTypeData.name,
      prefix: documentTypeData.prefix,
      color: documentTypeData.color,
      required_fields: documentTypeData.requiredFields,
      approval_required: documentTypeData.approvalRequired,
      retention_period: documentTypeData.retentionPeriod,
      status: documentTypeData.status,
      template: documentTypeData.template,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar tipo de documento:", error)
    return { success: false, error: error.message }
  }

  // Mapear os dados retornados para o formato esperado pelo componente
  const mappedData = {
    id: data.id,
    name: data.name,
    prefix: data.prefix || 'DOC',
    color: data.color || '#10B981',
    requiredFields: data.required_fields || ['title', 'author'],
    approvalRequired: data.approval_required || false,
    retentionPeriod: data.retention_period || 24,
    status: data.status || 'active',
    template: data.template,
    documentsCount: 0 // Será calculado posteriormente se necessário
  }

  // Removido revalidatePath para evitar quebra de layout
  return { success: true, data: mappedData }
}

export async function deleteDocumentType(id: string) {
  const supabase = createSupabaseServerClient()

  // Primeiro, obter o usuário atual e sua entidade
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Erro ao obter usuário atual:", userError)
    return { success: false, error: "Usuário não autenticado" }
  }

  // Buscar a entidade do usuário
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("entity_id")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Erro ao buscar perfil do usuário:", profileError)
    return { success: false, error: "Erro ao buscar perfil do usuário" }
  }

  // Verificar se o tipo de documento pertence à entidade do usuário
  const { data: existingType, error: checkError } = await supabase
    .from("document_types")
    .select("entity_id")
    .eq("id", id)
    .single()

  if (checkError) {
    console.error("Erro ao verificar tipo de documento:", checkError)
    return { success: false, error: "Tipo de documento não encontrado" }
  }

  // Verificar se o usuário tem permissão para deletar este tipo
  // Usuários com entidade só podem deletar tipos da sua entidade
  // Usuários sem entidade só podem deletar tipos sem entidade (criados por eles)
  if (profileData?.entity_id) {
    // Usuário tem entidade - só pode deletar tipos da sua entidade
    if (existingType?.entity_id !== profileData.entity_id) {
      return { success: false, error: "Sem permissão para deletar este tipo de documento" }
    }
  } else {
    // Usuário sem entidade - só pode deletar tipos sem entidade
    if (existingType?.entity_id !== null) {
      return { success: false, error: "Sem permissão para deletar este tipo de documento" }
    }
  }

  // Usar exclusão direta no banco
  const { error } = await supabase
    .from("document_types")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Erro ao deletar tipo de documento:", error)
    return { success: false, error: error.message }
  }

  // Removido revalidatePath para evitar quebra de layout
  return { success: true }
}
