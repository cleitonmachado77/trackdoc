/**
 * Script simples para testar conectividade com Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testando conectividade com Supabase...\n')

console.log('📋 Configurações:')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO DEFINIDA')
console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NÃO DEFINIDA')
console.log('Proxy:', process.env.NEXT_PUBLIC_ENABLE_PROXY)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configurações básicas não encontradas')
  process.exit(1)
}

async function testConnection() {
  try {
    // 1. Testar com chave anônima
    console.log('\n1️⃣ Testando com chave anônima...')
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const { data, error } = await anonClient.auth.getSession()
      if (error) {
        console.log('⚠️ Erro na sessão (esperado):', error.message)
      } else {
        console.log('✅ Conexão anônima OK')
      }
    } catch (err) {
      console.log('❌ Erro de conectividade anônima:', err.message)
      return false
    }
    
    // 2. Testar com service role (se disponível)
    if (supabaseServiceKey) {
      console.log('\n2️⃣ Testando com service role...')
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
      
      try {
        // Tentar uma operação simples
        const { data, error } = await serviceClient
          .from('profiles')
          .select('count')
          .limit(1)
        
        if (error) {
          console.log('⚠️ Erro ao acessar profiles:', error.message)
          
          // Se for erro de RLS, a conexão está OK
          if (error.message.includes('RLS') || error.message.includes('policy')) {
            console.log('✅ Conexão service role OK (erro de RLS esperado)')
            return true
          }
        } else {
          console.log('✅ Conexão service role OK')
          return true
        }
      } catch (err) {
        console.log('❌ Erro de conectividade service role:', err.message)
        return false
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    return false
  }
}

// Executar teste
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Conectividade OK! O problema pode ser específico das tabelas ou RLS.')
    } else {
      console.log('\n❌ Problema de conectividade detectado.')
      console.log('\n🔧 Possíveis soluções:')
      console.log('1. Verificar se o Supabase está online')
      console.log('2. Verificar configurações de proxy/firewall')
      console.log('3. Verificar se as chaves estão corretas')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })