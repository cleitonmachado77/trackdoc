"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'

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

    const handleApprovalsUpdate = () => {
      console.log('🔔 [useNotificationCounterSimple] Recebido evento de atualização de aprovações')
      refreshCounter()
    }

    const handleForceRefresh = () => {
      console.log('🔔 [useNotificationCounterSimple] Recebido evento de força atualização')
      refreshCounter()
    }

    window.addEventListener(NOTIFICATION_COUNTER_EVENT as any, handleCounterChange)
    window.addEventListener('approvals-updated', handleApprovalsUpdate)
    window.addEventListener('force-counter-refresh', handleForceRefresh)

    return () => {
      window.removeEventListener(NOTIFICATION_COUNTER_EVENT as any, handleCounterChange)
      window.removeEventListener('approvals-updated', handleApprovalsUpdate)
      window.removeEventListener('force-counter-refresh', handleForceRefresh)
    }
  }, [refreshCounter])

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

  // Configurar realtime subscription para atualização automática de aprovações
  useEffect(() => {
    if (!user?.id) return

    console.log('📡 [useNotificationCounterSimple] Configurando subscription para approval_requests do usuário:', user.id)

    // Importar supabase dinamicamente para evitar problemas de SSR
    import('@/lib/supabase-singleton').then(({ getSupabaseSingleton }) => {
      const supabase = getSupabaseSingleton()
      const channel = supabase
        .channel('approval_counter_realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // Escutar INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'approval_requests',
            filter: `approver_id=eq.${user.id}` // Apenas aprovações para este usuário
          },
          (payload) => {
            console.log('🔄 [useNotificationCounterSimple] Mudança detectada em approval_requests:', payload)
            // Atualizar contador quando houver mudanças
            refreshCounter()
          }
        )
        .subscribe((status) => {
          console.log('📡 [useNotificationCounterSimple] Status da conexão:', status)
        })

      // Cleanup será feito no return do useEffect
      return () => {
        console.log('🔌 [useNotificationCounterSimple] Desconectando subscription')
        supabase.removeChannel(channel)
      }
    })
  }, [user?.id, refreshCounter])

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
