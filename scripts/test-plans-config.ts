/**
 * Script para testar a configuração dos planos
 * Executa após rodar os SQLs de atualização
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface Plan {
  id: string
  name: string
  type: string
  price_monthly: number
  interval: string
  features: Record<string, boolean>
  max_users: number
  max_storage_gb: number
  usuario_adicional_preco: number | null
  armazenamento_extra_preco: number | null
  is_active: boolean
}

async function testPlansConfig() {
  console.log('='.repeat(60))
  console.log('TESTE DE CONFIGURAÇÃO DOS PLANOS')
  console.log('='.repeat(60))
  console.log()

  // Buscar planos
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('interval', 'monthly')
    .order('type')

  if (error) {
    console.error('❌ Erro ao buscar planos:', error)
    return
  }

  if (!plans || plans.length === 0) {
    console.error('❌ Nenhum plano encontrado!')
    return
  }

  console.log(`✅ ${plans.length} planos encontrados\n`)

  // Validar cada plano
  const expectedConfig = {
    basico: {
      max_users: 15,
      max_storage_gb: 10,
      features: {
        biblioteca_publica: true,
        assinatura_eletronica_simples: false,
        chat_nativo: false,
      },
      total_features: 5,
    },
    profissional: {
      max_users: 50,
      max_storage_gb: 50,
      features: {
        biblioteca_publica: true,
        assinatura_eletronica_simples: true,
        chat_nativo: false,
      },
      total_features: 6,
    },
    enterprise: {
      max_users: 70,
      max_storage_gb: 120,
      features: {
        biblioteca_publica: true,
        assinatura_eletronica_simples: true,
        assinatura_eletronica_multipla: true,
        chat_nativo: true,
        auditoria_completa: true,
      },
      total_features: 11,
    },
  }

  let allValid = true

  for (const plan of plans as Plan[]) {
    const expected = expectedConfig[plan.type as keyof typeof expectedConfig]
    
    console.log(`📋 ${plan.name} (${plan.type})`)
    console.log(`   Preço: R$ ${plan.price_monthly}/mês`)
    console.log(`   Status: ${plan.is_active ? '✅ Ativo' : '❌ Inativo'}`)
    console.log()

    // Validar limites
    const limitesOk = 
      plan.max_users === expected.max_users &&
      plan.max_storage_gb === expected.max_storage_gb

    console.log(`   Limites:`)
    console.log(`   ${limitesOk ? '✅' : '❌'} Usuários: ${plan.max_users} (esperado: ${expected.max_users})`)
    console.log(`   ${limitesOk ? '✅' : '❌'} Armazenamento: ${plan.max_storage_gb} GB (esperado: ${expected.max_storage_gb} GB)`)
    
    if (plan.usuario_adicional_preco) {
      console.log(`   💰 Usuário adicional: R$ ${plan.usuario_adicional_preco}`)
    }
    if (plan.armazenamento_extra_preco) {
      console.log(`   💰 Armazenamento extra: R$ ${plan.armazenamento_extra_preco}/GB`)
    }
    console.log()

    // Validar funcionalidades
    const features = plan.features as Record<string, boolean>
    const totalEnabled = Object.values(features).filter(v => v === true).length

    console.log(`   Funcionalidades: ${totalEnabled}/${Object.keys(features).length} habilitadas`)
    
    // Verificar funcionalidades específicas
    let featuresOk = true
    for (const [key, expectedValue] of Object.entries(expected.features)) {
      const actualValue = features[key]
      const isOk = actualValue === expectedValue
      if (!isOk) featuresOk = false
      
      const icon = isOk ? '✅' : '❌'
      const status = actualValue ? 'SIM' : 'NÃO'
      console.log(`   ${icon} ${key}: ${status} (esperado: ${expectedValue ? 'SIM' : 'NÃO'})`)
    }

    // Verificar total de funcionalidades
    const totalOk = totalEnabled === expected.total_features
    if (!totalOk) {
      console.log(`   ⚠️  Total de funcionalidades: ${totalEnabled} (esperado: ${expected.total_features})`)
      featuresOk = false
    }

    console.log()

    if (!limitesOk || !featuresOk) {
      allValid = false
      console.log(`   ❌ PLANO ${plan.name.toUpperCase()} COM PROBLEMAS!\n`)
    } else {
      console.log(`   ✅ PLANO ${plan.name.toUpperCase()} OK!\n`)
    }

    console.log('-'.repeat(60))
    console.log()
  }

  // Resultado final
  console.log('='.repeat(60))
  if (allValid) {
    console.log('✅ TODOS OS PLANOS ESTÃO CONFIGURADOS CORRETAMENTE!')
  } else {
    console.log('❌ ALGUNS PLANOS PRECISAM DE CORREÇÃO!')
    console.log('   Execute: migrations/update_plans_config.sql')
  }
  console.log('='.repeat(60))
}

// Executar teste
testPlansConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro ao executar teste:', error)
    process.exit(1)
  })
