"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// Evento personalizado para notificar mudanças no contador de notificações
const NOTIFICATIONS_COUNTER_EVENT = 'notificationsCounterChanged'

export function useNotificationsCounter() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Função para buscar o contador de notificações não lidas
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.email) return 0

    try {
      setLoading(true)
      const supabase = getSupabaseSingleton()

      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .contains('recipients', [user.email])
        .neq('status', 'read')

      if (error) {
        console.error('Erro ao buscar notificações não lidas:', error)
        return 0
      }

      const count = data?.length || 0
      
      console.log('📊 [useNotificationsCounter] Contador atualizado:', {
        unreadNotifications: count,
        timestamp: new Date().toISOString()
      })

      return count

    } catch (error) {
      console.error('Erro ao buscar contador de notificações:', error)
      return 0
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  // Função para forçar atualização do contador
  const refreshCounter = useCallback(async () => {
    const newCount = await fetchUnreadCount()
    setUnreadCount(newCount)

    // Notificar mudança
    const event = new CustomEvent(NOTIFICATIONS_COUNTER_EVENT, {
      detail: { count: newCount }
    })
    window.dispatchEvent(event)
  }, [fetchUnreadCount])

  // Listener para eventos de mudança no contador
  useEffect(() => {
    const handleCounterChange = (event: CustomEvent) => {
      console.log('🔔 [useNotificationsCounter] Evento recebido:', event.detail.count)
      setUnreadCount(event.detail.count)
    }

    window.addEventListener(NOTIFICATIONS_COUNTER_EVENT as any, handleCounterChange)

    return () => {
      window.removeEventListener(NOTIFICATIONS_COUNTER_EVENT as any, handleCounterChange)
    }
  }, [])

  // Listener para o evento genérico de atualização de notificações
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      console.log('🔔 [useNotificationsCounter] Recebido evento de atualização de notificações')
      refreshCounter()
    }

    const handleForceRefresh = () => {
      console.log('🔔 [useNotificationsCounter] Recebido evento de força atualização')
      refreshCounter()
    }

    window.addEventListener('notifications-updated', handleNotificationsUpdate)
    window.addEventListener('force-counter-refresh', handleForceRefresh)

    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate)
      window.removeEventListener('force-counter-refresh', handleForceRefresh)
    }
  }, [refreshCounter])

  // Carregar contador inicial
  useEffect(() => {
    if (user?.email) {
      fetchUnreadCount().then(setUnreadCount)
    }
  }, [user?.email, fetchUnreadCount])

  // Atualizar contador periodicamente
  useEffect(() => {
    if (!user?.email) return

    const interval = setInterval(() => {
      fetchUnreadCount().then(setUnreadCount)
    }, 60000) // 1 minuto

    return () => clearInterval(interval)
  }, [user?.email, fetchUnreadCount])

  // Configurar realtime subscription para atualização automática
  useEffect(() => {
    if (!user?.email) return

    console.log('📡 [useNotificationsCounter] Configurando subscription para notificações do usuário:', user.email)

    const supabase = getSupabaseSingleton()
    const channel = supabase
      .channel('notifications_counter_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('🔄 [useNotificationsCounter] Mudança detectada em notifications:', payload)
          
          // Verificar se a notificação é para este usuário
          const notification = payload.new as any
          if (notification && notification.recipients && notification.recipients.includes(user.email)) {
            console.log('✅ [useNotificationsCounter] Notificação é para este usuário, atualizando contador...')
            // Atualizar contador quando houver mudanças
            refreshCounter()
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [useNotificationsCounter] Status da conexão:', status)
      })

    // Cleanup: remover subscription quando componente desmontar
    return () => {
      console.log('🔌 [useNotificationsCounter] Desconectando subscription')
      supabase.removeChannel(channel)
    }
  }, [user?.email, refreshCounter])

  return {
    unreadCount,
    loading,
    refreshCounter
  }
}

// Hook para componentes que precisam notificar mudanças no contador de notificações
export function useNotificationsCounterNotifier() {
  const { user } = useAuth()

  const notifyCounterChange = useCallback(async () => {
    if (!user?.email) return

    try {
      const supabase = getSupabaseSingleton()

      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .contains('recipients', [user.email])
        .neq('status', 'read')

      if (error) {
        console.error('Erro ao buscar notificações não lidas:', error)
        return
      }

      const count = data?.length || 0

      const event = new CustomEvent(NOTIFICATIONS_COUNTER_EVENT, {
        detail: { count }
      })
      window.dispatchEvent(event)

    } catch (error) {
      console.error('Erro ao notificar mudança no contador de notificações:', error)
    }
  }, [user?.email])

  return { notifyCounterChange }
}