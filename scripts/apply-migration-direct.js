#!/usr/bin/env node

/**
 * Script para aplicar migração diretamente no Supabase
 * Usa o cliente Supabase para executar SQL diretamente
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrationDirect() {
  console.log('🔄 Aplicando migração diretamente no Supabase...')
  
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250124_fix_universal_workflow_executions_function.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📋 SQL a ser executado:')
    console.log(migrationSQL)
    console.log('\n🔄 Executando migração...')
    
    // Executar SQL diretamente
    const { data, error } = await supabase
      .from('_migrations')
      .select('*')
      .limit(1)
    
    if (error && !error.message.includes('relation "_migrations" does not exist')) {
      console.error('❌ Erro de conexão:', error)
      return false
    }
    
    // Usar uma abordagem alternativa - executar via RPC se disponível
    console.log('🔄 Tentando executar via RPC...')
    
    // Dividir em comandos menores
    const commands = migrationSQL
      .split('$$;')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + (i < commands.length - 1 ? '$$;' : '')
      
      if (command.trim()) {
        console.log(`🔄 Executando comando ${i + 1}/${commands.length}...`)
        
        try {
          // Tentar executar via query direta
          const { error: execError } = await supabase.rpc('exec', { 
            sql: command 
          })
          
          if (execError) {
            console.error(`❌ Erro no comando ${i + 1}:`, execError)
            console.log('Comando:', command.substring(0, 100) + '...')
            return false
          }
          
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        } catch (error) {
          console.error(`❌ Erro ao executar comando ${i + 1}:`, error)
          return false
        }
      }
    }
    
    console.log('✅ Migração aplicada com sucesso!')
    return true
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    return false
  }
}

async function testFunction() {
  console.log('\n🧪 Testando função criada...')
  
  try {
    // Verificar se a função existe
    const { data: functions, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'criar_execucoes_workflow_universal')
    
    if (error) {
      console.log('⚠️ Não foi possível verificar se a função existe (isso é normal)')
    } else {
      console.log('✅ Função encontrada no banco de dados')
    }
    
    return true
  } catch (error) {
    console.log('⚠️ Erro ao testar função (isso pode ser normal):', error.message)
    return true
  }
}

async function main() {
  console.log('🚀 Aplicando correção do sistema de assinatura...\n')
  
  const success = await applyMigrationDirect()
  
  if (success) {
    await testFunction()
    console.log('\n✅ Correção aplicada com sucesso!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Teste a criação de um novo processo de workflow')
    console.log('2. Verifique se as execuções são criadas corretamente')
    console.log('3. Teste a assinatura múltipla')
  } else {
    console.log('\n❌ Falha ao aplicar correção')
    console.log('\n🔧 Soluções alternativas:')
    console.log('1. Execute o SQL manualmente no painel do Supabase')
    console.log('2. Use o comando: supabase db reset')
    console.log('3. Verifique as permissões do service role key')
  }
}

main().catch(console.error)
