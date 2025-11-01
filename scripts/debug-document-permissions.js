#!/usr/bin/env node

/**
 * Script para debugar permissões de documentos
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugDocumentPermissions() {
  console.log('🔍 Debugando permissões de documentos...\n')

  try {
    // 1. Listar todos os documentos
    console.log('1. Listando documentos...')
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, author_id, is_public')
      .order('created_at', { ascending: false })
      .limit(10)

    if (docsError) {
      console.error('❌ Erro ao buscar documentos:', docsError)
      return
    }

    console.log(`📄 Encontrados ${documents?.length || 0} documentos:`)
    documents?.forEach((doc, index) => {
      console.log(`   ${index + 1}. "${doc.title}" (ID: ${doc.id})`)
      console.log(`      - Autor: ${doc.author_id}`)
      console.log(`      - Público: ${doc.is_public ? 'Sim' : 'Não'}`)
    })

    // 2. Listar todas as permissões
    console.log('\n2. Listando permissões de documentos...')
    const { data: permissions, error: permError } = await supabase
      .from('document_permissions')
      .select(`
        id,
        document_id,
        user_id,
        department_id,
        permission_type,
        granted_by,
        granted_at
      `)
      .order('granted_at', { ascending: false })

    if (permError) {
      console.error('❌ Erro ao buscar permissões:', permError)
      return
    }

    console.log(`🔒 Encontradas ${permissions?.length || 0} permissões:`)
    permissions?.forEach((perm, index) => {
      console.log(`   ${index + 1}. Documento: ${perm.document_id}`)
      console.log(`      - Tipo: ${perm.permission_type}`)
      console.log(`      - Usuário: ${perm.user_id || 'N/A'}`)
      console.log(`      - Departamento: ${perm.department_id || 'N/A'}`)
      console.log(`      - Concedido por: ${perm.granted_by}`)
      console.log(`      - Data: ${new Date(perm.granted_at).toLocaleString('pt-BR')}`)
    })

    // 3. Listar usuários
    console.log('\n3. Listando usuários...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, department_id')
      .limit(10)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }

    console.log(`👥 Encontrados ${users?.length || 0} usuários:`)
    users?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.email})`)
      console.log(`      - ID: ${user.id}`)
      console.log(`      - Departamento: ${user.department_id || 'N/A'}`)
    })

    // 4. Listar departamentos
    console.log('\n4. Listando departamentos...')
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')

    if (deptError) {
      console.error('❌ Erro ao buscar departamentos:', deptError)
      return
    }

    console.log(`🏢 Encontrados ${departments?.length || 0} departamentos:`)
    departments?.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (ID: ${dept.id})`)
    })

    // 5. Testar função de verificação de permissão
    if (documents && documents.length > 0 && users && users.length > 0) {
      console.log('\n5. Testando função de verificação de permissão...')
      const testDoc = documents[0]
      const testUser = users[0]

      console.log(`🧪 Testando acesso do usuário "${testUser.full_name}" ao documento "${testDoc.title}"`)

      const { data: hasPermission, error: funcError } = await supabase
        .rpc('check_document_permission', {
          p_document_id: testDoc.id,
          p_user_id: testUser.id,
          p_permission_type: 'read'
        })

      if (funcError) {
        console.error('❌ Erro ao testar função:', funcError)
      } else {
        console.log(`   Resultado: ${hasPermission ? '✅ TEM PERMISSÃO' : '❌ NÃO TEM PERMISSÃO'}`)
      }
    }

    console.log('\n🎉 Debug concluído!')

  } catch (error) {
    console.error('❌ Erro durante o debug:', error)
  }
}

async function main() {
  console.log('🔧 Iniciando debug de permissões de documentos...\n')
  await debugDocumentPermissions()
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { debugDocumentPermissions }