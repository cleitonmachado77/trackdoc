#!/usr/bin/env node

/**
 * Script simples para testar conexão com Supabase
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testando conexão com Supabase...')
console.log('📋 URL:', supabaseUrl)
console.log('📋 Service Key:', supabaseServiceKey ? 'Configurada' : 'Não configurada')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('🔄 Testando conexão...')
    
    // Teste simples - buscar uma tabela
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error)
      return false
    }
    
    console.log('✅ Conexão bem-sucedida!')
    console.log('📊 Dados recebidos:', data)
    
    return true
  } catch (error) {
    console.error('❌ Erro de conexão:', error)
    return false
  }
}

async function main() {
  const success = await testConnection()
  
  if (success) {
    console.log('\n✅ Teste de conexão concluído com sucesso!')
    console.log('🎯 Agora você pode executar o script de correção')
  } else {
    console.log('\n❌ Falha no teste de conexão')
    console.log('💡 Verifique:')
    console.log('   1. URL do Supabase está correta')
    console.log('   2. Service Role Key está correta')
    console.log('   3. Conexão com internet está funcionando')
  }
}

main().catch(console.error)
