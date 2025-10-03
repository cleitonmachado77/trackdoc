#!/usr/bin/env node

/**
 * Script para corrigir workflows existentes que não têm targetUsers configurados
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWorkflowSteps() {
  console.log('🔍 Verificando steps de workflow com problemas...')
  
  try {
    // Buscar todos os steps de ação
    const { data: actionSteps, error } = await supabase
      .from('workflow_steps')
      .select(`
        id,
        step_name,
        action_type,
        action_data,
        workflow_template_id,
        workflow_templates!inner(
          id,
          name
        )
      `)
      .eq('step_type', 'action')
      .eq('action_type', 'sign')
    
    if (error) {
      console.error('❌ Erro ao buscar steps de ação:', error)
      return false
    }
    
    console.log(`📋 Encontrados ${actionSteps.length} steps de ação de assinatura`)
    
    const problematicSteps = []
    
    for (const step of actionSteps) {
      console.log(`\n🔍 Verificando step: ${step.step_name}`)
      console.log(`   Template: ${step.workflow_templates.name}`)
      console.log(`   Action Data:`, step.action_data)
      
      // Verificar se tem targetUsers
      if (!step.action_data || !step.action_data.targetUsers || step.action_data.targetUsers.length === 0) {
        console.log(`   ❌ PROBLEMA: Sem targetUsers configurados`)
        problematicSteps.push(step)
      } else {
        console.log(`   ✅ OK: Tem ${step.action_data.targetUsers.length} targetUsers`)
      }
    }
    
    console.log(`\n📊 Resumo:`)
    console.log(`   Total de steps: ${actionSteps.length}`)
    console.log(`   Steps com problema: ${problematicSteps.length}`)
    console.log(`   Steps OK: ${actionSteps.length - problematicSteps.length}`)
    
    return problematicSteps
    
  } catch (error) {
    console.error('❌ Erro ao verificar steps:', error)
    return false
  }
}

async function fixWorkflowStep(step) {
  console.log(`\n🔧 Corrigindo step: ${step.step_name}`)
  
  try {
    // Buscar usuários do departamento ou entidade
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('status', 'active')
      .limit(5) // Limitar a 5 usuários para teste
    
    if (usersError || !users || users.length === 0) {
      console.log(`   ⚠️ Nenhum usuário encontrado para o step`)
      return false
    }
    
    const targetUsers = users.map(u => u.id)
    
    // Atualizar action_data com targetUsers
    const updatedActionData = {
      ...step.action_data,
      targetUsers: targetUsers,
      requiresAllUsers: true
    }
    
    console.log(`   📝 Atualizando action_data:`, updatedActionData)
    
    const { error: updateError } = await supabase
      .from('workflow_steps')
      .update({
        action_data: updatedActionData
      })
      .eq('id', step.id)
    
    if (updateError) {
      console.error(`   ❌ Erro ao atualizar step:`, updateError)
      return false
    }
    
    console.log(`   ✅ Step corrigido com sucesso`)
    console.log(`   👥 Usuários atribuídos: ${targetUsers.length}`)
    
    return true
    
  } catch (error) {
    console.error(`   ❌ Erro ao corrigir step:`, error)
    return false
  }
}

async function testWorkflowProcess() {
  console.log('\n🧪 Testando criação de processo com step corrigido...')
  
  try {
    // Buscar um template com steps corrigidos
    const { data: templates, error: templateError } = await supabase
      .from('workflow_templates')
      .select(`
        id,
        name,
        workflow_steps!inner(
          id,
          step_name,
          step_type,
          action_data
        )
      `)
      .eq('workflow_steps.step_type', 'action')
      .eq('workflow_steps.action_type', 'sign')
      .limit(1)
    
    if (templateError || !templates || templates.length === 0) {
      console.log('⚠️ Nenhum template com steps de assinatura encontrado')
      return false
    }
    
    const template = templates[0]
    console.log(`📋 Usando template: ${template.name}`)
    
    // Buscar um documento para teste
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .limit(1)
    
    if (docError || !documents || documents.length === 0) {
      console.log('⚠️ Nenhum documento encontrado para teste')
      return false
    }
    
    const document = documents[0]
    console.log(`📄 Usando documento: ${document.title}`)
    
    // Testar a função SQL universal
    const firstActionStep = template.workflow_steps.find(s => s.step_type === 'action')
    if (!firstActionStep) {
      console.log('⚠️ Nenhum step de ação encontrado no template')
      return false
    }
    
    console.log(`🔍 Testando step: ${firstActionStep.step_name}`)
    console.log(`📋 Action data:`, firstActionStep.action_data)
    
    // Criar um processo de teste
    const { data: newProcess, error: processError } = await supabase
      .from('workflow_processes')
      .insert({
        workflow_template_id: template.id,
        document_id: document.id,
        process_name: 'Teste de Correção - ' + new Date().toISOString(),
        started_by: '00000000-0000-0000-0000-000000000000',
        status: 'active'
      })
      .select('id, process_name')
      .single()
    
    if (processError) {
      console.error('❌ Erro ao criar processo de teste:', processError)
      return false
    }
    
    console.log(`✅ Processo de teste criado: ${newProcess.process_name}`)
    
    // Testar a função SQL universal
    const { data: result, error: functionError } = await supabase.rpc(
      'criar_execucoes_workflow_universal',
      {
        p_process_id: newProcess.id,
        p_step_id: firstActionStep.id,
        p_department_id: null,
        p_selected_users: firstActionStep.action_data?.targetUsers || null
      }
    )
    
    if (functionError) {
      console.error('❌ Erro ao testar função SQL:', functionError)
      return false
    }
    
    console.log(`✅ Função SQL testada com sucesso`)
    console.log(`📊 Resultado: ${result?.length || 0} execuções criadas`)
    
    if (result && result.length > 0) {
      console.log('📋 Execuções criadas:')
      result.forEach((exec, index) => {
        console.log(`   ${index + 1}. Assigned to: ${exec.assigned_to}`)
      })
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erro ao testar processo:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando correção de workflows existentes...\n')
  
  // 1. Verificar steps com problemas
  const problematicSteps = await checkWorkflowSteps()
  
  if (!problematicSteps) {
    console.error('❌ Falha na verificação de steps')
    process.exit(1)
  }
  
  if (problematicSteps.length === 0) {
    console.log('\n✅ Nenhum step com problema encontrado!')
    console.log('🎯 Todos os workflows estão configurados corretamente')
    return
  }
  
  console.log(`\n🔧 Corrigindo ${problematicSteps.length} steps com problemas...`)
  
  let successCount = 0
  let failureCount = 0
  
  for (const step of problematicSteps) {
    const success = await fixWorkflowStep(step)
    if (success) {
      successCount++
    } else {
      failureCount++
    }
  }
  
  console.log(`\n📊 Resultado da correção:`)
  console.log(`   ✅ Sucessos: ${successCount}`)
  console.log(`   ❌ Falhas: ${failureCount}`)
  
  if (successCount > 0) {
    console.log('\n🧪 Testando workflows corrigidos...')
    const testSuccess = await testWorkflowProcess()
    
    if (testSuccess) {
      console.log('\n✅ Correção concluída com sucesso!')
      console.log('\n📋 Próximos passos:')
      console.log('1. Teste a criação de novos workflows')
      console.log('2. Verifique se a assinatura múltipla funciona')
      console.log('3. Confirme que os usuários recebem as execuções')
    } else {
      console.log('\n⚠️ Correção aplicada, mas teste falhou')
      console.log('💡 Verifique manualmente se os workflows estão funcionando')
    }
  } else {
    console.log('\n❌ Falha na correção dos workflows')
    console.log('💡 Verifique os logs de erro acima')
  }
}

main().catch(console.error)
