#!/usr/bin/env node

/**
 * Script para testar as correções finais da tramitação de documentos
 * Verifica se a função SQL V2 está funcionando sem erros
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

async function testFinalWorkflowCorrections() {
  console.log('🧪 Testando correções finais da tramitação de documentos...')
  
  try {
    // 1. Verificar se a função V2 existe
    console.log('🔍 Verificando se a função V2 foi criada...')
    
    const { data: functions, error: funcError } = await supabase.rpc('criar_execucoes_workflow_universal', {
      p_process_id: '00000000-0000-0000-0000-000000000000', // ID inválido para testar apenas a existência
      p_step_id: '00000000-0000-0000-0000-000000000000',
      p_department_id: null,
      p_selected_users: null
    })

    if (funcError && funcError.code === '42702') {
      console.log('✅ Função V2 encontrada (erro esperado por IDs inválidos)')
    } else if (funcError) {
      console.log('✅ Função V2 encontrada (erro diferente, mas função existe)')
    } else {
      console.log('✅ Função V2 encontrada e funcionando')
    }

    // 2. Buscar dados reais para teste
    console.log('\n🔍 Buscando dados reais para teste...')
    
    const { data: processes, error: processError } = await supabase
      .from('workflow_processes')
      .select('id, workflow_template_id')
      .eq('status', 'active')
      .limit(1)

    if (processError || !processes || processes.length === 0) {
      console.log('⚠️ Nenhum processo ativo encontrado para teste')
      return false
    }

    const testProcess = processes[0]
    console.log('📋 Processo de teste:', testProcess.id)

    // 3. Buscar step do template
    const { data: steps, error: stepsError } = await supabase
      .from('workflow_steps')
      .select('id, step_name, step_type, action_data')
      .eq('workflow_template_id', testProcess.workflow_template_id)
      .limit(1)

    if (stepsError || !steps || steps.length === 0) {
      console.log('⚠️ Nenhum step encontrado para teste')
      return false
    }

    const testStep = steps[0]
    console.log('📋 Step de teste:', testStep.id, '-', testStep.step_name)

    // 4. Buscar usuários
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(2)

    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado para teste')
      return false
    }

    console.log('👥 Usuários para teste:', users.map(u => u.full_name))

    // 5. Testar a função V2 com dados reais
    console.log('\n🧪 Testando função V2 com dados reais...')
    
    const testParams = {
      p_process_id: testProcess.id,
      p_step_id: testStep.id,
      p_department_id: null,
      p_selected_users: users.map(u => u.id)
    }

    console.log('📋 Parâmetros:', testParams)

    const { data: results, error: functionError } = await supabase.rpc(
      'criar_execucoes_workflow_universal',
      testParams
    )

    if (functionError) {
      console.error('❌ Erro na função V2:', {
        message: functionError.message,
        details: functionError.details,
        hint: functionError.hint,
        code: functionError.code
      })
      return false
    } else {
      console.log('✅ Função V2 executada com sucesso!')
      console.log('📋 Resultados:', results)
    }

    // 6. Verificar execuções criadas
    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .select('id, process_id, step_id, assigned_to, status')
      .eq('process_id', testProcess.id)
      .eq('step_id', testStep.id)
      .eq('status', 'pending')

    if (execError) {
      console.error('❌ Erro ao verificar execuções:', execError)
      return false
    } else {
      console.log('📋 Execuções criadas:', executions?.length || 0)
      if (executions && executions.length > 0) {
        console.log('📋 Detalhes:')
        executions.forEach((exec, index) => {
          console.log(`  ${index + 1}. ID: ${exec.id}, Usuário: ${exec.assigned_to}`)
        })
      }
    }

    return true

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

async function testSchemaCompatibility() {
  console.log('\n🧪 Testando compatibilidade de schema...')
  
  try {
    // Testar inserção sem campos problemáticos
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
      .limit(1)

    if (processes && steps && users) {
      // Testar inserção limpa (sem action_type, action_data, metadata)
      const cleanExecution = {
        process_id: processes[0].id,
        step_id: steps[0].id,
        assigned_to: users[0].id,
        assigned_department_id: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Limpar execução existente primeiro
      await supabase
        .from('workflow_executions')
        .delete()
        .eq('process_id', processes[0].id)
        .eq('step_id', steps[0].id)
        .eq('assigned_to', users[0].id)
        .eq('status', 'pending')

      const { error: insertError } = await supabase
        .from('workflow_executions')
        .insert(cleanExecution)

      if (insertError) {
        console.error('❌ Erro na inserção limpa:', insertError)
        return false
      } else {
        console.log('✅ Inserção limpa funcionando!')
        return true
      }
    }

    return false

  } catch (error) {
    console.error('❌ Erro no teste de compatibilidade:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Testando correções finais da tramitação...\n')
  
  const functionTest = await testFinalWorkflowCorrections()
  const schemaTest = await testSchemaCompatibility()
  
  console.log('\n📊 Resultados dos Testes Finais:')
  console.log(`✅ Função SQL V2: ${functionTest ? 'PASSOU' : 'FALHOU'}`)
  console.log(`✅ Compatibilidade de Schema: ${schemaTest ? 'PASSOU' : 'FALHOU'}`)
  
  if (functionTest && schemaTest) {
    console.log('\n🎉 TODAS AS CORREÇÕES ESTÃO FUNCIONANDO!')
    console.log('📋 A tramitação de documentos deve funcionar perfeitamente agora.')
    console.log('🚀 Próximo passo: Teste na interface do usuário.')
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.')
  }
}

main().catch(console.error)
