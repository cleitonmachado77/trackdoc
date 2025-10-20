import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
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
        // Garantir que conversation é um objeto único
        const conversation = Array.isArray(conv.conversation) ? conv.conversation[0] : conv.conversation
        
        if (!conversation) {
          return null
        }
        
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
            .maybeSingle()
          
          // Garantir que profile é um objeto
          const profile = Array.isArray(otherParticipant?.profile) ? otherParticipant.profile[0] : otherParticipant?.profile
          
          return {
            conversation_id: conversation.id,
            conversation_name: profile?.full_name || 'Usuário',
            conversation_type: conversation.type,
            last_message_text: '',
            last_message_at: conversation.updated_at,
            unread_count: 0,
            other_participant_name: profile?.full_name || '',
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

    // Filtrar nulls e ordenar por updated_at
    const validConversations = formattedConversations.filter((c): c is NonNullable<typeof c> => c !== null)
    validConversations.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    )

    logger.info('Conversas formatadas:', { count: validConversations.length, conversations: validConversations })

    // Armazenar no cache
    chatCache.setUserConversations(user.id, validConversations)

    return NextResponse.json({ conversations: validConversations })
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
      
      logger.info('🔍 Criando conversa direta entre usuários:', { user1: user.id, user2: otherUserId })
      
      try {
        // Tentar usar a função RPC primeiro
        const { data: conversationId, error: conversationError } = await supabase
          .rpc('find_or_create_direct_conversation', { 
            user1_id: user.id, 
            user2_id: otherUserId 
          })

        logger.info('📊 Resultado da chamada RPC:', { conversationId, error: conversationError })

        // Se a função RPC falhar, criar manualmente
        if (conversationError) {
          logger.error('❌ Erro na função RPC, criando manualmente:', conversationError)
          
          // Buscar conversa existente manualmente
          const { data: existingConv } = await supabase
            .from('chat_conversations')
            .select(`
              id,
              chat_participants!inner(
                user_id,
                is_active
              )
            `)
            .eq('type', 'direct')
            .eq('entity_id', profile.entity_id)
            .eq('is_active', true)
            .or(`user_id.eq.${user.id},user_id.eq.${otherUserId}`, { foreignTable: 'chat_participants' })
            .eq('chat_participants.is_active', true)
          
          logger.info('🔎 Conversas existentes encontradas:', existingConv)
          
          let finalConversationId = null
          
          // Verificar se alguma conversa tem exatamente os 2 usuários
          if (existingConv && existingConv.length > 0) {
            for (const conv of existingConv) {
              const { data: participants } = await supabase
                .from('chat_participants')
                .select('user_id')
                .eq('conversation_id', conv.id)
                .eq('is_active', true)
              
              if (participants && participants.length === 2) {
                const userIds = participants.map(p => p.user_id).sort()
                const targetIds = [user.id, otherUserId].sort()
                
                if (JSON.stringify(userIds) === JSON.stringify(targetIds)) {
                  finalConversationId = conv.id
                  logger.info('✅ Conversa existente encontrada:', finalConversationId)
                  break
                }
              }
            }
          }
          
          // Se não encontrou, criar nova conversa
          if (!finalConversationId) {
            logger.info('⚡ Criando nova conversa direta manualmente')
            
            const { data: newConv, error: createError } = await supabase
              .from('chat_conversations')
              .insert({
                type: 'direct',
                entity_id: profile.entity_id,
                created_by: user.id,
                is_active: true
              })
              .select()
              .single()
            
            if (createError || !newConv) {
              logger.error('❌ Erro ao criar conversa:', createError)
              return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
            }
            
            finalConversationId = newConv.id
            logger.info('✅ Nova conversa criada:', finalConversationId)
            
            // Adicionar participantes
            const { error: participantsError } = await supabase
              .from('chat_participants')
              .insert([
                { conversation_id: finalConversationId, user_id: user.id, is_active: true },
                { conversation_id: finalConversationId, user_id: otherUserId, is_active: true }
              ])
            
            if (participantsError) {
              logger.error('❌ Erro ao adicionar participantes:', participantsError)
              return NextResponse.json({ error: 'Erro ao adicionar participantes' }, { status: 500 })
            }
            
            logger.info('✅ Participantes adicionados com sucesso')
          }
          
          // Buscar dados completos da conversa
          const { data: conversation, error: fetchError } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', finalConversationId)
            .single()

          if (fetchError || !conversation) {
            logger.error('❌ Erro ao buscar conversa criada:', fetchError)
            return NextResponse.json({ error: 'Erro ao buscar conversa' }, { status: 500 })
          }

          // Invalidar cache
          chatCache.invalidateUserConversations(user.id)
          chatCache.invalidateUserConversations(otherUserId)

          logger.info('🎉 Retornando conversa (método manual):', conversation)
          return NextResponse.json({ conversation })
        }

        // Se a função RPC funcionou, buscar dados da conversa
        if (conversationId) {
          // Aguardar um momento para garantir que a transação foi commitada
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Tentar buscar a conversa usando diferentes métodos
          logger.info('🔎 Buscando conversa criada com ID:', conversationId)
          
          // Método 1: Busca simples
          let { data: conversation, error: fetchError } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', conversationId)
            .maybeSingle()

          logger.info('📊 Resultado da busca (método 1):', { conversation, error: fetchError })

          // Se não encontrou, tentar sem .single() e pegar o primeiro
          if (!conversation && !fetchError) {
            logger.info('⚠️ Conversa não encontrada com maybeSingle, tentando sem filtro...')
            
            const { data: allConversations } = await supabase
              .from('chat_conversations')
              .select('*')
              .eq('id', conversationId)
            
            logger.info('📊 Todas as conversas com esse ID:', allConversations)
            
            if (allConversations && allConversations.length > 0) {
              conversation = allConversations[0]
            }
          }

          // Se ainda não encontrou, verificar se a conversa realmente existe
          if (!conversation) {
            logger.error('❌ Conversa não encontrada após criação. Verificando existência...')
            
            const { count } = await supabase
              .from('chat_conversations')
              .select('*', { count: 'exact', head: true })
              .eq('id', conversationId)
            
            logger.info('📊 Contagem de conversas com esse ID:', count)
            
            if (count === 0) {
              logger.error('❌ Conversa NÃO EXISTE no banco! Problema na função RPC.')
              return NextResponse.json({ error: 'Erro ao criar conversa: não foi salva no banco' }, { status: 500 })
            }
            
            // Se existe mas não conseguimos ler, pode ser problema de RLS
            logger.error('❌ Conversa EXISTE mas não conseguimos ler. Provável problema de RLS.')
            
            // Tentar criar objeto da conversa manualmente
            conversation = {
              id: conversationId,
              type: 'direct',
              name: null,
              entity_id: profile.entity_id,
              created_by: user.id,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            logger.info('✅ Retornando conversa construída manualmente')
          }

          // Invalidar cache
          chatCache.invalidateUserConversations(user.id)
          chatCache.invalidateUserConversations(otherUserId)

          logger.info('🎉 Retornando conversa (método RPC):', conversation)
          return NextResponse.json({ conversation })
        }

        logger.error('❌ Nenhum ID de conversa retornado')
        return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
        
      } catch (err) {
        logger.error('❌ Exceção ao criar conversa direta:', err)
        return NextResponse.json({ error: 'Erro interno ao criar conversa' }, { status: 500 })
      }
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
