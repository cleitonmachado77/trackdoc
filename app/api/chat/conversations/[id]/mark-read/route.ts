import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookies().set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const conversationId = params.id

    // Verificar se o usuário é participante ativo da conversa
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar todas as mensagens não lidas da conversa
    // Primeiro, buscar mensagens já lidas pelo usuário
    const { data: readMessages, error: readError } = await supabase
      .from('chat_message_reads')
      .select('message_id')
      .eq('user_id', user.id)

    if (readError) {
      console.error('Erro ao buscar mensagens lidas:', readError)
      return NextResponse.json({ error: 'Erro ao buscar mensagens lidas' }, { status: 500 })
    }

    const readMessageIds = readMessages?.map(r => r.message_id) || []

    // Buscar mensagens não lidas da conversa
    let query = supabase
      .from('chat_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .not('sender_id', 'eq', user.id) // Não marcar mensagens próprias como lidas

    // Se há mensagens já lidas, filtrar para excluí-las
    if (readMessageIds.length > 0) {
      query = query.not('id', 'in', `(${readMessageIds.join(',')})`)
    }

    const { data: unreadMessages, error: messagesError } = await query

    if (messagesError) {
      console.error('Erro ao buscar mensagens não lidas:', messagesError)
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
    }

    if (unreadMessages && unreadMessages.length > 0) {
      // Marcar mensagens como lidas
      const readRecords = unreadMessages.map(message => ({
        message_id: message.id,
        user_id: user.id,
        read_at: new Date().toISOString()
      }))

      const { error: readError } = await supabase
        .from('chat_message_reads')
        .insert(readRecords)

      if (readError) {
        console.error('Erro ao marcar mensagens como lidas:', readError)
        return NextResponse.json({ error: 'Erro ao marcar mensagens como lidas' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, marked_count: unreadMessages?.length || 0 })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
