/**
 * Script simples para testar a lógica de limites de entidade
 * Execute com: npx tsx scripts/test-entity-limits-simple.ts
 */

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testEntityLimits() {
  console.log('🧪 Testando lógica de limites de entidade...\n')

  try {
    // 1. Buscar entidades
    console.log('1️⃣ Buscando entidades...')
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('id, name, current_users, max_users')
      .limit(5)

    if (entitiesError) {
      throw new Error(`Erro ao buscar entidades: ${entitiesError.message}`)
    }

    if (!entities || entities.length === 0) {
      console.log('❌ Nenhuma entidade encontrada')
      return
    }

    console.log(`✅ Encontradas ${entities.length} entidades:`)
    entities.forEach((entity, index) => {
      console.log(`   ${index + 1}. ${entity.name} - Usuários: ${entity.current_users}/${entity.max_users}`)
    })

    // 2. Testar função SQL para cada entidade
    console.log('\n2️⃣ Testando função check_entity_user_limit...')
    
    for (const entity of entities) {
      console.log(`\n🔍 Testando entidade: ${entity.name}`)
      
      const { data: result, error: funcError } = await supabase
        .rpc('check_entity_user_limit', { p_entity_id: entity.id })

      if (funcError) {
        console.log(`   ❌ Erro: ${funcError.message}`)
        continue
      }

      if (!result || result.length === 0) {
        console.log('   ❌ Nenhum resultado retornado')
        continue
      }

      const limit = result[0]
      console.log('   📊 Resultado:')
      console.log(`      Pode criar usuário: ${limit.can_create_user ? '✅ Sim' : '❌ Não'}`)
      console.log(`      Usuários atuais: ${limit.current_users}`)
      console.log(`      Máximo permitido: ${limit.max_users}`)
      console.log(`      Usuários restantes: ${limit.remaining_users}`)
      console.log(`      Tipo do plano: ${limit.plan_type}`)
      console.log(`      Admin ID: ${limit.admin_user_id || 'Não encontrado'}`)
      console.log(`      Subscription ID: ${limit.subscription_id || 'Não encontrada'}`)
    }

    // 3. Verificar admins de entidade
    console.log('\n3️⃣ Verificando admins de entidade...')
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, entity_id, entity_role, status')
      .eq('entity_role', 'admin')
      .not('entity_id', 'is', null)

    if (adminsError) {
      console.log(`❌ Erro ao buscar admins: ${adminsError.message}`)
    } else {
      console.log(`👥 Admins de entidade encontrados: ${admins?.length || 0}`)
      admins?.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.full_name} - Status: ${admin.status}`)
      })
    }

    // 4. Verificar subscriptions
    console.log('\n4️⃣ Verificando subscriptions...')
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id, user_id, entity_id, status, current_users, plan_id')
      .eq('status', 'active')
      .not('entity_id', 'is', null)

    if (subError) {
      console.log(`❌ Erro ao buscar subscriptions: ${subError.message}`)
    } else {
      console.log(`📋 Subscriptions ativas com entity_id: ${subscriptions?.length || 0}`)
      subscriptions?.forEach((sub, index) => {
        console.log(`   ${index + 1}. Entity: ${sub.entity_id}, Users: ${sub.current_users}, Plan: ${sub.plan_id}`)
      })
    }

    // 5. Verificar entity_subscriptions
    console.log('\n5️⃣ Verificando entity_subscriptions...')
    const { data: entitySubs, error: entitySubError } = await supabase
      .from('entity_subscriptions')
      .select('id, entity_id, plan_id, status')
      .eq('status', 'active')

    if (entitySubError) {
      console.log(`❌ Erro ao buscar entity_subscriptions: ${entitySubError.message}`)
    } else {
      console.log(`📋 Entity subscriptions ativas: ${entitySubs?.length || 0}`)
      entitySubs?.forEach((sub, index) => {
        console.log(`   ${index + 1}. Entity: ${sub.entity_id}, Plan: ${sub.plan_id}`)
      })
    }

    console.log('\n✅ Teste concluído!')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar teste
if (require.main === module) {
  testEntityLimits()
    .then(() => {
      console.log('\n🎉 Script finalizado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error)
      process.exit(1)
    })
}

export { testEntityLimits }