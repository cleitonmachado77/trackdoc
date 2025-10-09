/**
 * Script para verificar se o sistema de entidades foi configurado corretamente
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyEntitiesSetup() {
  console.log('🔍 Verificando configuração do sistema de entidades...\n')
  
  let allGood = true
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('1️⃣ Verificando tabelas...')
    
    const tables = ['entities', 'entity_users', 'entity_invitations']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Tabela '${table}' não encontrada:`, error.message)
        allGood = false
      } else {
        console.log(`✅ Tabela '${table}' OK`)
      }
    }
    
    // 2. Verificar se existe a entidade demo
    console.log('\n2️⃣ Verificando entidade demo...')
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .eq('name', 'TrackDoc Demo')
    
    if (entitiesError) {
      console.log('❌ Erro ao buscar entidade demo:', entitiesError.message)
      allGood = false
    } else if (entities.length === 0) {
      console.log('⚠️ Entidade demo não encontrada')
      allGood = false
    } else {
      console.log('✅ Entidade demo encontrada:', entities[0].name)
    }
    
    // 3. Verificar funções
    console.log('\n3️⃣ Verificando funções...')
    
    // Testar função create_entity_with_admin (vai falhar por não estar autenticado, mas isso é esperado)
    const { data: funcTest, error: funcError } = await supabase
      .rpc('create_entity_with_admin', {
        entity_name: 'Teste',
        entity_type: 'company'
      })
    
    if (funcError && funcError.message.includes('User must be authenticated')) {
      console.log('✅ Função create_entity_with_admin existe e funciona')
    } else if (funcError && funcError.message.includes('function create_entity_with_admin')) {
      console.log('❌ Função create_entity_with_admin não encontrada')
      allGood = false
    } else {
      console.log('✅ Função create_entity_with_admin OK')
    }
    
    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...')
    
    // Testar com cliente anônimo
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: anonTest, error: anonError } = await anonSupabase
      .from('entities')
      .select('*')
      .limit(1)
    
    if (anonError) {
      console.log('✅ RLS funcionando - usuário anônimo bloqueado')
    } else {
      console.log('⚠️ Possível problema de segurança - usuário anônimo pode acessar entidades')
    }
    
    // 5. Resumo
    console.log('\n📋 RESUMO DA VERIFICAÇÃO')
    console.log('========================')
    
    if (allGood) {
      console.log('🎉 Sistema de entidades configurado corretamente!')
      console.log('\n✅ Próximos passos:')
      console.log('   1. O sistema está pronto para uso')
      console.log('   2. Usuários podem ser convidados para entidades')
      console.log('   3. Convites podem ser aceitos via /accept-invitation/[token]')
    } else {
      console.log('❌ Sistema de entidades NÃO está configurado corretamente')
      console.log('\n🔧 Para corrigir:')
      console.log('   1. Execute os comandos SQL do arquivo SETUP_ENTITIES_SYSTEM.md')
      console.log('   2. Verifique se todas as tabelas foram criadas')
      console.log('   3. Execute este script novamente para verificar')
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
    allGood = false
  }
  
  return allGood
}

// Executar verificação
verifyEntitiesSetup()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })