import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Usar service role para bypass do RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, user_email } = await request.json()
    
    console.log('📖 [API] Marcando notificação como lida:', { id, user_email })
    
    // Verificar se a notificação existe
    const { data: notification, error: checkError } = await supabase
      .from('notification_feed')
      .select('id')
      .eq('id', id)
      .single()
    
    if (checkError) {
      console.error('❌ [API] Erro ao verificar notificação:', checkError)
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }
    
    // Atualizar status na tabela notification_feed
    const { data, error } = await supabase
      .from('notification_feed')
      .update({ is_read: true })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('❌ [API] Erro ao atualizar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Notificação atualizada com sucesso')
    return NextResponse.json({ success: true, data })
    
  } catch (error: any) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids')?.split(',')
    const user_email = searchParams.get('user_email')
    
    if (!user_email) {
      return NextResponse.json({ error: 'Email do usuário é obrigatório' }, { status: 400 })
    }
    
    let targetIds: string[] = []
    
    if (id) {
      targetIds = [id]
    } else if (ids) {
      targetIds = ids
    } else {
      return NextResponse.json({ error: 'ID ou IDs são obrigatórios' }, { status: 400 })
    }
    
    console.log('🗑️ [API] Removendo notificações:', { targetIds, user_email })
    
    // Verificar permissões para todas as notificações
    const { data: notifications, error: checkError } = await supabase
      .from('notifications')
      .select('id, recipients')
      .in('id', targetIds)
    
    if (checkError) {
      console.error('❌ [API] Erro ao verificar notificações:', checkError)
      return NextResponse.json({ error: 'Erro ao verificar notificações' }, { status: 500 })
    }
    
    // Filtrar apenas notificações que o usuário pode deletar
    const allowedIds = notifications
      ?.filter(n => n.recipients.includes(user_email))
      .map(n => n.id) || []
    
    if (allowedIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma notificação encontrada ou sem permissão' }, { status: 403 })
    }
    
    // Deletar notificações permitidas
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .in('id', allowedIds)
      .select()
    
    if (error) {
      console.error('❌ [API] Erro ao deletar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Notificações removidas com sucesso:', allowedIds.length)
    return NextResponse.json({ success: true, deleted: allowedIds.length, data })
    
  } catch (error: any) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}