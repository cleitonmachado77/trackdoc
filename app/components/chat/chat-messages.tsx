"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Send,
  Paperclip,
  Image,
  FileText,
  Download,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  RotateCcw,
} from "lucide-react"
import { useChatMessages, useChat, type ChatMessage } from "./use-chat"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"
import { useAuth } from "../../../lib/contexts/auth-context"

interface ChatMessagesProps {
  conversationId: string | null
  onMarkAsRead?: () => void
  onMessageSent?: () => void
}

export default function ChatMessages({ conversationId, onMarkAsRead, onMessageSent }: ChatMessagesProps) {
  const { user } = useAuth()
  const { conversations } = useChat()
  const { messages, loading, sendMessage, uploadFile, markMessagesAsRead, deleteMessage, restoreMessage, clearConversation, restoreConversation, deletedMessageIds } = useChatMessages(conversationId, onMarkAsRead, onMessageSent)
  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Buscar informações da conversa selecionada
  const selectedConversation = conversations.find(conv => conv.conversation_id === conversationId)
  
  console.log('ChatMessages - Conversa selecionada:', {
    conversationId,
    selectedConversation,
    totalConversations: conversations.length
  })

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Marcar mensagens como lidas quando o componente é montado ou a conversa muda
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      console.log('ChatMessages - Marcando mensagens como lidas para conversa:', conversationId)
      // Usar setTimeout para evitar loop infinito
      const timeoutId = setTimeout(() => {
        markMessagesAsRead()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [conversationId, messages.length]) // Removido markMessagesAsRead das dependências

  // Configurar input de arquivo
  useEffect(() => {
    if (fileInputRef.current) {
      setFileInput(fileInputRef.current)
    }
  }, [])

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !replyingTo) return

    const messageData = {
      message_text: newMessage.trim(),
      reply_to_id: replyingTo?.id
    }

    console.log('Enviando mensagem:', messageData)
    const sentMessage = await sendMessage(messageData)
    if (sentMessage) {
      console.log('Mensagem enviada com sucesso')
      setNewMessage("")
      setReplyingTo(null)
    } else {
      console.log('Erro ao enviar mensagem')
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    console.log('🔴 Tentando excluir mensagem:', messageId)
    console.log('📊 Estado atual deletedMessageIds:', deletedMessageIds)
    console.log('👤 Usuário atual:', user?.id)
    
    if (deleteMessage(messageId)) {
      console.log('✅ Mensagem excluída com sucesso')
    } else {
      console.log('❌ Não foi possível excluir a mensagem')
    }
  }

  const handleRestoreMessage = (messageId: string) => {
    console.log('🔄 Tentando restaurar mensagem:', messageId)
    
    if (restoreMessage(messageId)) {
      console.log('✅ Mensagem restaurada com sucesso')
    } else {
      console.log('❌ Não foi possível restaurar a mensagem')
    }
  }

  const handleClearConversation = () => {
    console.log('🗑️ Tentando limpar toda a conversa')
    
    if (clearConversation()) {
      console.log('✅ Conversa limpa com sucesso')
    } else {
      console.log('❌ Não foi possível limpar a conversa')
    }
  }

  const handleRestoreConversation = () => {
    console.log('🔄 Tentando restaurar toda a conversa')
    
    if (restoreConversation()) {
      console.log('✅ Conversa restaurada com sucesso')
    } else {
      console.log('❌ Não foi possível restaurar a conversa')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const uploadResult = await uploadFile(file)
    if (uploadResult) {
      const messageData = {
        message_type: file.type.startsWith('image/') ? 'image' : 'file',
        file_path: uploadResult.file_path,
        file_name: uploadResult.file_name,
        file_size: uploadResult.file_size,
        file_type: uploadResult.file_type,
        reply_to_id: replyingTo?.id
      }

      await sendMessage(messageData)
      setReplyingTo(null)
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      })
    } catch {
      return 'Agora'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />
    return <Paperclip className="h-4 w-4" />
  }

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwn = message.sender_id === user?.id
    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id
    const showTime = index === messages.length - 1 || 
      new Date(message.created_at).getTime() - new Date(messages[index + 1]?.created_at).getTime() > 300000 // 5 minutos

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
        <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
          {showAvatar && !isOwn && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender.avatar_url} />
              <AvatarFallback>{getInitials(message.sender.full_name)}</AvatarFallback>
            </Avatar>
          )}
          {showAvatar && isOwn && <div className="w-8" />}
          
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            {!isOwn && showAvatar && (
              <span className="text-xs text-gray-500 mb-1">{message.sender.full_name}</span>
            )}
            
            <div className={`rounded-lg px-3 py-2 ${
              isOwn 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              {message.reply_to && (
                <div className={`text-xs mb-2 p-2 rounded border-l-2 ${
                  isOwn ? 'bg-blue-500 border-blue-300' : 'bg-gray-200 border-gray-300'
                }`}>
                  <div className="font-medium">{message.reply_to.sender.full_name}</div>
                  <div className="truncate">{message.reply_to.message_text}</div>
                </div>
              )}
              
              {message.message_text && (
                <p className="whitespace-pre-wrap">{message.message_text}</p>
              )}
              
              {message.file_path && (
                <div className="mt-2">
                  <div className={`flex items-center space-x-2 p-2 rounded ${
                    isOwn ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    {getFileIcon(message.file_type || '')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.file_name}</p>
                      <p className="text-xs opacity-75">{formatFileSize(message.file_size || 0)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        // Implementar download
                        const link = document.createElement('a')
                        link.href = `/api/chat/download/${message.file_path}`
                        link.download = message.file_name || 'arquivo'
                        link.click()
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {message.message_type === 'image' && (
                    <img
                      src={`/api/chat/download/${message.file_path}`}
                      alt={message.file_name}
                      className="mt-2 max-w-full h-auto rounded"
                      style={{ maxHeight: '200px' }}
                    />
                  )}
                </div>
              )}
            </div>
            
            {showTime && (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(message.created_at)}
                  </span>
                  {isOwn && (
                    <div className="flex items-center">
                      {message.created_at === message.updated_at ? (
                        <Check className="h-3 w-3 text-gray-400" />
                      ) : (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  )}
                </div>
                
                {isOwn && (
                  <div className="flex items-center space-x-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                          title="Opções da mensagem"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!deletedMessageIds.has(message.id) ? (
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir mensagem
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleRestoreMessage(message.id)}
                            className="text-green-600 focus:text-green-600"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar mensagem
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Botão direto para facilitar teste */}
                    {!deletedMessageIds.has(message.id) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteMessage(message.id)}
                        title="Excluir mensagem"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                        onClick={() => handleRestoreMessage(message.id)}
                        title="Restaurar mensagem"
                      >
                        <RotateCcw className="h-3 w-3 text-green-500" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
          <p className="text-gray-500">Escolha uma conversa para começar a conversar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="border-b bg-gray-50 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {selectedConversation?.other_participant_name 
                  ? selectedConversation.other_participant_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : selectedConversation?.conversation_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-900">
                {selectedConversation?.other_participant_name || selectedConversation?.conversation_name || 'Usuário'}
              </h3>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
          
          {/* Botão Limpar Conversa */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-gray-600 hover:text-red-600 border-gray-300 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Conversa
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleClearConversation}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar todas as mensagens
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleRestoreConversation}
                className="text-green-600 focus:text-green-600"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar todas as mensagens
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="border-t bg-gray-50 p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Respondendo para {replyingTo.sender.full_name}</span>
              <span className="text-sm text-gray-500 truncate max-w-xs">
                {replyingTo.message_text || 'Arquivo'}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Input Area - Estilo WhatsApp */}
      <div className="border-t bg-gray-50 p-4 flex-shrink-0">
        <div className="flex items-end space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] pr-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !replyingTo}
            className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  )
}
