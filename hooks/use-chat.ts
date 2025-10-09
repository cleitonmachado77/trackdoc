import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '../lib/contexts/hybrid-auth-context'

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

      const { data, error } = await supabase
        .rpc('get_user_conversations', { user_id: user.id })

      if (error) throw error

      setConversations(data || [])
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

      const response = await fetch('/api/chat/users')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar usuários')
      }

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

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conversa')
      }

      // Atualizar lista de conversas
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

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      fetchConversations()
      fetchUsers()
    }
  }, [user?.id, fetchConversations, fetchUsers])

  return {
    conversations,
    users,
    loading,
    error,
    fetchConversations,
    fetchUsers,
    createDirectConversation,
    createGroupConversation,
    createConversation
  }
}

export function useChatMessages(conversationId: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Buscar mensagens
  const fetchMessages = useCallback(async (offset = 0, limit = 50) => {
    if (!conversationId || !user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar mensagens')
      }

      if (offset === 0) {
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
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      // Adicionar mensagem à lista
      setMessages(prev => [...prev, data.message])

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

  // Carregar mensagens iniciais
  useEffect(() => {
    if (conversationId) {
      fetchMessages(0)
    } else {
      setMessages([])
    }
  }, [conversationId, fetchMessages])

  return {
    messages,
    loading,
    error,
    hasMore,
    fetchMessages,
    sendMessage,
    uploadFile
  }
}
