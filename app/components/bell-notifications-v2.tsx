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
  CheckCircle,
  AlertCircle,
  Workflow
} from "lucide-react"
import { getSupabaseSingleton } from "@/lib/supabase-singleton"

import { useIsolatedAuth } from '@/lib/hooks/use-isolated-auth'

interface Notification {
  id: string
  title: string
  message: string
  type: 'assignment' | 'completion' | 'error'
  created_at: string
  read: boolean
}

export default function BellNotificationsV2() {
  const { user, loading } = useIsolatedAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const supabase = getSupabaseSingleton()

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .contains('recipients', [user.email])
        .neq('status', 'read')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const notifs: Notification[] = (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at,
        read: notification.status === 'read'
      }))

      setNotifications(notifs)
      setUnreadCount(notifs.length)
      
      console.log('🔔 [BellNotifications] Contador atualizado:', {
        total: notifs.length,
        notifications: notifs.map(n => ({ id: n.id, title: n.title, read: n.read }))
      })

    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!loading && user) {
      fetchNotifications()
    }
  }, [user, loading, fetchNotifications])

  // Listener para atualizações de notificações
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      console.log('🔔 [BellNotifications] Recebido evento de atualização de notificações')
      fetchNotifications()
    }

    window.addEventListener('notifications-updated', handleNotificationsUpdate)

    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate)
    }
  }, [fetchNotifications])

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
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

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-500">
                Todas as notificações foram lidas!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.map(notification => (
                <div key={notification.id} className="flex flex-col gap-1 rounded-md border p-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {notification.type === 'assignment' && <Workflow className="h-3 w-3" />}
                      {notification.type === 'completion' && <CheckCircle className="h-3 w-3" />}
                      {notification.type === 'error' && <AlertCircle className="h-3 w-3" />}
                      <div className="text-sm font-medium">{notification.title}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}