require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixViewDirect() {
  console.log('🔧 Tentando corrigir a view diretamente...')
  
  try {
    // Vamos tentar uma abordagem diferente
    // Como a view parece estar "cached" ou não atualizada, vamos forçar uma nova definição
    
    console.log('📝 Tentando recriar a view...')
    
    // Primeiro, vamos verificar se conseguimos fazer uma query que force a recriação
    const createViewSQL = `
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
        recipients,
        status,
        priority,
        channels,
        created_at,
        updated_at,
        sent_at,
        scheduled_for,
        created_by,
        read_count,
        total_recipients,
        'notifications' as source
      FROM public.notifications;
    `
    
    // Como não temos exec_sql, vamos tentar uma abordagem alternativa
    // Vamos verificar se há alguma função disponível
    console.log('🔍 Verificando funções disponíveis...')
    
    const { data: functions, error: funcError } = await supabase.rpc('get_schema', {})
    
    if (funcError) {
      console.log('⚠️ Não foi possível verificar funções:', funcError.message)
    }
    
    // Vamos tentar uma abordagem diferente - verificar se a view tem algum problema de definição
    console.log('🔍 Analisando a view atual...')
    
    // Buscar todas as notificações com status 'read' na tabela base
    const { data: readNotifications, error: readError } = await supabase
      .from('notifications')
      .select('id, status')
      .eq('status', 'read')
    
    if (readError) {
      console.error('❌ Erro ao buscar notificações lidas:', readError)
    } else {
      console.log(`📊 Notificações com status 'read' na tabela base: ${readNotifications.length}`)
    }
    
    // Buscar as mesmas na view
    const { data: readInView, error: viewReadError } = await supabase
      .from('notification_feed')
      .select('id, status, is_read')
      .eq('status', 'read')
    
    if (viewReadError) {
      console.error('❌ Erro ao buscar na view:', viewReadError)
    } else {
      console.log(`📊 Notificações com status 'read' na view: ${readInView.length}`)
      const actuallyRead = readInView.filter(n => n.is_read).length
      console.log(`📊 Notificações com is_read=true na view: ${actuallyRead}`)
      
      if (actuallyRead < readInView.length) {
        console.log('❌ CONFIRMADO: A view não está mapeando corretamente!')
        
        // Vamos tentar forçar uma atualização fazendo uma query complexa
        console.log('🔄 Tentando forçar refresh da view...')
        
        // Fazer uma query que pode forçar o Supabase a recompilar a view
        const { data: refreshTest, error: refreshError } = await supabase
          .from('notification_feed')
          .select('id, is_read, status')
          .limit(1)
        
        if (refreshError) {
          console.error('❌ Erro no refresh test:', refreshError)
        } else {
          console.log('✅ Refresh test executado')
        }
      }
    }
    
    console.log('\n💡 SOLUÇÃO RECOMENDADA:')
    console.log('Execute o seguinte SQL diretamente no Supabase Dashboard:')
    console.log(createViewSQL)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixViewDirect()