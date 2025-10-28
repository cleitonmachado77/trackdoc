const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addApprovalRequiredColumn() {
  try {
    console.log('🔧 Adicionando coluna approval_required à tabela documents...')
    
    // Adicionar a coluna approval_required
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.documents 
        ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_documents_approval_required 
        ON public.documents (approval_required) 
        WHERE approval_required = true;
        
        -- Comentário na coluna
        COMMENT ON COLUMN public.documents.approval_required 
        IS 'Indica se o documento requer aprovação antes de ser publicado';
      `
    })

    if (addColumnError) {
      console.error('❌ Erro ao adicionar coluna:', addColumnError)
      return
    }

    console.log('✅ Coluna approval_required adicionada com sucesso!')
    
    // Verificar se a coluna foi criada
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'approval_required';
      `
    })

    if (checkError) {
      console.error('❌ Erro ao verificar coluna:', checkError)
      return
    }

    if (columns && columns.length > 0) {
      console.log('📋 Detalhes da coluna criada:', columns[0])
    }

    console.log('🎉 Migração concluída com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
  }
}

addApprovalRequiredColumn()