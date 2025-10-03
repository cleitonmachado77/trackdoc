#!/usr/bin/env node

/**
 * Script para corrigir problemas de assinatura em tramitação de documentos
 * 
 * Este script:
 * 1. Aplica a migração da função SQL universal
 * 2. Verifica se os nós de ação estão configurados corretamente
 * 3. Testa a criação de execuções
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🔄 Aplicando migração da função SQL universal...')
  
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250124_fix_universal_workflow_executions_function.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Dividir o SQL em comandos individuais para melhor controle de erro
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim())
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`🔄 Executando: ${command.trim().substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: command.trim() + ';' })
        
        if (error) {
          console.error('❌ Erro ao executar comando:', error)
          console.error('Comando:', command.trim())
          return false
        }
      }
    }
    
    console.log('✅ Migração aplicada com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro ao ler arquivo de migração:', error)
    return false
  }
}

async function checkActionNodes() {
  console.log('🔍 Verificando nós de ação configurados...')
  
  try {
    const { data: actionSteps, error } = await supabase
      .from('workflow_steps')
      .select('id, step_name, action_type, action_data')
      .eq('step_type', 'action')
      .eq('action_type', 'sign')
    
    if (error) {
      console.error('❌ Erro ao buscar nós de ação:', error)
      return false
    }
    
    console.log(`📋 Encontrados ${actionSteps.length} nós de ação de assinatura`)
    
    for (const step of actionSteps) {
      console.log(`\n🔍 Nó: ${step.step_name}`)
      console.log(`   ID: ${step.id}`)
      console.log(`   Action Data:`, step.action_data)
      
      if (step.action_data && step.action_data.targetUsers) {
        console.log(`   ✅ Tem targetUsers: ${step.action_data.targetUsers.length} usuários`)
      } else {
        console.log(`   ⚠️  SEM targetUsers configurados`)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao verificar nós de ação:', error)
    return false
  }
}

async function testFunction() {
  console.log('🧪 Testando função SQL universal...')
  
  try {
    // Buscar um processo de teste
    const { data: processes, error: processError } = await supabase
      .from('workflow_processes')
      .select('id, process_name')
      .limit(1)
    
    if (processError || !processes || processes.length === 0) {
      console.log('⚠️ Nenhum processo encontrado para teste')
      return true
    }
    
    const testProcess = processes[0]
    console.log(`📋 Usando processo de teste: ${testProcess.process_name}`)
    
    // Buscar um step de ação
    const { data: actionSteps, error: stepError } = await supabase
      .from('workflow_steps')
      .select('id, step_name')
      .eq('step_type', 'action')
      .limit(1)
    
    if (stepError || !actionSteps || actionSteps.length === 0) {
      console.log('⚠️ Nenhum step de ação encontrado para teste')
      return true
    }
    
    const testStep = actionSteps[0]
    console.log(`📋 Usando step de teste: ${testStep.step_name}`)
    
    // Testar a função
    const { data: result, error: functionError } = await supabase.rpc(
      'criar_execucoes_workflow_universal',
      {
        p_process_id: testProcess.id,
        p_step_id: testStep.id,
        p_department_id: null,
        p_selected_users: null
      }
    )
    
    if (functionError) {
      console.error('❌ Erro ao testar função:', functionError)
      return false
    }
    
    console.log('✅ Função testada com sucesso')
    console.log(`📊 Resultado: ${result?.length || 0} execuções criadas`)
    
    return true
  } catch (error) {
    console.error('❌ Erro ao testar função:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando correção do sistema de assinatura em tramitação...\n')
  
  // 1. Aplicar migração
  const migrationSuccess = await applyMigration()
  if (!migrationSuccess) {
    console.error('❌ Falha na migração. Abortando.')
    process.exit(1)
  }
  
  console.log('')
  
  // 2. Verificar nós de ação
  const checkSuccess = await checkActionNodes()
  if (!checkSuccess) {
    console.error('❌ Falha na verificação. Abortando.')
    process.exit(1)
  }
  
  console.log('')
  
  // 3. Testar função
  const testSuccess = await testFunction()
  if (!testSuccess) {
    console.error('❌ Falha no teste. Abortando.')
    process.exit(1)
  }
  
  console.log('\n✅ Correção concluída com sucesso!')
  console.log('\n📋 Próximos passos:')
  console.log('1. Verifique se os nós de ação têm targetUsers configurados')
  console.log('2. Teste a criação de um novo processo de workflow')
  console.log('3. Verifique se as execuções são criadas corretamente')
}

// Executar script
main().catch(console.error)
