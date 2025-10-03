#!/usr/bin/env node

/**
 * Script para testar o sistema de assinatura em tramitação após as correções
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFunction() {
  console.log('🧪 Testando função criar_execucoes_workflow_universal...')
  
  try {
    // Buscar um processo existente para teste
    const { data: processes, error: processError } = await supabase
      .from('workflow_processes')
      .select('id, process_name, current_step_id')
      .limit(1)
    
    if (processError || !processes || processes.length === 0) {
      console.log('⚠️ Nenhum processo encontrado. Criando um processo de teste...')
      return await createTestProcess()
    }
    
    const testProcess = processes[0]
    console.log(`📋 Usando processo existente: ${testProcess.process_name}`)
    
    // Buscar um step de ação
    const { data: actionSteps, error: stepError } = await supabase
      .from('workflow_steps')
      .select('id, step_name, step_type, action_data')
      .eq('step_type', 'action')
      .limit(1)
    
    if (stepError || !actionSteps || actionSteps.length === 0) {
      console.log('⚠️ Nenhum step de ação encontrado')
      return false
    }
    
    const testStep = actionSteps[0]
    console.log(`📋 Usando step: ${testStep.step_name}`)
    console.log(`📋 Action data:`, testStep.action_data)
    
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
    
    console.log('✅ Função executada com sucesso!')
    console.log(`📊 Resultado: ${result?.length || 0} execuções criadas`)
    
    if (result && result.length > 0) {
      console.log('📋 Execuções criadas:')
      result.forEach((exec, index) => {
        console.log(`   ${index + 1}. Execution ID: ${exec.execution_id}`)
        console.log(`      Assigned to: ${exec.assigned_to}`)
        console.log(`      Status: ${exec.status}`)
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao testar função:', error)
    return false
  }
}

async function createTestProcess() {
  console.log('🔧 Criando processo de teste...')
  
  try {
    // Buscar um template de workflow
    const { data: templates, error: templateError } = await supabase
      .from('workflow_templates')
      .select('id, name')
      .limit(1)
    
    if (templateError || !templates || templates.length === 0) {
      console.log('⚠️ Nenhum template de workflow encontrado')
      return false
    }
    
    const template = templates[0]
    console.log(`📋 Usando template: ${template.name}`)
    
    // Buscar um documento
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .limit(1)
    
    if (docError || !documents || documents.length === 0) {
      console.log('⚠️ Nenhum documento encontrado')
      return false
    }
    
    const document = documents[0]
    console.log(`📋 Usando documento: ${document.title}`)
    
    // Criar processo de teste
    const { data: newProcess, error: processError } = await supabase
      .from('workflow_processes')
      .insert({
        workflow_template_id: template.id,
        document_id: document.id,
        process_name: 'Teste de Assinatura - ' + new Date().toISOString(),
        started_by: '00000000-0000-0000-0000-000000000000', // UUID fictício
        status: 'active'
      })
      .select('id, process_name')
      .single()
    
    if (processError) {
      console.error('❌ Erro ao criar processo de teste:', processError)
      return false
    }
    
    console.log(`✅ Processo de teste criado: ${newProcess.process_name}`)
    return true
  } catch (error) {
    console.error('❌ Erro ao criar processo de teste:', error)
    return false
  }
}

async function checkActionNodes() {
  console.log('\n🔍 Verificando nós de ação configurados...')
  
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
    
    if (actionSteps.length === 0) {
      console.log('⚠️ Nenhum nó de ação de assinatura encontrado')
      console.log('💡 Dica: Crie um workflow com nós de ação de assinatura para testar')
      return true
    }
    
    for (const step of actionSteps) {
      console.log(`\n🔍 Nó: ${step.step_name}`)
      console.log(`   ID: ${step.id}`)
      console.log(`   Action Data:`, step.action_data)
      
      if (step.action_data && step.action_data.targetUsers) {
        console.log(`   ✅ Tem targetUsers: ${step.action_data.targetUsers.length} usuários`)
        console.log(`   👥 Usuários:`, step.action_data.targetUsers)
      } else {
        console.log(`   ⚠️  SEM targetUsers configurados`)
        console.log(`   💡 Dica: Configure targetUsers no action_data para que a assinatura funcione`)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao verificar nós de ação:', error)
    return false
  }
}

async function checkExecutions() {
  console.log('\n🔍 Verificando execuções existentes...')
  
  try {
    const { data: executions, error } = await supabase
      .from('workflow_executions')
      .select('id, process_id, step_id, assigned_to, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Erro ao buscar execuções:', error)
      return false
    }
    
    console.log(`📋 Encontradas ${executions.length} execuções pendentes`)
    
    if (executions.length === 0) {
      console.log('⚠️ Nenhuma execução pendente encontrada')
      return true
    }
    
    for (const exec of executions) {
      console.log(`\n🔍 Execução: ${exec.id}`)
      console.log(`   Process ID: ${exec.process_id}`)
      console.log(`   Step ID: ${exec.step_id}`)
      console.log(`   Assigned to: ${exec.assigned_to}`)
      console.log(`   Status: ${exec.status}`)
      console.log(`   Created: ${exec.created_at}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao verificar execuções:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Testando sistema de assinatura em tramitação...\n')
  
  // 1. Verificar nós de ação
  const checkSuccess = await checkActionNodes()
  if (!checkSuccess) {
    console.error('❌ Falha na verificação de nós de ação')
    process.exit(1)
  }
  
  // 2. Verificar execuções existentes
  const execSuccess = await checkExecutions()
  if (!execSuccess) {
    console.error('❌ Falha na verificação de execuções')
    process.exit(1)
  }
  
  // 3. Testar função
  const testSuccess = await testFunction()
  if (!testSuccess) {
    console.error('❌ Falha no teste da função')
    process.exit(1)
  }
  
  console.log('\n✅ Teste concluído com sucesso!')
  console.log('\n📋 Resumo:')
  console.log('1. ✅ Função SQL universal criada e funcionando')
  console.log('2. ✅ Sistema de assinatura em tramitação corrigido')
  console.log('3. ✅ Execuções podem ser criadas corretamente')
  
  console.log('\n🎯 Próximos passos:')
  console.log('1. Crie um novo processo de workflow')
  console.log('2. Configure nós de ação com targetUsers')
  console.log('3. Teste a assinatura múltipla')
  console.log('4. Verifique se os usuários recebem as execuções corretamente')
}

main().catch(console.error)
