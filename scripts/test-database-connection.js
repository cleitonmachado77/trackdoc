#!/usr/bin/env node

/**
 * Script para testar conexão com banco e verificar estrutura atual
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 TESTE DE CONEXÃO E ESTRUTURA DO BANCO')
console.log('=' .repeat(50))

async function testConnection() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
        console.log('❌ Variáveis de ambiente não configuradas:')
        console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`)
        console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`)
        return false
    }
    
    console.log('✅ Variáveis de ambiente configuradas')
    
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Testar conexão básica
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
        
        if (error) {
            console.log(`❌ Erro de conexão: ${error.message}`)
            return false
        }
        
        console.log('✅ Conexão com banco estabelecida')
        return true
        
    } catch (error) {
        console.log(`❌ Erro ao conectar: ${error.message}`)
        return false
    }
}

async function checkTableStructure() {
    console.log('\n📋 Verificando estrutura da tabela profiles...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    try {
        // Verificar se a tabela profiles existe e sua estrutura
        const { data, error } = await supabase
            .rpc('exec_sql', { 
                sql: `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'profiles' 
                    AND table_schema = 'public'
                    ORDER BY ordinal_position;
                `
            })
        
        if (error) {
            console.log(`❌ Erro ao verificar estrutura: ${error.message}`)
            return false
        }
        
        if (!data || data.length === 0) {
            console.log('❌ Tabela profiles não encontrada')
            return false
        }
        
        console.log('✅ Tabela profiles encontrada com colunas:')
        data.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
        })
        
        return true
        
    } catch (error) {
        console.log(`❌ Erro ao verificar estrutura: ${error.message}`)
        return false
    }
}

async function checkTriggers() {
    console.log('\n🔧 Verificando triggers...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    try {
        const { data, error } = await supabase
            .rpc('exec_sql', { 
                sql: `
                    SELECT trigger_name, event_manipulation, event_object_table
                    FROM information_schema.triggers 
                    WHERE trigger_name LIKE '%user%' OR trigger_name LIKE '%profile%'
                    ORDER BY trigger_name;
                `
            })
        
        if (error) {
            console.log(`❌ Erro ao verificar triggers: ${error.message}`)
            return false
        }
        
        if (!data || data.length === 0) {
            console.log('⚠️  Nenhum trigger relacionado a usuários encontrado')
            return false
        }
        
        console.log('✅ Triggers encontrados:')
        data.forEach(trigger => {
            console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation} on ${trigger.event_object_table})`)
        })
        
        return true
        
    } catch (error) {
        console.log(`❌ Erro ao verificar triggers: ${error.message}`)
        return false
    }
}

async function checkForeignKeys() {
    console.log('\n🔗 Verificando foreign keys...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    try {
        const { data, error } = await supabase
            .from('information_schema.table_constraints')
            .select(`
                table_name,
                constraint_name,
                constraint_type
            `)
            .eq('constraint_type', 'FOREIGN KEY')
            .limit(20)
        
        if (error) {
            console.log(`❌ Erro ao verificar foreign keys: ${error.message}`)
            return false
        }
        
        if (!data || data.length === 0) {
            console.log('⚠️  Nenhuma foreign key encontrada')
            return false
        }
        
        console.log('✅ Foreign keys encontradas:')
        data.forEach(fk => {
            console.log(`   - ${fk.table_name}: ${fk.constraint_name}`)
        })
        
        console.log(`\n📊 Total de foreign keys: ${data.length}`)
        
        return true
        
    } catch (error) {
        console.log(`❌ Erro ao verificar foreign keys: ${error.message}`)
        return false
    }
}

async function main() {
    console.log('\n🚀 Iniciando verificações...\n')
    
    // 1. Testar conexão
    const connected = await testConnection()
    if (!connected) {
        console.log('\n❌ FALHA: Não foi possível conectar ao banco')
        process.exit(1)
    }
    
    // 2. Verificar estrutura
    const structureOk = await checkTableStructure()
    
    // 3. Verificar triggers
    const triggersOk = await checkTriggers()
    
    // 4. Verificar foreign keys
    const fkOk = await checkForeignKeys()
    
    // Resultado final
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO DA VERIFICAÇÃO:')
    console.log(`   Conexão: ${connected ? '✅' : '❌'}`)
    console.log(`   Estrutura: ${structureOk ? '✅' : '❌'}`)
    console.log(`   Triggers: ${triggersOk ? '✅' : '⚠️'}`)
    console.log(`   Foreign Keys: ${fkOk ? '✅' : '❌'}`)
    
    if (connected && structureOk) {
        console.log('\n✅ BANCO PRONTO para aplicar correções!')
        console.log('\n📋 PRÓXIMOS PASSOS:')
        console.log('1. Execute: database/fix-profiles-structure.sql')
        console.log('2. Execute: database/fix-foreign-keys.sql')
        console.log('3. Teste a criação de usuários')
    } else {
        console.log('\n❌ BANCO NÃO ESTÁ PRONTO')
        console.log('Verifique a configuração e conectividade')
    }
}

// Executar verificações
main().catch(console.error)