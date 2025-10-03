#!/usr/bin/env node

/**
 * Script para testar a função SQL corrigida criar_execucoes_workflow_universal
 */

const { createClient } = require('@supabase/supabase-js')

// Tentar carregar variáveis de ambiente
try {
  require('dotenv').config()
} catch (e) {
  console.log('⚠️ dotenv não disponível, usando variáveis do sistema')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCorrectedWorkflowFunction() {
  console.log('🧪 Testando função SQL corrigida criar_execucoes_workflow_universal...')
  
  try {
    // 1. Buscar um processo ativo para teste
    const { data: processes, error: processError } = await supabase
      .from('workflow_processes')
      .select('id, workflow_template_id, document_id, process_name')
      .eq('status', 'active')
      .limit(1)

    if (processError || !processes || processes.length === 0) {
      console.log('⚠️ Nenhum processo ativo encontrado para teste')
      return
    }

    const testProcess = processes[0]
    console.log('📋 Processo de teste:', testProcess)

    // 2. Buscar um step do template
    const { data: steps, error: stepsError } = await supabase
      .from('workflow_steps')
      .select('id, step_name, step_type, department_id, action_data')
      .eq('workflow_template_id', testProcess.workflow_template_id)
      .limit(1)

    if (stepsError || !steps || steps.length === 0) {
      console.log('⚠️ Nenhum step encontrado para teste')
      return
    }

    const testStep = steps[0]
    console.log('📋 Step de teste:', testStep)

    // 3. Buscar usuários para teste
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(2)

    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado para teste')
      return
    }

    console.log('👥 Usuários para teste:', users.map(u => u.full_name))

    // 4. Testar a função corrigida
    console.log('🔧 Testando função corrigida...')
    
    const testParams = {
      p_process_id: testProcess.id,
      p_step_id: testStep.id,
      p_department_id: testStep.department_id,
      p_selected_users: users.map(u => u.id)
    }

    console.log('📋 Parâmetros:', testParams)

    const { data: results, error: functionError } = await supabase.rpc(
      'criar_execucoes_workflow_universal',
      testParams
    )

    if (functionError) {
      console.error('❌ Erro na função corrigida:', {
        message: functionError.message,
        details: functionError.details,
        hint: functionError.hint,
        code: functionError.code
      })
      return false
    } else {
      console.log('✅ Função corrigida executada com sucesso!')
      console.log('📋 Resultados:', results)
    }

    // 5. Verificar se as execuções foram criadas
    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .select('id, process_id, step_id, assigned_to, status, created_at')
      .eq('process_id', testProcess.id)
      .eq('step_id', testStep.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (execError) {
      console.error('❌ Erro ao verificar execuções:', execError)
      return false
    } else {
      console.log('📋 Execuções criadas:', executions?.length || 0)
      if (executions && executions.length > 0) {
        console.log('📋 Detalhes das execuções:')
        executions.forEach((exec, index) => {
          console.log(`  ${index + 1}. ID: ${exec.id}, Usuário: ${exec.assigned_to}, Status: ${exec.status}`)
        })
      }
    }

    return true

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

async function testFallbackMechanism() {
  console.log('\n🧪 Testando mecanismo de fallback...')
  
  try {
    const { data: processes } = await supabase
      .from('workflow_processes')
      .select('id')
      .limit(1)

    const { data: steps } = await supabase
      .from('workflow_steps')
      .select('id')
      .limit(1)

    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(2)

    if (processes && steps && users) {
      // Testar inserção manual direta (fallback)
      const executions = users.map(user => ({
        process_id: processes[0].id,
        step_id: steps[0].id,
        assigned_to: user.id,
        assigned_department_id: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Primeiro, limpar execuções existentes
      await supabase
        .from('workflow_executions')
        .delete()
        .eq('process_id', processes[0].id)
        .eq('step_id', steps[0].id)
        .eq('status', 'pending')

      const { error: insertError } = await supabase
        .from('workflow_executions')
        .insert(executions)

      if (insertError) {
        console.error('❌ Erro no fallback manual:', insertError)
        return false
      } else {
        console.log('✅ Fallback manual funcionando!')
        return true
      }
    }

    return false

  } catch (error) {
    console.error('❌ Erro no teste de fallback:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Testando correções da tramitação de documentos...\n')
  
  const functionTest = await testCorrectedWorkflowFunction()
  const fallbackTest = await testFallbackMechanism()
  
  console.log('\n📊 Resultados dos Testes:')
  console.log(`✅ Função SQL corrigida: ${functionTest ? 'PASSOU' : 'FALHOU'}`)
  console.log(`✅ Mecanismo de fallback: ${fallbackTest ? 'PASSOU' : 'FALHOU'}`)
  
  if (functionTest && fallbackTest) {
    console.log('\n🎉 Todos os testes passaram! As correções estão funcionando.')
    console.log('📋 Próximo passo: Teste a tramitação na interface do usuário.')
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.')
  }
}

main().catch(console.error)
