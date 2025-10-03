"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MessageSquare,
  Plus,
  Search,
  Users,
  MoreVertical,
} from "lucide-react"
import { useChat, type ChatConversation, type ChatUser } from "./use-chat"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"

interface ChatSidebarProps {
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
}

export default function ChatSidebar({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatSidebarProps) {
  const { conversations, users, loading, createDirectConversation } = useChat()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)


  const filteredConversations = conversations.filter(conv =>
    conv.conversation_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  )


  const handleCreateDirectChat = async (userId: string) => {
    console.log('Criando conversa direta com usuário:', userId)
    const conversation = await createDirectConversation(userId)
    if (conversation) {
      console.log('Conversa criada com sucesso:', conversation.id)
      onSelectConversation(conversation.id)
      setShowNewChatDialog(false)
    } else {
      console.log('Erro ao criar conversa')
    }
  }

  // Função removida: handleDeleteConversation - conversas não são mais deletadas

  const handleSelectConversation = (conversationId: string) => {
    console.log('ChatSidebar - Selecionando conversa:', conversationId)
    onSelectConversation(conversationId)
  }


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatLastMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      })
    } catch {
      return 'Agora'
    }
  }

  return (
    <div className="w-80 border-r bg-white flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat
          </h2>
          <div className="flex items-center gap-2">
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Conversa</DialogTitle>
                  <DialogDescription>
                    Selecione um usuário para iniciar uma conversa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Selecionar usuário:
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
                          onClick={() => handleCreateDirectChat(user.id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.department?.name || 'Sem departamento'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Carregando conversas...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma conversa encontrada</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowNewChatDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.conversation_id}
                className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversationId === conversation.conversation_id
                    ? 'bg-blue-100 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectConversation(conversation.conversation_id)}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {conversation.conversation_type === 'direct' 
                        ? getInitials(conversation.other_participant_name || '')
                        : getInitials(conversation.conversation_name || '')
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium truncate">
                        {conversation.conversation_name || 'Conversa sem nome'}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {/* Notificação de mensagens não lidas */}
                        {conversation.unread_count > 0 && (
                          <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {conversation.last_message_text || 'Nenhuma mensagem'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {conversation.last_message_at 
                          ? formatLastMessageTime(conversation.last_message_at)
                          : 'Agora'
                        }
                      </span>
                      {conversation.conversation_type === 'group' && (
                        <Users className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}