#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados...')

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'setup-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Dividir em comandos individuais (separados por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Executando ${commands.length} comandos SQL...`)

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        try {
          console.log(`   ${i + 1}/${commands.length}: Executando comando...`)
          const { error } = await supabase.rpc('exec_sql', { sql: command })
          
          if (error) {
            console.warn(`   ⚠️  Aviso no comando ${i + 1}:`, error.message)
          }
        } catch (err) {
          console.warn(`   ⚠️  Erro no comando ${i + 1}:`, err.message)
        }
      }
    }

    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...')
    
    const tables = ['documents', 'approval_requests', 'notifications', 'profiles', 'document_types']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ ${table}: OK`)
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`)
      }
    }

    // Verificar view
    try {
      const { data, error } = await supabase.from('notification_feed').select('*').limit(1)
      if (error) {
        console.log(`   ❌ notification_feed (view): ${error.message}`)
      } else {
        console.log(`   ✅ notification_feed (view): OK`)
      }
    } catch (err) {
      console.log(`   ❌ notification_feed (view): ${err.message}`)
    }

    console.log('\n✅ Configuração do banco concluída!')
    console.log('\n📋 Próximos passos:')
    console.log('   1. Reinicie o servidor de desenvolvimento')
    console.log('   2. Faça login novamente se necessário')
    console.log('   3. Os erros de tabelas não encontradas devem desaparecer')

  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message)
    process.exit(1)
  }
}

// Função alternativa usando SQL direto
async function setupDatabaseDirect() {
  console.log('🚀 Configurando banco de dados (método direto)...')

  const tables = [
    {
      name: 'document_types',
      sql: `
        CREATE TABLE IF NOT EXISTS document_types (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'documents',
      sql: `
        CREATE TABLE IF NOT EXISTS documents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          file_path VARCHAR(500),
          file_size BIGINT,
          mime_type VARCHAR(100),
          document_type_id UUID,
          created_by UUID,
          status VARCHAR(50) DEFAULT 'draft',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'profiles',
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY,
          full_name VARCHAR(255),
          avatar_url TEXT,
          email VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'approval_requests',
      sql: `
        CREATE TABLE IF NOT EXISTS approval_requests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          document_id UUID,
          approver_id UUID,
          status VARCHAR(50) DEFAULT 'pending',
          step_order INTEGER DEFAULT 1,
          comments TEXT,
          approved_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'notifications',
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          type VARCHAR(50) DEFAULT 'info',
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ]

  for (const table of tables) {
    try {
      console.log(`📝 Criando tabela ${table.name}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql })
      
      if (error) {
        console.warn(`   ⚠️  ${table.name}:`, error.message)
      } else {
        console.log(`   ✅ ${table.name}: Criada com sucesso`)
      }
    } catch (err) {
      console.warn(`   ❌ ${table.name}:`, err.message)
    }
  }

  // Criar view
  try {
    console.log('📝 Criando view notification_feed...')
    const viewSql = `
      CREATE OR REPLACE VIEW notification_feed AS
      SELECT 
        id,
        user_id,
        title,
        message,
        type,
        is_read,
        created_at,
        updated_at
      FROM notifications;
    `
    const { error } = await supabase.rpc('exec_sql', { sql: viewSql })
    
    if (error) {
      console.warn('   ⚠️  notification_feed:', error.message)
    } else {
      console.log('   ✅ notification_feed: Criada com sucesso')
    }
  } catch (err) {
    console.warn('   ❌ notification_feed:', err.message)
  }

  console.log('\n✅ Configuração básica concluída!')
}

if (require.main === module) {
  setupDatabaseDirect()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erro:', error)
      process.exit(1)
    })
}

module.exports = { setupDatabase, setupDatabaseDirect }