import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface WorkflowNotification {
  id: string
  process_id: string
  execution_id?: string
  type: 'assignment' | 'reminder' | 'completion' | 'error'
  title: string
  message: string
  is_read: boolean
  created_at: string
  process_name?: string
  document_title?: string
  step_name?: string
}

export function useWorkflowNotifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error, count } = await supabase
        .from('workflow_notification_feed')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications((data || []).map(notification => ({
        id: notification.id,
        process_id: notification.process_id,
        execution_id: notification.execution_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        is_read: notification.is_read,
        created_at: notification.created_at,
        process_name: notification.process_name,
        document_title: notification.document_title,
        step_name: notification.step_name
      })))
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('workflow_notification_feed')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.warn('Erro ao atualizar no banco, atualizando apenas no frontend:', error)
        // Se houver erro no banco, atualizar apenas no frontend
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        return
      }

      // Atualizar no frontend
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      // Em caso de erro, atualizar apenas no frontend
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('workflow_notification_feed')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.warn('Erro ao atualizar no banco, atualizando apenas no frontend:', error)
        // Se houver erro no banco, atualizar apenas no frontend
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        return
      }

      // Atualizar no frontend
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      // Em caso de erro, atualizar apenas no frontend
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('workflow_notification_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_notification_feed',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as any
          
          // Filtrar notificações de departamento
          if (newNotification.title === 'Nova Tarefa para Departamento') {
            console.log('🚫 [Real-time] Notificação de departamento filtrada:', newNotification.title)
            return
          }
          
          console.log('🔔 [Real-time] Nova notificação recebida:', {
            id: newNotification.id,
            type: newNotification.type,
            title: newNotification.title,
            process_id: newNotification.process_id
          })
          
          // Verificar se a notificação já existe para evitar duplicatas
          setNotifications(prev => {
            const exists = prev.some(n => n.id === newNotification.id)
            if (exists) {
              return prev
            }
            
            setUnreadCount(prev => prev + 1)
            
            return [{
              id: newNotification.id,
              process_id: newNotification.process_id,
              execution_id: newNotification.execution_id,
              type: newNotification.type,
              title: newNotification.title,
              message: newNotification.message,
              is_read: newNotification.is_read,
              created_at: newNotification.created_at,
              process_name: newNotification.process_name,
              document_title: newNotification.document_title,
              step_name: newNotification.step_name
            }, ...prev]
          })

          if (newNotification.type === 'assignment') {
            toast({
              title: "Nova Tarefa",
              description: newNotification.message,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, toast])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
}
