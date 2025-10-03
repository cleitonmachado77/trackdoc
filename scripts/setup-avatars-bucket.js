require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  console.error('Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAvatarsBucket() {
  try {
    console.log('🚀 Configurando bucket de avatars...')

    // 1. Criar bucket se não existir
    console.log('📦 Criando bucket "avatars"...')
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Erro ao criar bucket:', bucketError)
      throw bucketError
    }

    console.log('✅ Bucket "avatars" criado/configurado com sucesso')

    // 2. Aplicar políticas RLS
    console.log('🔒 Aplicando políticas RLS...')
    
    const policies = [
      // Política para INSERT
      {
        name: 'Users can upload their own avatars',
        operation: 'INSERT',
        check: "bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]"
      },
      // Política para UPDATE
      {
        name: 'Users can update their own avatars', 
        operation: 'UPDATE',
        using: "bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]",
        check: "bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]"
      },
      // Política para DELETE
      {
        name: 'Users can delete their own avatars',
        operation: 'DELETE', 
        using: "bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]"
      },
      // Política para SELECT (público)
      {
        name: 'Anyone can view avatars',
        operation: 'SELECT',
        using: "bucket_id = 'avatars'"
      }
    ]

    for (const policy of policies) {
      try {
        // Remover política existente se houver
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects`
        })

        // Criar nova política
        let sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} TO authenticated`
        
        if (policy.using) {
          sql += ` USING (${policy.using})`
        }
        
        if (policy.check) {
          sql += ` WITH CHECK (${policy.check})`
        }

        if (policy.operation === 'SELECT') {
          sql = sql.replace('TO authenticated', 'TO public')
        }

        await supabase.rpc('exec_sql', { sql })
        console.log(`✅ Política "${policy.name}" aplicada`)
      } catch (error) {
        console.error(`❌ Erro ao aplicar política "${policy.name}":`, error.message)
      }
    }

    // 3. Criar função de limpeza de avatars antigos
    console.log('🧹 Criando função de limpeza...')
    const cleanupFunction = `
      CREATE OR REPLACE FUNCTION cleanup_old_avatars()
      RETURNS TRIGGER AS $$
      BEGIN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'avatars'
          AND (storage.foldername(name))[1] = auth.uid()::text
          AND id != NEW.id
          AND name LIKE '%' || (storage.foldername(name))[1] || '%';
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    await supabase.rpc('exec_sql', { sql: cleanupFunction })
    console.log('✅ Função de limpeza criada')

    // 4. Criar trigger
    console.log('⚡ Criando trigger...')
    const triggerSQL = `
      DROP TRIGGER IF EXISTS trigger_cleanup_old_avatars ON storage.objects;
      CREATE TRIGGER trigger_cleanup_old_avatars
        AFTER INSERT ON storage.objects
        FOR EACH ROW
        WHEN (NEW.bucket_id = 'avatars')
        EXECUTE FUNCTION cleanup_old_avatars();
    `

    await supabase.rpc('exec_sql', { sql: triggerSQL })
    console.log('✅ Trigger criado')

    console.log('🎉 Configuração do bucket de avatars concluída com sucesso!')
    console.log('📋 Resumo:')
    console.log('  - Bucket "avatars" criado e configurado')
    console.log('  - Políticas RLS aplicadas')
    console.log('  - Função de limpeza automática criada')
    console.log('  - Upload de avatars agora deve funcionar')

  } catch (error) {
    console.error('❌ Erro na configuração:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupAvatarsBucket()
}

module.exports = { setupAvatarsBucket }
