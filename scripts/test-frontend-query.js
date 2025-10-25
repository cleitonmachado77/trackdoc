require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFrontendQuery() {
  console.log('🔍 Testando query que o frontend deveria usar...')
  
  const userEmail = 'cleitoncr767@gmail.com'
  
  try {
    // Esta é a query que o frontend deveria estar fazendo
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .contains('recipients', [userEmail])
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('❌ Erro na query:', error)
    } else {
      console.log(`📊 Total de notificações encontradas: ${data.length}`)
      
      // Verificar quantas estão lidas vs não lidas
      const readNotifications = data.filter(n => n.status === 'read')
      const unreadNotifications = data.filter(n => n.status !== 'read')
      
      console.log(`📖 Notificações lidas: ${readNotifications.length}`)
      console.log(`📧 Notificações não lidas: ${unreadNotifications.length}`)
      
      // Mostrar detalhes da notificação específica
      const specificNotification = data.find(n => n.id === 'f77eec10-f636-494d-bc0c-09cd80975cf9')
      if (specificNotification) {
        console.log('\n🎯 Notificação específica:')
        console.log(`   ID: ${specificNotification.id}`)
        console.log(`   Status: ${specificNotification.status}`)
        console.log(`   Título: ${specificNotification.title}`)
        console.log(`   Deveria aparecer como lida: ${specificNotification.status === 'read'}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testFrontendQuery()