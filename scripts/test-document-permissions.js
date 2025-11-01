#!/usr/bin/env node

/**
 * Script para testar a funcionalidade de permissões de documentos
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

async function testDocumentPermissions() {
  console.log('🧪 Testando funcionalidade de permissões de documentos...\n')

  try {
    // 1. Verificar se a tabela document_permissions existe
    console.log('1. Verificando tabela document_permissions...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'document_permissions')

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError)
      return false
    }

    if (!tables || tables.length === 0) {
      console.error('❌ Tabela document_permissions não encontrada')
      console.log('💡 Execute: node scripts/run-migration.js 20250201_create_document_permissions_table.sql')
      return false
    }

    console.log('✅ Tabela document_permissions encontrada')

    // 2. Verificar função check_document_permission
    console.log('\n2. Verificando função check_document_permission...')
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'check_document_permission')

    if (functionsError) {
      console.error('❌ Erro ao verificar funções:', functionsError)
      return false
    }

    if (!functions || functions.length === 0) {
      console.error('❌ Função check_document_permission não encontrada')
      return false
    }

    console.log('✅ Função check_document_permission encontrada')

    // 3. Verificar estrutura da tabela
    console.log('\n3. Verificando estrutura da tabela...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'document_permissions')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError)
      return false
    }

    console.log('📋 Colunas da tabela document_permissions:')
    columns?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`)
    })

    // 4. Verificar índices
    console.log('\n4. Verificando índices...')
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'document_permissions')

    if (indexesError) {
      console.error('❌ Erro ao verificar índices:', indexesError)
      return false
    }

    console.log('📊 Índices da tabela document_permissions:')
    indexes?.forEach(idx => {
      console.log(`   - ${idx.indexname}`)
    })

    // 5. Testar inserção de permissão (se houver dados de teste)
    console.log('\n5. Verificando dados de teste...')
    
    // Buscar um documento de exemplo
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, author_id')
      .limit(1)

    if (docsError) {
      console.error('❌ Erro ao buscar documentos:', docsError)
      return false
    }

    if (!documents || documents.length === 0) {
      console.log('⚠️  Nenhum documento encontrado para teste')
      console.log('💡 Crie alguns documentos primeiro para testar completamente')
    } else {
      console.log(`✅ Documento de exemplo encontrado: "${documents[0].title}"`)
    }

    // Buscar um departamento de exemplo
    const { data: departments, error: deptsError } = await supabase
      .from('departments')
      .select('id, name')
      .limit(1)

    if (deptsError) {
      console.error('❌ Erro ao buscar departamentos:', deptsError)
      return false
    }

    if (!departments || departments.length === 0) {
      console.log('⚠️  Nenhum departamento encontrado para teste')
      console.log('💡 Crie alguns departamentos primeiro para testar completamente')
    } else {
      console.log(`✅ Departamento de exemplo encontrado: "${departments[0].name}"`)
    }

    // 6. Verificar políticas RLS
    console.log('\n6. Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'document_permissions')

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError)
      return false
    }

    if (!policies || policies.length === 0) {
      console.log('⚠️  Nenhuma política RLS encontrada')
    } else {
      console.log('🔒 Políticas RLS encontradas:')
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    }

    console.log('\n🎉 Teste concluído com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('1. Teste a funcionalidade na interface web')
    console.log('2. Crie documentos com diferentes níveis de visibilidade')
    console.log('3. Teste as permissões com diferentes usuários')
    console.log('4. Verifique se a filtragem está funcionando corretamente')

    return true

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
    return false
  }
}

async function main() {
  console.log('🔧 Iniciando teste de permissões de documentos...\n')
  
  const success = await testDocumentPermissions()
  
  if (success) {
    console.log('\n✅ Todos os testes passaram!')
  } else {
    console.log('\n❌ Alguns testes falharam')
    process.exit(1)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testDocumentPermissions }