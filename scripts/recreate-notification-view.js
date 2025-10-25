require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function recreateNotificationView() {
  console.log('🔄 Recriando view notification_feed...')
  
  try {
    // Primeiro, vamos dropar a view existente
    console.log('🗑️ Removendo view existente...')
    
    // Como não temos exec_sql, vamos tentar uma abordagem diferente
    // Vamos verificar se conseguimos acessar a view atual
    const { data: currentView, error: viewError } = await supabase
      .from('notification_feed')
      .select('*')
      .limit(1)
    
    if (viewError) {
      console.log('⚠️ View atual com problema:', viewError.message)
    } else {
      console.log('✅ View atual acessível, dados:', currentView)
    }
    
    // Vamos testar se a view está mapeando corretamente
    console.log('🔍 Testando mapeamento da view...')
    
    // Buscar uma notificação específica na tabela base
    const { data: baseNotification, error: baseError } = await supabase
      .from('notifications')
      .select('id, status')
      .eq('id', 'f77eec10-f636-494d-bc0c-09cd80975cf9')
      .single()
    
    if (baseError) {
      console.error('❌ Erro ao buscar na tabela base:', baseError)
    } else {
      console.log('📊 Notificação na tabela base:', baseNotification)
    }
    
    // Buscar a mesma notificação na view
    const { data: viewNotification, error: viewNotificationError } = await supabase
      .from('notification_feed')
      .select('id, status, is_read')
      .eq('id', 'f77eec10-f636-494d-bc0c-09cd80975cf9')
      .single()
    
    if (viewNotificationError) {
      console.error('❌ Erro ao buscar na view:', viewNotificationError)
    } else {
      console.log('📊 Notificação na view:', viewNotification)
    }
    
    // Comparar os resultados
    if (baseNotification && viewNotification) {
      console.log('🔍 Comparação:')
      console.log(`   Tabela base - status: ${baseNotification.status}`)
      console.log(`   View - status: ${viewNotification.status}, is_read: ${viewNotification.is_read}`)
      
      if (baseNotification.status === 'read' && !viewNotification.is_read) {
        console.log('❌ PROBLEMA: View não está refletindo o status atualizado!')
        console.log('💡 Isso indica que a view precisa ser recriada ou há cache')
      } else {
        console.log('✅ View está mapeando corretamente')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

recreateNotificationView()