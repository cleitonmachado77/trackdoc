#!/usr/bin/env node

/**
 * Script para testar as correções na tramitação de documentos
 * Verifica se a função SQL está funcionando corretamente
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
  console.error('❌ Variáveis de ambiente não encontradas:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.error('SUPABASE_URL:', !!process.env.SUPABASE_URL)
  console.error('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWorkflowExecutionFunction() {
  console.log('🧪 Testando função criar_execucoes_workflow_universal...')
  
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

    // 4. Testar a função com parâmetros corretos
    console.log('🔧 Testando função com parâmetros corretos...')
    
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
      console.error('❌ Erro na função:', {
        message: functionError.message,
        details: functionError.details,
        hint: functionError.hint,
        code: functionError.code
      })
    } else {
      console.log('✅ Função executada com sucesso!')
      console.log('📋 Resultados:', results)
    }

    // 5. Verificar se as execuções foram criadas
    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .select('id, process_id, step_id, assigned_to, status')
      .eq('process_id', testProcess.id)
      .eq('step_id', testStep.id)
      .eq('status', 'pending')

    if (execError) {
      console.error('❌ Erro ao verificar execuções:', execError)
    } else {
      console.log('📋 Execuções criadas:', executions?.length || 0)
      console.log('📋 Detalhes:', executions)
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

async function testFallbackMechanism() {
  console.log('\n🧪 Testando mecanismo de fallback...')
  
  try {
    // Simular erro na função SQL e testar fallback
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
      // Testar inserção manual direta
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
      } else {
        console.log('✅ Fallback manual funcionando!')
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste de fallback:', error)
  }
}

async function main() {
  console.log('🚀 Iniciando testes das correções de tramitação...\n')
  
  await testWorkflowExecutionFunction()
  await testFallbackMechanism()
  
  console.log('\n✅ Testes concluídos!')
}

main().catch(console.error)
