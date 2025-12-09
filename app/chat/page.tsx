"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ChatSidebar from "../components/chat/chat-sidebar"
import ChatMessages from "../components/chat/chat-messages"
import { MessageSquare } from "lucide-react"
import { useChat } from "../components/chat/use-chat"
import { FeatureGate } from "@/components/subscription/FeatureGate"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { fetchConversations, markMessagesAsRead } = useChat()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClientSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [])


  const handleSelectConversation = (conversationId: string) => {
    console.log('Selecionando conversa:', conversationId)
    setSelectedConversationId(conversationId)
    // Marcar mensagens como lidas quando a conversa é selecionada
    if (conversationId) {
      markMessagesAsRead(conversationId)
    }
  }

  const handleNewConversation = () => {
    setSelectedConversationId(null)
  }

  const handleMarkAsRead = () => {
    // Atualizar a lista de conversas após marcar mensagens como lidas
    console.log('Marcando mensagens como lidas, atualizando lista...')
    fetchConversations()
  }

  const handleMessageSent = () => {
    // Atualizar a lista de conversas após enviar uma mensagem
    console.log('Mensagem enviada, atualizando lista de conversas...')
    fetchConversations()
  }

  return (
    <FeatureGate 
      userId={userId} 
      feature="chat_nativo"
      customMessage="O Chat está disponível apenas no plano Enterprise. Faça upgrade para ter acesso a esta funcionalidade."
    >
      <div className="h-screen flex bg-gray-50">
        <ChatSidebar
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
        <ChatMessages 
          conversationId={selectedConversationId} 
          onMarkAsRead={handleMarkAsRead}
          onMessageSent={handleMessageSent}
        />
      </div>
    </FeatureGate>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
