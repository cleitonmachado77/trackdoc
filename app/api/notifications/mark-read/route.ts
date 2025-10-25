import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Usar service role para bypass do RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { notification_id, user_email } = await request.json()
    
    console.log('📖 [API] Marcando notificação como lida:', { notification_id, user_email })
    console.log('🔍 [API] Buscando usuário pelo email:', user_email)
    
    if (!notification_id || !user_email) {
      return NextResponse.json({ error: 'ID da notificação e email do usuário são obrigatórios' }, { status: 400 })
    }

    // Buscar o user_id pelo email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user_email)
      .single()

    if (userError || !userData) {
      console.error('❌ [API] Usuário não encontrado:', userError)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const user_id = userData.id
    console.log('✅ [API] Usuário encontrado:', { user_id, email: user_email })

    // Verificar se a notificação existe na tabela notifications
    const { data: notification, error: checkError } = await supabase
      .from('notifications')
      .select('id, status, recipients, created_by')
      .eq('id', notification_id)
      .single()
    
    if (checkError || !notification) {
      console.error('❌ [API] Notificação não encontrada:', checkError)
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    console.log('🔍 [API] Notificação encontrada:', {
      id: notification.id,
      status: notification.status,
      recipients: notification.recipients,
      created_by: notification.created_by
    })

    // Verificar se o usuário está na lista de recipients ou é o dono da notificação
    const isRecipient = notification.recipients.includes(user_email)
    const isOwner = notification.created_by === user_id
    
    if (!isRecipient && !isOwner) {
      console.error('❌ [API] Usuário não tem acesso a esta notificação', {
        user_email,
        user_id,
        recipients: notification.recipients,
        owner_id: notification.created_by
      })
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Se já está lida, retornar sucesso
    if (notification.status === 'read') {
      console.log('ℹ️ [API] Notificação já estava marcada como lida')
      return NextResponse.json({ success: true, message: 'Notificação já estava marcada como lida' })
    }
    
    // Atualizar status para 'read' na tabela base notifications
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notification_id)
      .select()
    
    if (error) {
      console.error('❌ [API] Erro ao atualizar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Notificação marcada como lida com sucesso:', data)
    return NextResponse.json({ success: true, data })
    
  } catch (error: any) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}