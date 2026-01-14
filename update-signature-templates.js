// Script para atualizar todos os templates de assinatura com o novo texto padrão
// E também atualizar o valor padrão da coluna no banco de dados

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Chave de serviço para operações administrativas

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.log('💡 Certifique-se de que as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateSignatureTemplates() {
  try {
    console.log('🔄 Iniciando atualização dos templates de assinatura...')
    
    const oldText = "Este documento foi assinado digitalmente com certificado válido."
    const newText = "Este documento foi assinado digitalmente e pode ser verificado em www.trackdoc.com.br."
    
    // PASSO 1: Atualizar o valor padrão da coluna no banco de dados
    console.log('📝 Atualizando valor padrão da coluna custom_text...')
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.signature_templates 
            ALTER COLUMN custom_text 
            SET DEFAULT 'Este documento foi assinado digitalmente e pode ser verificado em www.trackdoc.com.br.'`
    })
    
    if (alterError) {
      console.warn('⚠️ Erro ao alterar valor padrão (pode não ter permissão):', alterError.message)
      console.log('💡 Execute manualmente no Supabase SQL Editor:')
      console.log(`ALTER TABLE public.signature_templates ALTER COLUMN custom_text SET DEFAULT '${newText}';`)
    } else {
      console.log('✅ Valor padrão da coluna atualizado!')
    }
    
    // PASSO 2: Buscar todos os templates que ainda usam o texto antigo
    console.log('🔍 Buscando templates com texto antigo...')
    
    const { data: templatesWithOldText, error: selectError } = await supabase
      .from('signature_templates')
      .select('id, user_id, custom_text')
      .eq('custom_text', oldText)
    
    if (selectError) {
      console.error('❌ Erro ao buscar templates:', selectError)
      return
    }
    
    console.log(`📊 Encontrados ${templatesWithOldText?.length || 0} templates com texto antigo`)
    
    if (!templatesWithOldText || templatesWithOldText.length === 0) {
      console.log('✅ Nenhum template existente precisa ser atualizado')
    } else {
      // PASSO 3: Atualizar todos os templates existentes com o novo texto
      console.log('🔄 Atualizando templates existentes...')
      
      const { data: updatedTemplates, error: updateError } = await supabase
        .from('signature_templates')
        .update({ 
          custom_text: newText,
          updated_at: new Date().toISOString()
        })
        .eq('custom_text', oldText)
        .select('id, user_id')
      
      if (updateError) {
        console.error('❌ Erro ao atualizar templates:', updateError)
        return
      }
      
      console.log(`✅ ${updatedTemplates?.length || 0} templates existentes atualizados com sucesso!`)
      
      // Listar os usuários afetados
      if (updatedTemplates && updatedTemplates.length > 0) {
        console.log('👥 Usuários afetados:')
        updatedTemplates.forEach((template, index) => {
          console.log(`   ${index + 1}. User ID: ${template.user_id}`)
        })
      }
    }
    
    console.log('\n🎉 Atualização concluída!')
    console.log('📋 Resumo:')
    console.log('   ✅ Valor padrão da coluna atualizado (novos registros)')
    console.log(`   ✅ ${templatesWithOldText?.length || 0} templates existentes atualizados`)
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar o script
updateSignatureTemplates()
  .then(() => {
    console.log('🎉 Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })