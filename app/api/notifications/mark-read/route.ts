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

    // Verificar se a notificação existe para este usuário
    const { data: notification, error: checkError } = await supabase
      .from('notification_feed')
      .select('id, is_read')
      .eq('id', notification_id)
      .eq('user_id', user_id)
      .single()
    
    if (checkError || !notification) {
      console.error('❌ [API] Notificação não encontrada:', checkError)
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    // Se já está lida, retornar sucesso
    if (notification.is_read) {
      console.log('ℹ️ [API] Notificação já estava marcada como lida')
      return NextResponse.json({ success: true, message: 'Notificação já estava marcada como lida' })
    }
    
    // Atualizar status na tabela notification_feed
    const { data, error } = await supabase
      .from('notification_feed')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', user_id)
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