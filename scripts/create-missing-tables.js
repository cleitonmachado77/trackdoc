#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingTables() {
  console.log('🚀 Criando tabelas que estão faltando...')

  // Verificar quais tabelas já existem
  const existingTables = []
  
  const tablesToCheck = ['documents', 'approval_requests', 'document_types']
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1)
      if (!error) {
        existingTables.push(table)
        console.log(`✅ ${table}: já existe`)
      }
    } catch (err) {
      console.log(`❌ ${table}: não existe, será criada`)
    }
  }

  // Criar apenas as tabelas que não existem
  const sqlCommands = []

  if (!existingTables.includes('document_types')) {
    sqlCommands.push(`
      CREATE TABLE public.document_types (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT document_types_pkey PRIMARY KEY (id)
      );
    `)
  }

  if (!existingTables.includes('documents')) {
    sqlCommands.push(`
      CREATE TABLE public.documents (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500),
        file_size BIGINT,
        mime_type VARCHAR(100),
        document_type_id UUID,
        created_by UUID,
        status VARCHAR(50) DEFAULT 'draft',
        version INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT documents_pkey PRIMARY KEY (id),
        CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE,
        CONSTRAINT documents_status_check CHECK (status = ANY(ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'rejected'::text, 'archived'::text]))
      );
    `)
  }

  if (!existingTables.includes('approval_requests')) {
    sqlCommands.push(`
      CREATE TABLE public.approval_requests (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL,
        approver_id UUID NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        step_order INTEGER DEFAULT 1,
        comments TEXT,
        approved_at TIMESTAMP WITH TIME ZONE,
        rejected_at TIMESTAMP WITH TIME ZONE,
        deadline TIMESTAMP WITH TIME ZONE,
        priority VARCHAR(50) DEFAULT 'medium',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT approval_requests_pkey PRIMARY KEY (id),
        CONSTRAINT approval_requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES profiles(id) ON DELETE CASCADE,
        CONSTRAINT approval_requests_status_check CHECK (status = ANY(ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])),
        CONSTRAINT approval_requests_priority_check CHECK (priority = ANY(ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))
      );
    `)
  }

  // Sempre criar/recriar a view
  sqlCommands.push(`
    CREATE OR REPLACE VIEW public.notification_feed AS
    SELECT 
      id,
      created_by as user_id,
      title,
      message,
      type,
      CASE 
        WHEN status = 'read' THEN true 
        ELSE false 
      END as is_read,
      created_at,
      updated_at
    FROM public.notifications
    WHERE recipients IS NOT NULL AND array_length(recipients, 1) > 0;
  `)

  // Executar comandos
  for (let i = 0; i < sqlCommands.length; i++) {
    const command = sqlCommands[i].trim()
    if (command) {
      try {
        console.log(`📝 Executando comando ${i + 1}/${sqlCommands.length}...`)
        
        // Tentar executar diretamente via RPC
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        
        if (error) {
          console.warn(`⚠️  Aviso:`, error.message)
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      } catch (err) {
        console.warn(`❌ Erro no comando ${i + 1}:`, err.message)
      }
    }
  }

  // Inserir tipos de documento padrão
  try {
    console.log('📝 Inserindo tipos de documento padrão...')
    const { error } = await supabase
      .from('document_types')
      .upsert([
        { name: 'Contrato', description: 'Documentos contratuais e acordos' },
        { name: 'Relatório', description: 'Relatórios diversos e análises' },
        { name: 'Política', description: 'Políticas internas da empresa' },
        { name: 'Procedimento', description: 'Procedimentos operacionais padrão' }
      ], { onConflict: 'name' })

    if (error) {
      console.warn('⚠️  Aviso ao inserir tipos:', error.message)
    } else {
      console.log('✅ Tipos de documento inseridos')
    }
  } catch (err) {
    console.warn('❌ Erro ao inserir tipos:', err.message)
  }

  // Verificação final
  console.log('\n🔍 Verificação final...')
  
  const finalTables = ['documents', 'approval_requests', 'document_types']
  
  for (const table of finalTables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1)
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: OK`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }

  // Verificar view
  try {
    const { data, error } = await supabase.from('notification_feed').select('*').limit(1)
    if (error) {
      console.log(`❌ notification_feed (view): ${error.message}`)
    } else {
      console.log(`✅ notification_feed (view): OK`)
    }
  } catch (err) {
    console.log(`❌ notification_feed (view): ${err.message}`)
  }

  console.log('\n🎉 Processo concluído!')
  console.log('\n📋 Próximos passos:')
  console.log('   1. Reinicie o servidor: npm run dev')
  console.log('   2. Os erros de tabelas não encontradas devem desaparecer')
}

if (require.main === module) {
  createMissingTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erro:', error)
      process.exit(1)
    })
}

module.exports = { createMissingTables }