/**
 * Script para testar a lógica de planos de entidade
 * Execute com: npx tsx scripts/test-entity-plan-logic.ts
 */

import { createClient } from '@supabase/supabase-js'
import { 
  getEntityAdminSubscription, 
  canCreateMoreUsers, 
  incrementEntityUserCount,
  decrementEntityUserCount,
  getEntityPlanFeatures 
} from '../lib/entity-subscription-utils'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testEntityPlanLogic() {
  console.log('🧪 Iniciando testes da lógica de planos de entidade...\n')

  try {
    // 1. Buscar uma entidade de teste
    console.log('1️⃣ Buscando entidades disponíveis...')
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('id, name')
      .limit(5)

    if (entitiesError) {
      throw new Error(`Erro ao buscar entidades: ${entitiesError.message}`)
    }

    if (!entities || entities.length === 0) {
      console.log('❌ Nenhuma entidade encontrada para teste')
      return
    }

    console.log(`✅ Encontradas ${entities.length} entidades:`)
    entities.forEach((entity, index) => {
      console.log(`   ${index + 1}. ${entity.name} (${entity.id})`)
    })

    // Usar a primeira entidade para teste
    const testEntity = entities[0]
    console.log(`\n🎯 Usando entidade de teste: ${testEntity.name}\n`)

    // 2. Testar busca de subscription do admin
    console.log('2️⃣ Testando busca de subscription do admin...')
    const subscriptionResult = await getEntityAdminSubscription(testEntity.id)
    
    if (subscriptionResult.error) {
      console.log(`⚠️ Erro: ${subscriptionResult.error}`)
    } else if (subscriptionResult.data) {
      const sub = subscriptionResult.data
      console.log('✅ Subscription encontrada:')
      console.log(`   Admin ID: ${sub.user_id}`)
      console.log(`   Plano: ${sub.plan.name} (${sub.plan.type})`)
      console.log(`   Usuários: ${sub.current_users}/${sub.plan.max_users}`)
      console.log(`   Armazenamento: ${sub.current_storage_gb}GB/${sub.plan.max_storage_gb}GB`)
    } else {
      console.log('❌ Nenhuma subscription encontrada')
    }

    // 3. Testar verificação de limites
    console.log('\n3️⃣ Testando verificação de limites...')
    const limitsResult = await canCreateMoreUsers(testEntity.id)
    
    console.log('📊 Resultado da verificação:')
    console.log(`   Pode criar usuários: ${limitsResult.canCreate ? '✅ Sim' : '❌ Não'}`)
    console.log(`   Usuários atuais: ${limitsResult.currentUsers}`)
    console.log(`   Máximo permitido: ${limitsResult.maxUsers}`)
    console.log(`   Usuários restantes: ${limitsResult.remainingUsers}`)
    
    if (limitsResult.error) {
      console.log(`   ⚠️ Erro: ${limitsResult.error}`)
    }

    // 4. Testar busca de features
    console.log('\n4️⃣ Testando busca de features do plano...')
    const featuresResult = await getEntityPlanFeatures(testEntity.id)
    
    if (featuresResult.error) {
      console.log(`⚠️ Erro: ${featuresResult.error}`)
    } else {
      console.log(`✅ Plano: ${featuresResult.planType}`)
      console.log('📋 Features disponíveis:')
      Object.entries(featuresResult.features).forEach(([feature, enabled]) => {
        console.log(`   ${enabled ? '✅' : '❌'} ${feature}`)
      })
    }

    // 5. Testar função SQL diretamente
    console.log('\n5️⃣ Testando função SQL check_entity_user_limit...')
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('check_entity_user_limit', { p_entity_id: testEntity.id })

    if (sqlError) {
      console.log(`❌ Erro na função SQL: ${sqlError.message}`)
    } else if (sqlResult && sqlResult.length > 0) {
      const result = sqlResult[0]
      console.log('✅ Resultado da função SQL:')
      console.log(`   Pode criar: ${result.can_create_user}`)
      console.log(`   Usuários atuais: ${result.current_users}`)
      console.log(`   Máximo: ${result.max_users}`)
      console.log(`   Restantes: ${result.remaining_users}`)
      console.log(`   Tipo do plano: ${result.plan_type}`)
      console.log(`   Admin ID: ${result.admin_user_id}`)
      console.log(`   Subscription ID: ${result.subscription_id}`)
    } else {
      console.log('❌ Nenhum resultado da função SQL')
    }

    // 5.1. Verificar estrutura das tabelas
    console.log('\n5️⃣.1 Verificando estrutura das tabelas...')
    
    // Verificar subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id, user_id, entity_id, plan_id, status, current_users')
      .limit(3)

    console.log('📋 Subscriptions encontradas:', subscriptions?.length || 0)
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, i) => {
        console.log(`   ${i + 1}. User: ${sub.user_id}, Entity: ${sub.entity_id}, Status: ${sub.status}, Users: ${sub.current_users}`)
      })
    }

    // Verificar entity_subscriptions
    const { data: entitySubs, error: entitySubError } = await supabase
      .from('entity_subscriptions')
      .select('id, entity_id, plan_id, status')
      .limit(3)

    console.log('📋 Entity Subscriptions encontradas:', entitySubs?.length || 0)
    if (entitySubs && entitySubs.length > 0) {
      entitySubs.forEach((sub, i) => {
        console.log(`   ${i + 1}. Entity: ${sub.entity_id}, Plan: ${sub.plan_id}, Status: ${sub.status}`)
      })
    }

    // 6. Testar contagem de usuários da entidade
    console.log('\n6️⃣ Verificando usuários da entidade...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, entity_role, status')
      .eq('entity_id', testEntity.id)

    if (usersError) {
      console.log(`❌ Erro ao buscar usuários: ${usersError.message}`)
    } else {
      console.log(`👥 Usuários encontrados: ${users?.length || 0}`)
      users?.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.entity_role}) - ${user.status}`)
      })
    }

    console.log('\n✅ Testes concluídos com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testEntityPlanLogic()
    .then(() => {
      console.log('\n🎉 Script finalizado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error)
      process.exit(1)
    })
}

export { testEntityPlanLogic }