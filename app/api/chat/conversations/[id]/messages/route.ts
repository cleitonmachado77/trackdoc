import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { chatCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Buscar mensagens
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar mensagens:', error)
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
    }

    // Marcar mensagens como lidas
    if (messages && messages.length > 0) {
      const messageIds = messages.map(m => m.id)
      const { error: readError } = await supabase
        .from('chat_message_reads')
        .upsert(
          messageIds.map(messageId => ({
            message_id: messageId,
            user_id: user.id
          })),
          { onConflict: 'message_id,user_id' }
        )

      if (readError) {
        console.warn('Erro ao marcar mensagens como lidas:', readError)
      }

      // Atualizar last_read_at do participante
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ messages: messages?.reverse() || [] })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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
    const body = await request.json()
    const { message_text, message_type, file_path, file_name, file_size, file_type, reply_to_id } = body

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

    // Validar dados
    if (!message_text && !file_path) {
      return NextResponse.json({ error: 'Mensagem ou arquivo é obrigatório' }, { status: 400 })
    }

    // Criar mensagem
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_text: message_text || null,
        message_type: message_type || 'text',
        file_path: file_path || null,
        file_name: file_name || null,
        file_size: file_size || null,
        file_type: file_type || null,
        reply_to_id: reply_to_id || null
      })
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar mensagem:', error)
      return NextResponse.json({ error: 'Erro ao criar mensagem' }, { status: 500 })
    }

    // Atualizar updated_at da conversa
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Invalidar cache das conversas dos participantes
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('is_active', true)

    if (participants) {
      participants.forEach(participant => {
        chatCache.invalidateUserConversations(participant.user_id)
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
