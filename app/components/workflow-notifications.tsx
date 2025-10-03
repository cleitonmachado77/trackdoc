"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useWorkflowNotifications, WorkflowNotification } from "@/hooks/use-workflow-notifications"
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface WorkflowNotificationsProps {
  className?: string
}

export default function WorkflowNotifications({ className = "" }: WorkflowNotificationsProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<WorkflowNotification | null>(null)
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useWorkflowNotifications()

  // Obter ícone do tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'reminder':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  // Obter cor do badge do tipo
  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800'
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800'
      case 'completion':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Obter label do tipo
  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'Atribuição'
      case 'reminder':
        return 'Lembrete'
      case 'completion':
        return 'Conclusão'
      case 'error':
        return 'Erro'
      default:
        return 'Notificação'
    }
  }

  // Marcar notificação como lida
  const handleMarkAsRead = async (notification: WorkflowNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    setSelectedNotification(notification)
  }

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  if (loading) {
    return (
      <div className={className}>
        <Button variant="outline" size="sm" disabled>
          <Bell className="h-4 w-4 mr-2" />
          Carregando...
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(true)}
        className="relative"
      >
        <Bell className="h-4 w-4 mr-2" />
        Notificações
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Modal de Notificações */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações de Tramitação
              </span>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Marcar todas como lidas
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Acompanhe as notificações dos seus processos de tramitação
            </DialogDescription>
          </DialogHeader>

          <div className="h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
                <p className="text-gray-600">Você não possui notificações no momento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">
                              {notification.title}
                            </h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                            >
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                            {notification.process_name && (
                              <span>Processo: {notification.process_name}</span>
                            )}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Notificação */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              Detalhes da notificação
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Mensagem:</h4>
                <p className="text-sm text-gray-600">
                  {selectedNotification.message}
                </p>
              </div>
              
              {(selectedNotification.process_name || selectedNotification.document_title) && (
                <div>
                  <h4 className="font-semibold mb-2">Processo:</h4>
                  {selectedNotification.process_name && (
                    <p className="text-sm text-gray-600">
                      {selectedNotification.process_name}
                    </p>
                  )}
                  {selectedNotification.document_title && (
                    <p className="text-sm text-gray-500">
                      Documento: {selectedNotification.document_title}
                    </p>
                  )}
                </div>
              )}

              {selectedNotification.step_name && (
                <div>
                  <h4 className="font-semibold mb-2">Etapa:</h4>
                  <p className="text-sm text-gray-600">
                    {selectedNotification.step_name}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Data:</h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedNotification.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
