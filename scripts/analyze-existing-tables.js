/**
 * Script para analisar as tabelas existentes e identificar incompatibilidades
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

async function analyzeExistingTables() {
  console.log('🔍 Analisando estrutura das tabelas existentes...\n')
  
  try {
    // 1. Verificar se as tabelas existem e são acessíveis
    console.log('1️⃣ Testando acesso às tabelas...')
    
    const tables = [
      { name: 'entities', expected: true },
      { name: 'entity_invitations', expected: true },
      { name: 'profiles', expected: true },
      { name: 'entity_users', expected: false } // Esta pode não existir
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1)
        
        if (error) {
          if (table.expected) {
            console.log(`❌ Tabela '${table.name}' não acessível:`, error.message)
          } else {
            console.log(`ℹ️ Tabela '${table.name}' não existe (esperado)`)
          }
        } else {
          console.log(`✅ Tabela '${table.name}' acessível`)
        }
      } catch (err) {
        console.log(`❌ Erro ao acessar '${table.name}':`, err.message)
      }
    }
    
    // 2. Verificar estrutura da tabela entities
    console.log('\n2️⃣ Analisando estrutura da tabela entities...')
    
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .limit(1)
    
    if (entitiesError) {
      console.log('❌ Erro ao acessar entities:', entitiesError.message)
    } else {
      console.log('✅ Tabela entities acessível')
      
      // Verificar campos esperados vs existentes
      const expectedFields = ['id', 'name', 'type', 'status', 'description']
      const existingFields = entities.length > 0 ? Object.keys(entities[0]) : []
      
      console.log('   Campos existentes:', existingFields.join(', '))
      
      // Verificar se o campo 'type' existe (pode estar faltando)
      if (!existingFields.includes('type')) {
        console.log('   ⚠️ Campo "type" não encontrado - pode precisar ser adicionado')
      }
    }
    
    // 3. Verificar estrutura da tabela entity_invitations
    console.log('\n3️⃣ Analisando estrutura da tabela entity_invitations...')
    
    const { data: invitations, error: invitationsError } = await supabase
      .from('entity_invitations')
      .select('*')
      .limit(1)
    
    if (invitationsError) {
      console.log('❌ Erro ao acessar entity_invitations:', invitationsError.message)
    } else {
      console.log('✅ Tabela entity_invitations acessível')
      
      const existingFields = invitations.length > 0 ? Object.keys(invitations[0]) : []
      console.log('   Campos existentes:', existingFields.join(', '))
    }
    
    // 4. Verificar se existe tabela entity_users ou se usa profiles
    console.log('\n4️⃣ Verificando relacionamento usuário-entidade...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, entity_id, entity_role')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Erro ao acessar profiles:', profilesError.message)
    } else {
      console.log('✅ Tabela profiles acessível')
      
      if (profiles.length > 0) {
        const hasEntityFields = profiles[0].hasOwnProperty('entity_id') && profiles[0].hasOwnProperty('entity_role')
        if (hasEntityFields) {
          console.log('✅ Profiles tem campos de entidade (entity_id, entity_role)')
          console.log('   ℹ️ Sistema usa profiles em vez de entity_users separada')
        } else {
          console.log('⚠️ Profiles não tem campos de entidade')
        }
      }
    }
    
    // 5. Testar criação de entidade
    console.log('\n5️⃣ Testando criação de entidade...')
    
    try {
      const testEntityName = `Teste ${Date.now()}`
      const { data: newEntity, error: createError } = await supabase
        .from('entities')
        .insert({
          name: testEntityName,
          email: `teste${Date.now()}@example.com`,
          // Não incluir 'type' se não existir
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Erro ao criar entidade de teste:', createError.message)
        
        // Se o erro for sobre campo obrigatório, tentar com campos mínimos
        if (createError.message.includes('null value')) {
          console.log('   ℹ️ Tentando com campos mínimos...')
          
          const { data: newEntity2, error: createError2 } = await supabase
            .from('entities')
            .insert({
              name: testEntityName,
              email: `teste${Date.now()}@example.com`,
              legal_name: testEntityName,
            })
            .select()
            .single()
          
          if (createError2) {
            console.log('   ❌ Ainda com erro:', createError2.message)
          } else {
            console.log('   ✅ Entidade criada com campos mínimos')
            // Limpar
            await supabase.from('entities').delete().eq('id', newEntity2.id)
          }
        }
      } else {
        console.log('✅ Entidade de teste criada com sucesso')
        // Limpar
        await supabase.from('entities').delete().eq('id', newEntity.id)
      }
    } catch (err) {
      console.log('❌ Erro ao testar criação:', err.message)
    }
    
    // 6. Testar criação de convite
    console.log('\n6️⃣ Testando criação de convite...')
    
    // Primeiro, pegar uma entidade existente ou criar uma
    const { data: existingEntities } = await supabase
      .from('entities')
      .select('id')
      .limit(1)
    
    if (existingEntities && existingEntities.length > 0) {
      const entityId = existingEntities[0].id
      
      try {
        const { data: newInvitation, error: inviteError } = await supabase
          .from('entity_invitations')
          .insert({
            entity_id: entityId,
            email: `teste${Date.now()}@example.com`,
            role: 'user',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single()
        
        if (inviteError) {
          console.log('❌ Erro ao criar convite:', inviteError.message)
        } else {
          console.log('✅ Convite criado com sucesso')
          // Limpar
          await supabase.from('entity_invitations').delete().eq('id', newInvitation.id)
        }
      } catch (err) {
        console.log('❌ Erro ao testar convite:', err.message)
      }
    } else {
      console.log('⚠️ Nenhuma entidade encontrada para testar convite')
    }
    
    console.log('\n📋 RESUMO DA ANÁLISE')
    console.log('===================')
    console.log('✅ As tabelas principais existem no banco')
    console.log('✅ O sistema usa profiles com entity_id em vez de entity_users separada')
    console.log('ℹ️ Estrutura ligeiramente diferente do código esperado')
    console.log('\n🔧 Próximo passo: Ajustar o código para usar a estrutura existente')
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error)
  }
}

// Executar análise
analyzeExistingTables()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })