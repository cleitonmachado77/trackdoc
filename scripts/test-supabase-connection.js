require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

console.log('🔍 Testando conexão com Supabase...')
console.log('📋 Variáveis de ambiente:')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Não encontrada')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não encontrada')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  try {
    console.log('\n🧪 Testando conexão...')
    
    // Teste 1: Buscar usuários
    console.log('1️⃣ Testando busca de usuários...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
    } else {
      console.log('✅ Usuários encontrados:', users?.length || 0)
    }

    // Teste 2: Buscar subscriptions
    console.log('\n2️⃣ Testando busca de subscriptions...')
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
    
    if (subsError) {
      console.error('❌ Erro ao buscar subscriptions:', subsError)
    } else {
      console.log('✅ Subscriptions encontradas:', subscriptions?.length || 0)
    }

    // Teste 3: Buscar plans
    console.log('\n3️⃣ Testando busca de plans...')
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(1)
    
    if (plansError) {
      console.error('❌ Erro ao buscar plans:', plansError)
    } else {
      console.log('✅ Plans encontrados:', plans?.length || 0)
    }

    console.log('\n🎉 Teste de conexão concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testConnection()
