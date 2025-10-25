"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Bell, 
  Eye, 
  UserCheck,
  Workflow,
  PenTool,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth-final"
import { useNotificationCounterNotifierSimple } from "@/hooks/use-notification-counter-simple"
import { getSupabaseSingleton } from "@/lib/supabase-singleton"

const supabase = getSupabaseSingleton()

interface QuickNotification {
  id: string
  title: string
  message: string
  type: 'assignment' | 'completion' | 'error'
  created_at: string
  read: boolean
  process_name?: string
  document_title?: string
  step_name?: string
}

export default function NotificationBellFinal() {
  const auth = useAuth()
  
  // Verificar se o hook retornou dados válidos
  if (!auth) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    )
  }
  
  const { user } = auth
  const { notifyCounterChange } = useNotificationCounterNotifierSimple()
  const [notifications, setNotifications] = useState<QuickNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .contains('recipients', [user.email])
        .neq('status', 'read')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const quickNotifications: QuickNotification[] = (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at,
        read: notification.status === 'read',
        process_name: notification.process_name,
        document_title: notification.document_title,
        step_name: notification.step_name
      }))

      setNotifications(quickNotifications)
      setUnreadCount(quickNotifications.length)

    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAsRead = async (notification: QuickNotification) => {
    if (!user) return

    try {
      console.log('📖 [NotificationBell] Marcando notificação como lida:', notification.id)
      
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notification.id)

      if (error) {
        console.error('❌ [NotificationBell] Erro ao marcar como lida:', error)
        throw error
      }

      console.log('✅ [NotificationBell] Notificação marcada como lida')

      setNotifications(prev => prev.filter(n => n.id !== notification.id))
      setUnreadCount(prev => Math.max(0, prev - 1))

      setTimeout(() => {
        notifyCounterChange()
      }, 500)

    } catch (error: any) {
      console.error('❌ [NotificationBell] Erro ao marcar como lida:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      if (user?.id) {
        fetchNotifications()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [user?.id, fetchNotifications])

  // Listener para atualizações de notificações
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      console.log('🔔 [NotificationBellFinal] Recebido evento de atualização de notificações')
      fetchNotifications()
    }

    window.addEventListener('notifications-updated', handleNotificationsUpdate)

    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate)
    }
  }, [fetchNotifications])

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Workflow className="h-3 w-3" />
      case 'completion':
        return <CheckCircle className="h-3 w-3" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Bell className="h-3 w-3" />
    }
  }

  // Renderizar cor por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return "text-green-600"
      case 'error':
        return "text-red-600"
      case 'warning':
        return "text-yellow-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Notificações</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-500">
                Todas as notificações importantes foram lidas!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.map(notification => (
                <div key={notification.id} className="flex flex-col gap-1 rounded-md border p-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(notification.type)}
                      <div className="text-sm font-medium">{notification.title}</div>
                    </div>
                    <button
                      className="text-xs text-muted-foreground underline"
                      onClick={() => markAsRead(notification)}
                    >
                      Marcar como lida
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {notification.message}
                  </div>
                  {(notification.process_name || notification.document_title) && (
                    <div className="text-[10px] text-muted-foreground">
                      {notification.process_name}
                      {notification.document_title ? ` • ${notification.document_title}` : ''}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setIsOpen(false)
                  // Esta funcionalidade será implementada para navegar para a página de notificações
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}