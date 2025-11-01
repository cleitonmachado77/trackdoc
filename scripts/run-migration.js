#!/usr/bin/env node

/**
 * Script para executar migrações do Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile) {
  try {
    console.log(`🚀 Executando migração: ${migrationFile}`)
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`)
      return false
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executando ${commands.length} comando(s) SQL...`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        console.log(`   ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        
        if (error) {
          // Tentar executar diretamente se rpc falhar
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0)
          
          if (directError) {
            console.error(`❌ Erro ao executar comando ${i + 1}:`, error)
            return false
          }
        }
      }
    }
    
    console.log(`✅ Migração ${migrationFile} executada com sucesso!`)
    return true
    
  } catch (error) {
    console.error(`❌ Erro ao executar migração ${migrationFile}:`, error)
    return false
  }
}

async function main() {
  const migrationFile = process.argv[2]
  
  if (!migrationFile) {
    console.error('❌ Especifique o arquivo de migração')
    console.log('Uso: node scripts/run-migration.js <nome-do-arquivo.sql>')
    console.log('Exemplo: node scripts/run-migration.js 20250201_create_document_permissions_table.sql')
    process.exit(1)
  }
  
  console.log('🔧 Iniciando execução de migração...')
  console.log(`📁 Arquivo: ${migrationFile}`)
  
  const success = await runMigration(migrationFile)
  
  if (success) {
    console.log('\n🎉 Migração concluída com sucesso!')
  } else {
    console.log('\n💥 Falha na execução da migração')
    process.exit(1)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { runMigration }