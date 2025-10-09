import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-unified-auth'
import { chatCache } from '@/lib/cache'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ChatUser {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  department?: {
    name: string
  }
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  message_text?: string
  message_type: 'text' | 'file' | 'image' | 'document'
  file_path?: string
  file_name?: string
  file_size?: number
  file_type?: string
  reply_to_id?: string
  is_edited: boolean
  edited_at?: string
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
  sender: {
    id: string
    full_name: string
    avatar_url?: string
  }
  reply_to?: {
    id: string
    message_text: string
    sender: {
      full_name: string
    }
  }
}

export interface ChatConversation {
  conversation_id: string
  conversation_name: string
  conversation_type: 'direct' | 'group'
  last_message_text?: string
  last_message_at?: string
  unread_count: number
  other_participant_name?: string
  other_participant_id?: string
}

export function useChat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [users, setUsers] = useState<ChatUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  // Buscar conversas do usuário
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      console.log('Buscando conversas...')
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()
      console.log('Resposta da API:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar conversas')
      }

      console.log('Conversas atualizadas:', data.conversations?.length || 0, 'conversas')
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Erro ao buscar conversas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar conversas')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Buscar usuários da entidade
  const fetchUsers = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      console.log('Buscando usuários...')
      const response = await fetch('/api/chat/users')
      const data = await response.json()
      console.log('Resposta da API de usuários:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar usuários')
      }

      console.log('Usuários carregados:', data.users?.length || 0)
      setUsers(data.users || [])
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Criar nova conversa
  const createConversation = useCallback(async (type: 'direct' | 'group', participantIds: string[], name?: string) => {
    if (!user?.id) return null

    try {
      console.log('Criando conversa:', { type, name, participantIds })
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          name,
          participant_ids: participantIds
        })
      })

      const data = await response.json()
      console.log('Resposta da criação de conversa:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conversa')
      }

      // Atualizar lista de conversas
      console.log('Conversa criada, atualizando lista...')
      await fetchConversations()

      return data.conversation
    } catch (err) {
      console.error('Erro ao criar conversa:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar conversa')
      return null
    }
  }, [user?.id, fetchConversations])

  // Criar conversa direta
  const createDirectConversation = useCallback(async (otherUserId: string) => {
    return createConversation('direct', [otherUserId])
  }, [createConversation])

  // Criar conversa em grupo
  const createGroupConversation = useCallback(async (participantIds: string[], name: string) => {
    return createConversation('group', participantIds, name)
  }, [createConversation])

  // Função removida: deleteConversation - conversas não são mais deletadas

  // Marcar mensagens como lidas
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id) return

    try {
      // Atualizar last_read_at do participante diretamente no banco
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      console.log('Marcando mensagens como lidas para conversa:', conversationId)
      const { error } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao marcar mensagens como lidas:', error)
        return
      }

      // Invalidar cache apenas, sem atualizar conversas imediatamente
      console.log('Marcando mensagens como lidas, invalidando cache...')
      chatCache.invalidateUserConversations(user.id)
      
      // Usar setTimeout para atualizar conversas de forma assíncrona
      setTimeout(() => {
        fetchConversations()
      }, 200)
    } catch (err) {
      console.error('Erro ao marcar mensagens como lidas:', err)
      // Não definir erro aqui para não interromper a experiência do usuário
    }
  }, [user?.id, fetchConversations])

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      console.log('useChat - Carregando dados iniciais para usuário:', user.id)
      fetchConversations()
      fetchUsers()
    } else {
      console.log('useChat - Usuário não encontrado, limpando dados')
      setConversations([])
      setUsers([])
    }
  }, [user?.id]) // Removido fetchConversations e fetchUsers das dependências

  return {
    conversations,
    users,
    loading,
    error,
    fetchConversations,
    fetchUsers,
    createDirectConversation,
    createGroupConversation,
    createConversation,
    markMessagesAsRead
  }
}

export function useChatMessages(conversationId: string | null, onMarkAsRead?: () => void, onMessageSent?: () => void) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set())

  // Buscar mensagens
  const fetchMessages = useCallback(async (offset = 0, limit = 50) => {
    if (!conversationId || !user?.id) return

    try {
      setLoading(true)
      setError(null)

      console.log('Buscando mensagens para conversa:', conversationId, { limit, offset })
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`)
      const data = await response.json()
      console.log('Resposta da busca de mensagens:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar mensagens')
      }

      if (offset === 0) {
        console.log('Mensagens carregadas:', data.messages?.length || 0)
        setMessages(data.messages || [])
      } else {
        setMessages(prev => [...(data.messages || []), ...prev])
      }

      setHasMore((data.messages || []).length === limit)
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar mensagens')
    } finally {
      setLoading(false)
    }
  }, [conversationId, user?.id])

  // Enviar mensagem
  const sendMessage = useCallback(async (messageData: {
    message_text?: string
    message_type?: 'text' | 'file' | 'image' | 'document'
    file_path?: string
    file_name?: string
    file_size?: number
    file_type?: string
    reply_to_id?: string
  }) => {
    if (!conversationId || !user?.id) return null

    try {
      console.log('Enviando mensagem para conversa:', conversationId, messageData)
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })

      const data = await response.json()
      console.log('Resposta do envio de mensagem:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      // Adicionar mensagem à lista
      console.log('Mensagem adicionada à lista:', data.message.id)
      setMessages(prev => [...prev, data.message])

      // Atualizar lista de conversas no sidebar
      if (onMessageSent) {
        console.log('useChatMessages - Chamando onMessageSent callback...')
        onMessageSent()
      }

      return data.message
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
      return null
    }
  }, [conversationId, user?.id])

  // Upload de arquivo
  const uploadFile = useCallback(async (file: File) => {
    if (!user?.id) return null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro no upload do arquivo')
      }

      return data
    } catch (err) {
      console.error('Erro no upload:', err)
      setError(err instanceof Error ? err.message : 'Erro no upload do arquivo')
      return null
    }
  }, [user?.id])

  // Carregar mensagens excluídas do localStorage
  const loadDeletedMessages = useCallback(() => {
    if (!user?.id) return new Set<string>()
    
    try {
      const key = `deleted_messages_${user.id}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const deletedIds = JSON.parse(stored)
        return new Set(deletedIds)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens excluídas:', error)
    }
    return new Set<string>()
  }, [user?.id])

  // Salvar mensagens excluídas no localStorage
  const saveDeletedMessages = useCallback((deletedIds: Set<string>) => {
    if (!user?.id) return
    
    try {
      const key = `deleted_messages_${user.id}`
      localStorage.setItem(key, JSON.stringify(Array.from(deletedIds)))
    } catch (error) {
      console.error('Erro ao salvar mensagens excluídas:', error)
    }
  }, [user?.id])

  // Excluir mensagem (apenas no frontend)
  const deleteMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message || message.sender_id !== user?.id) {
      console.warn('Usuário não pode excluir esta mensagem')
      return false
    }

    const newDeletedIds = new Set(deletedMessageIds)
    newDeletedIds.add(messageId)
    setDeletedMessageIds(newDeletedIds)
    saveDeletedMessages(newDeletedIds)
    
    console.log('Mensagem excluída do frontend:', messageId)
    return true
  }, [messages, deletedMessageIds, user?.id, saveDeletedMessages])

  // Restaurar mensagem excluída
  const restoreMessage = useCallback((messageId: string) => {
    const newDeletedIds = new Set(deletedMessageIds)
    newDeletedIds.delete(messageId)
    setDeletedMessageIds(newDeletedIds)
    saveDeletedMessages(newDeletedIds)
    
    console.log('Mensagem restaurada:', messageId)
    return true
  }, [deletedMessageIds, saveDeletedMessages])

  // Limpar toda a conversa (excluir TODAS as mensagens da conversa)
  const clearConversation = useCallback(() => {
    if (!user?.id) return false

    // Obter todas as mensagens da conversa atual
    const allMessages = messages
    
    if (allMessages.length === 0) {
      console.log('Nenhuma mensagem na conversa para excluir')
      return false
    }

    // Adicionar TODAS as mensagens ao conjunto de excluídas
    const newDeletedIds = new Set(deletedMessageIds)
    allMessages.forEach(message => {
      newDeletedIds.add(message.id)
    })
    
    setDeletedMessageIds(newDeletedIds)
    saveDeletedMessages(newDeletedIds)
    
    console.log(`🗑️ Conversa limpa: ${allMessages.length} mensagens excluídas (todas as mensagens)`)
    return true
  }, [messages, deletedMessageIds, user?.id, saveDeletedMessages])

  // Restaurar toda a conversa (restaurar TODAS as mensagens excluídas)
  const restoreConversation = useCallback(() => {
    if (!user?.id) return false

    // Obter todas as mensagens excluídas da conversa atual
    const allDeletedMessages = messages.filter(message => 
      deletedMessageIds.has(message.id)
    )
    
    if (allDeletedMessages.length === 0) {
      console.log('Nenhuma mensagem excluída para restaurar')
      return false
    }

    // Remover TODAS as mensagens excluídas do conjunto de excluídas
    const newDeletedIds = new Set(deletedMessageIds)
    allDeletedMessages.forEach(message => {
      newDeletedIds.delete(message.id)
    })
    
    setDeletedMessageIds(newDeletedIds)
    saveDeletedMessages(newDeletedIds)
    
    console.log(`🔄 Conversa restaurada: ${allDeletedMessages.length} mensagens restauradas (todas as mensagens)`)
    return true
  }, [messages, deletedMessageIds, user?.id, saveDeletedMessages])

  // Filtrar mensagens excluídas
  const visibleMessages = useMemo(() => {
    return messages.filter(message => !deletedMessageIds.has(message.id))
  }, [messages, deletedMessageIds])

  // Marcar mensagens como lidas
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || !user?.id) return

    try {
      // Atualizar last_read_at do participante diretamente no banco
      console.log('useChatMessages - Marcando mensagens como lidas para conversa:', conversationId)
      const { error } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao marcar mensagens como lidas:', error)
        return
      }

      // Chamar callback para atualizar a lista de conversas com delay para evitar loop
      if (onMarkAsRead) {
        console.log('useChatMessages - Chamando onMarkAsRead callback...')
        setTimeout(() => {
          onMarkAsRead()
        }, 300)
      }
    } catch (err) {
      console.error('Erro ao marcar mensagens como lidas:', err)
      // Não definir erro aqui para não interromper a experiência do usuário
    }
  }, [conversationId, user?.id]) // Removido onMarkAsRead das dependências

  // Carregar mensagens excluídas quando o usuário muda
  useEffect(() => {
    if (user?.id) {
      const loadedDeletedIds = loadDeletedMessages()
      setDeletedMessageIds(loadedDeletedIds)
    }
  }, [user?.id, loadDeletedMessages])

  // Carregar mensagens iniciais
  useEffect(() => {
    if (conversationId) {
      console.log('Carregando mensagens para conversa:', conversationId)
      fetchMessages(0)
    } else {
      console.log('Nenhuma conversa selecionada, limpando mensagens')
      setMessages([])
    }
  }, [conversationId]) // Removido fetchMessages das dependências

  return {
    messages: visibleMessages, // Retornar apenas mensagens visíveis
    loading,
    error,
    hasMore,
    fetchMessages,
    sendMessage,
    uploadFile,
    markMessagesAsRead,
    deleteMessage,
    restoreMessage,
    clearConversation,
    restoreConversation,
    deletedMessageIds
  }
}
