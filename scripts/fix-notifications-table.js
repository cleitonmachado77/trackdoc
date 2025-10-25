require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixNotificationsTable() {
    console.log('🔧 Corrigindo estrutura da tabela notifications...')

    try {
        // Primeiro, vamos verificar a estrutura atual
        console.log('📋 Verificando estrutura atual...')
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'notifications')
            .eq('table_schema', 'public')

        if (columnsError) {
            console.error('❌ Erro ao verificar colunas:', columnsError)
            return
        }

        console.log('📊 Colunas atuais:', columns?.map(c => c.column_name))

        // Verificar se a coluna is_read existe
        const hasIsRead = columns?.some(c => c.column_name === 'is_read')

        if (!hasIsRead) {
            console.log('➕ Adicionando coluna is_read...')

            // Adicionar a coluna is_read
            const { error: addColumnError } = await supabase.rpc('exec_sql', {
                sql: 'ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;'
            })

            if (addColumnError) {
                console.error('❌ Erro ao adicionar coluna is_read:', addColumnError)

                // Tentar método alternativo usando SQL direto
                console.log('🔄 Tentando método alternativo...')
                const { error: directError } = await supabase
                    .from('notifications')
                    .select('id')
                    .limit(1)

                if (directError && directError.message.includes('does not exist')) {
                    console.log('📝 Tabela não existe, criando...')

                    const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.notifications (
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

                    // Usar uma query direta
                    console.log('🏗️ Criando tabela notifications...')
                    // Como não temos exec_sql, vamos tentar criar via insert/update
                    console.log('⚠️ Não é possível criar tabela via API. Execute manualmente no Supabase:')
                    console.log(createTableSQL)
                }
            } else {
                console.log('✅ Coluna is_read adicionada com sucesso!')
            }
        } else {
            console.log('✅ Coluna is_read já existe!')
        }

        // Verificar se há dados na tabela
        const { data: notifications, error: dataError } = await supabase
            .from('notifications')
            .select('id, is_read')
            .limit(5)

        if (dataError) {
            console.error('❌ Erro ao verificar dados:', dataError)
        } else {
            console.log(`📊 Encontradas ${notifications?.length || 0} notificações`)
            if (notifications?.length > 0) {
                console.log('📋 Primeiras notificações:', notifications)
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error)
    }
}

fixNotificationsTable()