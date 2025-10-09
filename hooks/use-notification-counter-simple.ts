"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/use-unified-auth'

// Evento personalizado para notificar mudanças no contador
const NOTIFICATION_COUNTER_EVENT = 'notificationCounterChanged'

export function useNotificationCounterSimple() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Função para buscar o contador atualizado
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.email || !user?.id) return 0

    try {
      setLoading(true)

      const response = await fetch(`/api/approvals?scope=assigned`)
      if (!response.ok) {
        console.error('Erro ao buscar processos pendentes:', await response.text())
        return 0
      }

      const data = await response.json()

      const totalCount =
        data?.processes?.reduce((acc: number, process: any) => {
          const pendingCount = (process?.pendingExecutions || []).filter(
            (execution: any) => execution.status === 'pending' && execution.assigned_to === user.id,
          ).length
          return acc + pendingCount
        }, 0) ?? 0


      console.log('📊 [useNotificationCounterSimple] Contador atualizado:', {
        pendentes: totalCount,
        timestamp: new Date().toISOString()
      })

      return totalCount

    } catch (error) {
      console.error('Erro ao buscar contador de notificações:', error)
      return 0
    } finally {
      setLoading(false)
    }
  }, [user?.email, user?.id])

  // Função para forçar atualização do contador
  const refreshCounter = useCallback(async () => {
    const newCount = await fetchUnreadCount()
    setUnreadCount(newCount)

    // Notificar mudança
    const event = new CustomEvent(NOTIFICATION_COUNTER_EVENT, {
      detail: { count: newCount }
    })
    window.dispatchEvent(event)
  }, [fetchUnreadCount])

  // Listener para eventos de mudança no contador
  useEffect(() => {
    const handleCounterChange = (event: CustomEvent) => {
      console.log('🔔 [useNotificationCounterSimple] Evento recebido:', event.detail.count)
      setUnreadCount(event.detail.count)
    }

    window.addEventListener(NOTIFICATION_COUNTER_EVENT as any, handleCounterChange)

    return () => {
      window.removeEventListener(NOTIFICATION_COUNTER_EVENT as any, handleCounterChange)
    }
  }, [])

  // Carregar contador inicial
  useEffect(() => {
    if (user?.email && user?.id) {
      fetchUnreadCount().then(setUnreadCount)
    }
  }, [user?.email, user?.id]) // Removido fetchUnreadCount das dependências

  // Atualizar contador periodicamente
  useEffect(() => {
    if (!user?.email || !user?.id) return

    const interval = setInterval(() => {
      fetchUnreadCount().then(setUnreadCount)
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [user?.email, user?.id]) // Removido fetchUnreadCount das dependências

  return {
    unreadCount,
    loading,
    refreshCounter
  }
}

// Hook para componentes que precisam notificar mudanças no contador
export function useNotificationCounterNotifierSimple() {
  const { user } = useAuth()

  const notifyCounterChange = useCallback(async () => {
    if (!user?.email || !user?.id) return

    try {
      const response = await fetch(`/api/approvals?scope=assigned`)
      if (!response.ok) {
        console.error('Erro ao buscar processos pendentes:', await response.text())
        return
      }

      const data = await response.json()

      const totalCount =
        data?.processes?.reduce((acc: number, process: any) => {
          const pendingCount = (process?.pendingExecutions || []).filter(
            (execution: any) => execution.status === 'pending' && execution.assigned_to === user.id,
          ).length
          return acc + pendingCount
        }, 0) ?? 0

      const event = new CustomEvent(NOTIFICATION_COUNTER_EVENT, {
        detail: { count: totalCount }
      })
      window.dispatchEvent(event)

    } catch (error) {
      console.error('Erro ao notificar mudança no contador:', error)
    }
  }, [user?.email, user?.id])

  return { notifyCounterChange }
}
