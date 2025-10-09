"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ChatSidebar from "../components/chat/chat-sidebar"
import ChatMessages from "../components/chat/chat-messages"
import { MessageSquare } from "lucide-react"
import { useChat } from "../components/chat/use-chat"

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const { fetchConversations, markMessagesAsRead } = useChat()


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
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
