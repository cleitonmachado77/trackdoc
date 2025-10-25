require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testNotificationStatus() {
  console.log('🔍 Testando status da notificação específica...')
  
  const notificationId = 'f77eec10-f636-494d-bc0c-09cd80975cf9'
  
  try {
    // Verificar na tabela base
    const { data: baseData, error: baseError } = await supabase
      .from('notifications')
      .select('id, status, recipients, created_by, updated_at')
      .eq('id', notificationId)
      .single()
    
    if (baseError) {
      console.error('❌ Erro na tabela base:', baseError)
    } else {
      console.log('📊 Tabela notifications:', baseData)
    }
    
    // Verificar na view
    const { data: viewData, error: viewError } = await supabase
      .from('notification_feed')
      .select('id, status, is_read, recipients, user_id, updated_at')
      .eq('id', notificationId)
      .single()
    
    if (viewError) {
      console.error('❌ Erro na view:', viewError)
    } else {
      console.log('📊 View notification_feed:', viewData)
    }
    
    // Verificar se há diferenças
    if (baseData && viewData) {
      console.log('\n🔍 Comparação:')
      console.log(`   Base status: ${baseData.status}`)
      console.log(`   View status: ${viewData.status}`)
      console.log(`   View is_read: ${viewData.is_read}`)
      console.log(`   Base updated_at: ${baseData.updated_at}`)
      console.log(`   View updated_at: ${viewData.updated_at}`)
      
      if (baseData.status === 'read' && !viewData.is_read) {
        console.log('❌ PROBLEMA CONFIRMADO: View não reflete a atualização!')
      } else {
        console.log('✅ Dados consistentes')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testNotificationStatus()