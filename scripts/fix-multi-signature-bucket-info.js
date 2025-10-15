/**
 * Script para atualizar registros de assinaturas múltiplas com informação do bucket
 * Este script adiciona o campo storageBucket ao qr_code_data dos registros antigos
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkFileInBucket(bucket, fileName) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: fileName
      })
    
    if (error) {
      console.error(`⚠️ Erro ao verificar ${bucket}:`, error.message)
      return false
    }
    
    return data && data.length > 0
  } catch (error) {
    console.error(`⚠️ Exceção ao verificar ${bucket}:`, error.message)
    return false
  }
}

async function updateMultiSignatureBucketInfo() {
  console.log('🔄 Iniciando atualização de informações de bucket...\n')

  // Buscar todas as assinaturas múltiplas
  const { data: signatures, error } = await supabase
    .from('document_signatures')
    .select('*')
    .like('qr_code_data', '%"signatureType":"multiple"%')

  if (error) {
    console.error('❌ Erro ao buscar assinaturas:', error)
    return
  }

  console.log(`📊 Encontradas ${signatures?.length || 0} assinaturas múltiplas\n`)

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const signature of signatures || []) {
    try {
      const qrData = JSON.parse(signature.qr_code_data || '{}')
      
      // Se já tem storageBucket, pular
      if (qrData.storageBucket) {
        console.log(`⏭️  Pulando ${signature.id} - já tem bucket: ${qrData.storageBucket}`)
        skippedCount++
        continue
      }

      const fileName = signature.signature_url
      console.log(`\n🔍 Verificando: ${fileName}`)

      // Verificar em qual bucket o arquivo está
      let bucketUsed = null
      
      // Tentar signed-documents primeiro
      const inSignedDocs = await checkFileInBucket('signed-documents', fileName)
      if (inSignedDocs) {
        bucketUsed = 'signed-documents'
        console.log(`✅ Encontrado em: signed-documents`)
      } else {
        // Tentar documents como fallback
        const inDocuments = await checkFileInBucket('documents', fileName)
        if (inDocuments) {
          bucketUsed = 'documents'
          console.log(`✅ Encontrado em: documents`)
        } else {
          console.log(`⚠️  Arquivo não encontrado em nenhum bucket, usando padrão: signed-documents`)
          bucketUsed = 'signed-documents' // Usar padrão
        }
      }

      // Atualizar qr_code_data com informação do bucket
      qrData.storageBucket = bucketUsed

      const { error: updateError } = await supabase
        .from('document_signatures')
        .update({
          qr_code_data: qrData
        })
        .eq('id', signature.id)

      if (updateError) {
        console.error(`❌ Erro ao atualizar ${signature.id}:`, updateError.message)
        errorCount++
      } else {
        console.log(`✅ Atualizado: ${signature.id} -> bucket: ${bucketUsed}`)
        updatedCount++
      }

    } catch (err) {
      console.error(`❌ Erro ao processar ${signature.id}:`, err.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 RESULTADO DA MIGRAÇÃO:')
  console.log('='.repeat(50))
  console.log(`✅ Atualizados: ${updatedCount}`)
  console.log(`⏭️  Pulados: ${skippedCount}`)
  console.log(`❌ Erros: ${errorCount}`)
  console.log(`📋 Total: ${signatures?.length || 0}`)
  console.log('='.repeat(50))
}

// Executar
updateMultiSignatureBucketInfo()
  .then(() => {
    console.log('\n✅ Migração concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro na migração:', error)
    process.exit(1)
  })
