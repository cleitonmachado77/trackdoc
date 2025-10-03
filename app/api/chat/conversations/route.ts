import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { chatCache } from '@/lib/cache'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
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

    // Verificar cache primeiro
    const cachedConversations = chatCache.getUserConversations(user.id)
    if (cachedConversations) {
      return NextResponse.json({ conversations: cachedConversations })
    }
    
    // Usar consulta direta otimizada com nomes dos usuários
    logger.info('Usando consulta direta para usuário:', user.id)
    
    // Buscar conversas do usuário (simplificado)
    logger.info('Buscando conversas para usuário:', user.id)
    
    // Primeiro, verificar se existem participantes para este usuário
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('conversation_id, user_id, is_active')
      .eq('user_id', user.id)
    
    logger.info('Participantes encontrados para o usuário:', { participants, error: participantsError })
    
    // Buscar conversas do usuário
    const { data: conversations, error } = await supabase
      .from('chat_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversation:chat_conversations(
          id,
          name,
          type,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    logger.info('Conversas encontradas:', { 
      count: conversations?.length, 
      error,
      conversations: conversations?.map(c => ({
        conversation_id: c.conversation_id,
        conversation: c.conversation
      }))
    })
    
    if (error) {
      logger.error('Erro ao buscar conversas:', error)
      return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 })
    }

    // Buscar conversas ocultas para filtrar
    const { data: hiddenConversations } = await supabase
      .from('chat_hidden_conversations')
      .select('conversation_id')
      .eq('user_id', user.id)
    
    const hiddenIds = new Set(hiddenConversations?.map(h => h.conversation_id) || [])
    
    logger.info('Conversas ocultas encontradas:', { hiddenIds: Array.from(hiddenIds), count: hiddenIds.size })
    
    // Filtrar conversas ocultas
    const visibleConversations = (conversations || []).filter(conv => 
      !hiddenIds.has(conv.conversation_id)
    )
    
    logger.info('Conversas visíveis após filtrar ocultas:', { 
      count: visibleConversations.length,
      total: conversations?.length || 0,
      hidden: hiddenIds.size
    })

    // Buscar informações dos outros participantes para conversas diretas
    const formattedConversations = await Promise.all(
      visibleConversations.map(async (conv) => {
        const conversation = conv.conversation
        
        if (conversation.type === 'direct') {
          // Buscar o outro participante da conversa direta
          const { data: otherParticipant } = await supabase
            .from('chat_participants')
            .select(`
              user_id,
              profile:profiles!chat_participants_user_id_fkey(
                id,
                full_name
              )
            `)
            .eq('conversation_id', conversation.id)
            .eq('is_active', true)
            .neq('user_id', user.id)
            .single()
          
          return {
            conversation_id: conversation.id,
            conversation_name: otherParticipant?.profile?.full_name || 'Usuário',
            conversation_type: conversation.type,
            last_message_text: '',
            last_message_at: conversation.updated_at,
            unread_count: 0,
            other_participant_name: otherParticipant?.profile?.full_name || '',
            other_participant_id: otherParticipant?.user_id || ''
          }
        } else {
          return {
            conversation_id: conversation.id,
            conversation_name: conversation.name || 'Conversa sem nome',
            conversation_type: conversation.type,
            last_message_text: '',
            last_message_at: conversation.updated_at,
            unread_count: 0,
            other_participant_name: '',
            other_participant_id: ''
          }
        }
      })
    )

    // Ordenar por updated_at
    formattedConversations.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    )

    logger.info('Conversas formatadas:', { count: formattedConversations.length, conversations: formattedConversations })

    // Armazenar no cache
    chatCache.setUserConversations(user.id, formattedConversations)

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    logger.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { type, name, participant_ids } = body

    // Validar dados
    if (!type || !participant_ids || !Array.isArray(participant_ids)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar entity_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('entity_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Para conversas diretas, usar função otimizada que evita duplicação
    if (type === 'direct' && participant_ids.length === 1) {
      const otherUserId = participant_ids[0]
      
      logger.info('Criando conversa direta entre usuários:', { user1: user.id, user2: otherUserId })
      const { data: conversationId, error: conversationError } = await supabase
        .rpc('find_or_create_direct_conversation', { 
          user1_id: user.id, 
          user2_id: otherUserId 
        })

      logger.info('Resultado da criação de conversa direta:', { conversationId, error: conversationError })

      // Verificar se os participantes foram criados
      if (conversationId && !conversationError) {
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('user_id, is_active')
          .eq('conversation_id', conversationId)
        
        logger.info('Participantes da conversa criada:', { participants, error: participantsError })
        
        // Verificar se já existe uma conversa entre estes usuários
        const { data: existingConversations, error: existingError } = await supabase
          .from('chat_participants')
          .select(`
            conversation_id,
            conversation:chat_conversations(
              id,
              type,
              entity_id
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('conversation.type', 'direct')
        
        logger.info('Conversas diretas existentes do usuário:', { existingConversations, error: existingError })
        
        // Verificar se a conversa criada tem participantes
        const { data: allParticipants, error: allParticipantsError } = await supabase
          .from('chat_participants')
          .select('user_id, is_active')
          .eq('conversation_id', conversationId)
        
        logger.info('Todos os participantes da conversa criada:', { allParticipants, error: allParticipantsError })
      }

      if (conversationError) {
        console.error('Erro ao buscar/criar conversa direta:', conversationError)
        return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
      }

      // Buscar dados completos da conversa
      const { data: conversation, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      logger.info('Conversa criada encontrada:', { conversation, error: fetchError })

      if (fetchError) {
        console.error('Erro ao buscar conversa criada:', fetchError)
        return NextResponse.json({ error: 'Erro ao buscar conversa' }, { status: 500 })
      }

      // Invalidar cache das conversas dos usuários
      logger.info('Invalidando cache para usuários:', { user1: user.id, user2: otherUserId })
      chatCache.invalidateUserConversations(user.id)
      chatCache.invalidateUserConversations(otherUserId)

      logger.info('Retornando conversa criada:', conversation)
      return NextResponse.json({ conversation })
    }

    // Para conversas em grupo, criar normalmente
    logger.info('Criando conversa em grupo:', { type, name, entity_id: profile.entity_id, created_by: user.id })
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .insert({
        type,
        name: name || null,
        entity_id: profile.entity_id,
        created_by: user.id
      })
      .select()
      .single()

    logger.info('Resultado da criação de conversa em grupo:', { conversation, error: conversationError })

    if (conversationError) {
      console.error('Erro ao criar conversa:', conversationError)
      return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
    }

    // Adicionar participantes
    const participants = [
      { conversation_id: conversation.id, user_id: user.id },
      ...participant_ids.map((id: string) => ({ conversation_id: conversation.id, user_id: id }))
    ]

    logger.info('Adicionando participantes:', participants)
    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(participants)

    logger.info('Resultado da adição de participantes:', { error: participantsError })

    if (participantsError) {
      console.error('Erro ao adicionar participantes:', participantsError)
      return NextResponse.json({ error: 'Erro ao adicionar participantes' }, { status: 500 })
    }

    // Invalidar cache das conversas dos participantes
    logger.info('Invalidando cache para participantes:', participants.map(p => p.user_id))
    participants.forEach(participant => {
      chatCache.invalidateUserConversations(participant.user_id)
    })

    logger.info('Retornando conversa em grupo criada:', conversation)
    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
