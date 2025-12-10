#!/usr/bin/env tsx

/**
 * Script para corrigir os contadores do painel super-admin
 * e implementar verificação de limites de planos
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeMigration() {
  console.log('🚀 Iniciando correção dos contadores do super-admin...\n')

  try {
    // Ler o arquivo de migração
    const migrationPath = join(process.cwd(), 'migrations', 'fix_super_admin_usage_counters.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Executando migração SQL...')
    
    // Executar a migração
    const { error: migrationError } = await supabase.rpc('exec', {
      sql: migrationSQL
    })

    if (migrationError) {
      console.error('❌ Erro ao executar migração:', migrationError)
      
      // Tentar executar por partes se falhar
      console.log('🔄 Tentando executar por partes...')
      
      const sqlParts = migrationSQL.split('-- =====================================================')
      
      for (let i = 0; i < sqlParts.length; i++) {
        const part = sqlParts[i].trim()
        if (!part) continue
        
        console.log(`📝 Executando parte ${i + 1}/${sqlParts.length}...`)
        
        const { error } = await supabase.rpc('exec', { sql: part })
        
        if (error) {
          console.warn(`⚠️ Erro na parte ${i + 1}:`, error.message)
        } else {
          console.log(`✅ Parte ${i + 1} executada com sucesso`)
        }
      }
    } else {
      console.log('✅ Migração executada com sucesso!')
    }

  } catch (error) {
    console.error('❌ Erro ao ler arquivo de migração:', error)
    return false
  }

  return true
}

async function testFunctions() {
  console.log('\n🧪 Testando funções criadas...\n')

  try {
    // Buscar um usuário para teste
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(1)

    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado para teste')
      return
    }

    const testUser = users[0]
    console.log(`👤 Testando com usuário: ${testUser.full_name} (${testUser.email})`)

    // Teste 1: Calcular uso de armazenamento
    console.log('\n1️⃣ Testando calculate_user_storage_usage...')
    const { data: storageData, error: storageError } = await supabase
      .rpc('calculate_user_storage_usage', { p_user_id: testUser.id })

    if (storageError) {
      console.error('❌ Erro:', storageError)
    } else {
      console.log('✅ Resultado:', storageData)
    }

    // Teste 2: Verificar limites do plano
    console.log('\n2️⃣ Testando check_user_plan_limits...')
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('check_user_plan_limits', { p_user_id: testUser.id })

    if (limitsError) {
      console.error('❌ Erro:', limitsError)
    } else {
      console.log('✅ Resultado:', limitsData)
    }

    // Teste 3: Verificar se pode fazer upload
    console.log('\n3️⃣ Testando can_upload_file...')
    const { data: uploadData, error: uploadError } = await supabase
      .rpc('can_upload_file', { 
        p_user_id: testUser.id, 
        p_file_size_bytes: 1048576 // 1MB
      })

    if (uploadError) {
      console.error('❌ Erro:', uploadError)
    } else {
      console.log('✅ Resultado:', uploadData)
    }

    // Teste 4: Atualizar contadores
    console.log('\n4️⃣ Testando update_subscription_counters...')
    const { data: updateData, error: updateError } = await supabase
      .rpc('update_subscription_counters', { p_user_id: testUser.id })

    if (updateError) {
      console.error('❌ Erro:', updateError)
    } else {
      console.log('✅ Resultado:', updateData)
    }

  } catch (error) {
    console.error('❌ Erro nos testes:', error)
  }
}

async function verifyInstallation() {
  console.log('\n🔍 Verificando instalação...\n')

  try {
    // Verificar se as funções foram criadas
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .in('routine_name', [
        'calculate_user_storage_usage',
        'check_user_plan_limits',
        'update_subscription_counters',
        'can_upload_file'
      ])
      .eq('routine_schema', 'public')

    if (functionsError) {
      console.error('❌ Erro ao verificar funções:', functionsError)
    } else {
      console.log('📋 Funções criadas:')
      functions?.forEach(func => {
        console.log(`  ✅ ${func.routine_name} (${func.routine_type})`)
      })
    }

    // Verificar se o trigger foi criado
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, event_object_table')
      .eq('trigger_name', 'trigger_update_storage_counters')

    if (triggersError) {
      console.error('❌ Erro ao verificar triggers:', triggersError)
    } else if (triggers && triggers.length > 0) {
      console.log('\n🎯 Triggers criados:')
      triggers.forEach(trigger => {
        console.log(`  ✅ ${trigger.trigger_name} on ${trigger.event_object_table} (${trigger.event_manipulation})`)
      })
    } else {
      console.log('\n⚠️ Nenhum trigger encontrado')
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error)
  }
}

async function showUsageStats() {
  console.log('\n📊 Estatísticas de uso atual...\n')

  try {
    // Buscar estatísticas gerais
    const { data: totalDocs, error: docsError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    const { data: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { data: activeSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    console.log('📈 Resumo do sistema:')
    console.log(`  👥 Total de usuários: ${totalUsers?.length || 0}`)
    console.log(`  📄 Total de documentos: ${totalDocs?.length || 0}`)
    console.log(`  💳 Subscriptions ativas: ${activeSubscriptions?.length || 0}`)

    // Calcular armazenamento total
    const { data: storageData, error: storageError } = await supabase
      .from('documents')
      .select('file_size')

    if (!storageError && storageData) {
      const totalBytes = storageData.reduce((sum, doc) => sum + (doc.file_size || 0), 0)
      const totalGB = totalBytes / (1024 * 1024 * 1024)
      console.log(`  💾 Armazenamento total: ${totalGB.toFixed(2)} GB`)
    }

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
  }
}

async function main() {
  console.log('🔧 CORREÇÃO DOS CONTADORES DO PAINEL SUPER-ADMIN')
  console.log('================================================\n')

  // Executar migração
  const migrationSuccess = await executeMigration()
  
  if (!migrationSuccess) {
    console.log('❌ Falha na migração. Abortando...')
    process.exit(1)
  }

  // Verificar instalação
  await verifyInstallation()

  // Testar funções
  await testFunctions()

  // Mostrar estatísticas
  await showUsageStats()

  console.log('\n✅ Correção concluída!')
  console.log('\n📋 Próximos passos:')
  console.log('1. Acesse o painel super-admin (/super-admin)')
  console.log('2. Verifique a nova aba "Limites"')
  console.log('3. Confirme que os contadores estão corretos')
  console.log('4. Teste o upload de arquivos para verificar os limites')
}

// Executar script
main().catch(console.error)