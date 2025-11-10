/**
 * Testes de exemplo para a funcionalidade Biblioteca Pública
 * 
 * Este arquivo contém exemplos de testes que podem ser executados
 * para verificar se a funcionalidade está funcionando corretamente.
 * 
 * Nota: Estes são exemplos educacionais. Para testes reais, use
 * frameworks como Jest, Vitest ou Cypress.
 */

import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================================================
// TESTE 1: Verificar se a tabela existe
// ============================================================================
export async function testTableExists() {
  console.log("🧪 Teste 1: Verificando se a tabela existe...")
  
  try {
    const { data, error } = await supabase
      .from("public_library")
      .select("count")
      .limit(1)

    if (error) {
      console.error("❌ FALHOU: Tabela não existe ou não está acessível")
      console.error("Erro:", error.message)
      return false
    }

    console.log("✅ PASSOU: Tabela existe e está acessível")
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao verificar tabela")
    console.error(error)
    return false
  }
}

// ============================================================================
// TESTE 2: Criar um documento de teste
// ============================================================================
export async function testCreateDocument(entityId: string) {
  console.log("🧪 Teste 2: Criando documento de teste...")
  
  try {
    const testDocument = {
      entity_id: entityId,
      title: "Documento de Teste",
      description: "Este é um documento de teste criado automaticamente",
      category: "Testes",
      is_active: true,
    }

    const { data, error } = await supabase
      .from("public_library")
      .insert(testDocument)
      .select()
      .single()

    if (error) {
      console.error("❌ FALHOU: Não foi possível criar documento")
      console.error("Erro:", error.message)
      return { success: false, data: null }
    }

    console.log("✅ PASSOU: Documento criado com sucesso")
    console.log("ID:", data.id)
    console.log("Slug:", data.public_slug)
    return { success: true, data }
  } catch (error) {
    console.error("❌ FALHOU: Erro ao criar documento")
    console.error(error)
    return { success: false, data: null }
  }
}

// ============================================================================
// TESTE 3: Verificar se o slug foi gerado automaticamente
// ============================================================================
export async function testSlugGeneration(documentId: string) {
  console.log("🧪 Teste 3: Verificando geração automática de slug...")
  
  try {
    const { data, error } = await supabase
      .from("public_library")
      .select("public_slug")
      .eq("id", documentId)
      .single()

    if (error) {
      console.error("❌ FALHOU: Não foi possível buscar documento")
      console.error("Erro:", error.message)
      return false
    }

    if (!data.public_slug || data.public_slug.length === 0) {
      console.error("❌ FALHOU: Slug não foi gerado")
      return false
    }

    console.log("✅ PASSOU: Slug gerado automaticamente:", data.public_slug)
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao verificar slug")
    console.error(error)
    return false
  }
}

// ============================================================================
// TESTE 4: Atualizar documento
// ============================================================================
export async function testUpdateDocument(documentId: string) {
  console.log("🧪 Teste 4: Atualizando documento...")
  
  try {
    const updates = {
      title: "Documento de Teste (Atualizado)",
      description: "Descrição atualizada",
    }

    const { data, error } = await supabase
      .from("public_library")
      .update(updates)
      .eq("id", documentId)
      .select()
      .single()

    if (error) {
      console.error("❌ FALHOU: Não foi possível atualizar documento")
      console.error("Erro:", error.message)
      return false
    }

    if (data.title !== updates.title) {
      console.error("❌ FALHOU: Título não foi atualizado corretamente")
      return false
    }

    console.log("✅ PASSOU: Documento atualizado com sucesso")
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao atualizar documento")
    console.error(error)
    return false
  }
}

// ============================================================================
// TESTE 5: Ativar/Desativar documento
// ============================================================================
export async function testToggleActive(documentId: string) {
  console.log("🧪 Teste 5: Testando ativar/desativar documento...")
  
  try {
    // Desativar
    const { data: deactivated, error: deactivateError } = await supabase
      .from("public_library")
      .update({ is_active: false })
      .eq("id", documentId)
      .select()
      .single()

    if (deactivateError || deactivated.is_active !== false) {
      console.error("❌ FALHOU: Não foi possível desativar documento")
      return false
    }

    // Ativar novamente
    const { data: activated, error: activateError } = await supabase
      .from("public_library")
      .update({ is_active: true })
      .eq("id", documentId)
      .select()
      .single()

    if (activateError || activated.is_active !== true) {
      console.error("❌ FALHOU: Não foi possível ativar documento")
      return false
    }

    console.log("✅ PASSOU: Ativar/Desativar funcionando corretamente")
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao testar ativar/desativar")
    console.error(error)
    return false
  }
}

// ============================================================================
// TESTE 6: Buscar documentos por entidade
// ============================================================================
export async function testGetByEntity(entityId: string) {
  console.log("🧪 Teste 6: Buscando documentos por entidade...")
  
  try {
    const { data, error } = await supabase
      .from("public_library")
      .select("*")
      .eq("entity_id", entityId)

    if (error) {
      console.error("❌ FALHOU: Não foi possível buscar documentos")
      console.error("Erro:", error.message)
      return false
    }

    console.log(`✅ PASSOU: ${data.length} documento(s) encontrado(s)`)
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao buscar documentos")
    console.error(error)
    return false
  }
}

// ============================================================================
// TESTE 7: Buscar biblioteca pública por slug (acesso público)
// ============================================================================
export async function testPublicAccess(slug: string) {
  console.log("🧪 Teste 7: Testando acesso público por slug...")
  
  try {
    // Buscar primeiro item
    const { data: firstItem, error: firstError } = await supabase
      .from("public_library")
      .select("entity_id")
      .eq("public_slug", slug)
      .eq("is_active", true)
      .single()

    if (firstError) {
      console.error("❌ FALHOU: Não foi possível acessar biblioteca pública")
      console.error("Erro:", firstError.message)
      return false
    }

    // Buscar todos os itens ativos
    const { data: items, error: itemsError } = await supabase
      .from("public_library")
      .select("*")
      .eq("entity_id", firstItem.entity_id)
      .eq("is_active", true)

    if (itemsError) {
      console.error("❌ FALHOU: Não foi possível buscar itens da biblioteca")
      console.error("Erro:", itemsError.message)
      return false
    }

    console.log(`✅ PASSOU: Acesso público funcionando (${items.length} itens)`)
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao testar acesso público")
    console.error(error)
    return false
  }
}

// ============================================================================
// TESTE 8: Verificar trigger de updated_at
// ============================================================================
export async function testUpdatedAtTrigger(documentId: string) {
  console.log("🧪 Teste 8: Verificando trigger de updated_at...")
  
  try {
    // Buscar updated_at original
    const { data: before, error: beforeError } = await supabase
      .from("public_library")
      .select("updated_at")
      .eq("id", documentId)
      .single()

    if (beforeError) {
      console.error("❌ FALHOU: Não foi possível buscar documento")
      return false
    }

    // Aguardar 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Atualizar documento
    await supabase
      .from("public_library")
      .update({ title: "Teste Updated At" })
      .eq("id", documentId)

    // Buscar updated_at atualizado
    const { data: after, error: afterError } = await supabase
      .from("public_library")
      .select("updated_at")
      .eq("id", documentId)
      .single()

    if (afterError) {
      console.error("❌ FALHOU: Não foi possível buscar documento atualizado")
      return false
    }

    if (new Date(after.updated_at) <= new Date(before.updated_at)) {
      console.error("❌ FALHOU: updated_at não foi atualizado automaticamente")
      return false
    }

    console.log("✅ PASSOU: Trigger de updated_at funcionando")
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao testar trigger")
    console.error(error)
    return false
  }
}

// ============================================================================
// TESTE 9: Deletar documento
// ============================================================================
export async function testDeleteDocument(documentId: string) {
  console.log("🧪 Teste 9: Deletando documento de teste...")
  
  try {
    const { error } = await supabase
      .from("public_library")
      .delete()
      .eq("id", documentId)

    if (error) {
      console.error("❌ FALHOU: Não foi possível deletar documento")
      console.error("Erro:", error.message)
      return false
    }

    // Verificar se foi deletado
    const { data, error: checkError } = await supabase
      .from("public_library")
      .select("id")
      .eq("id", documentId)
      .single()

    if (!checkError || data) {
      console.error("❌ FALHOU: Documento ainda existe após deleção")
      return false
    }

    console.log("✅ PASSOU: Documento deletado com sucesso")
    return true
  } catch (error) {
    console.error("❌ FALHOU: Erro ao deletar documento")
    console.error(error)
    return false
  }
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================
export async function runAllTests(entityId: string) {
  console.log("\n" + "=".repeat(60))
  console.log("🧪 INICIANDO SUITE DE TESTES - BIBLIOTECA PÚBLICA")
  console.log("=".repeat(60) + "\n")

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  }

  let testDocumentId: string | null = null
  let testSlug: string | null = null

  // Teste 1: Verificar tabela
  results.total++
  if (await testTableExists()) {
    results.passed++
  } else {
    results.failed++
    console.log("\n⚠️ Testes interrompidos: Tabela não existe\n")
    return results
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 2: Criar documento
  results.total++
  const createResult = await testCreateDocument(entityId)
  if (createResult.success && createResult.data) {
    results.passed++
    testDocumentId = createResult.data.id
    testSlug = createResult.data.public_slug
  } else {
    results.failed++
    console.log("\n⚠️ Testes interrompidos: Não foi possível criar documento\n")
    return results
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 3: Verificar slug
  results.total++
  if (await testSlugGeneration(testDocumentId!)) {
    results.passed++
  } else {
    results.failed++
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 4: Atualizar documento
  results.total++
  if (await testUpdateDocument(testDocumentId!)) {
    results.passed++
  } else {
    results.failed++
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 5: Ativar/Desativar
  results.total++
  if (await testToggleActive(testDocumentId!)) {
    results.passed++
  } else {
    results.failed++
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 6: Buscar por entidade
  results.total++
  if (await testGetByEntity(entityId)) {
    results.passed++
  } else {
    results.failed++
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 7: Acesso público
  results.total++
  if (testSlug && await testPublicAccess(testSlug)) {
    results.passed++
  } else {
    results.failed++
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 8: Trigger updated_at
  results.total++
  if (await testUpdatedAtTrigger(testDocumentId!)) {
    results.passed++
  } else {
    results.failed++
  }

  console.log("\n" + "-".repeat(60) + "\n")

  // Teste 9: Deletar documento
  results.total++
  if (await testDeleteDocument(testDocumentId!)) {
    results.passed++
  } else {
    results.failed++
  }

  // Resumo
  console.log("\n" + "=".repeat(60))
  console.log("📊 RESUMO DOS TESTES")
  console.log("=".repeat(60))
  console.log(`Total de testes: ${results.total}`)
  console.log(`✅ Passou: ${results.passed}`)
  console.log(`❌ Falhou: ${results.failed}`)
  console.log(`📈 Taxa de sucesso: ${((results.passed / results.total) * 100).toFixed(1)}%`)
  console.log("=".repeat(60) + "\n")

  if (results.failed === 0) {
    console.log("🎉 TODOS OS TESTES PASSARAM! 🎉\n")
  } else {
    console.log("⚠️ ALGUNS TESTES FALHARAM ⚠️\n")
  }

  return results
}

// ============================================================================
// EXEMPLO DE USO
// ============================================================================
// Para executar os testes, chame:
// runAllTests("your-entity-id-here")
