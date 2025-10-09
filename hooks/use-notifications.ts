import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/contexts/hybrid-auth-context'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  recipients: string[]
  channels: ('email' | 'push' | 'sms')[]
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  created_at: string
  scheduled_for?: string
  sent_at?: string
  read_count: number
  total_recipients: number
  created_by: string
  updated_at: string
}

export interface NotificationTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'approval' | 'deadline' | 'system' | 'custom'
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  sms_enabled: boolean
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  auto_approval_reminders: boolean
  deadline_alerts: boolean
  system_maintenance: boolean
  created_at: string
  updated_at: string
}

export interface NotificationStats {
  total_sent: number
  open_rate: number
  scheduled: number
  failed: number
  total_recipients: number
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar notificações
  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotifications(data || [])
    } catch (err) {
      console.error('Erro ao buscar notificações:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  // Buscar templates
  const fetchTemplates = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (err) {
      console.error('Erro ao buscar templates:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates')
    }
  }

  // Buscar configurações
  const fetchSettings = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings(data)
      } else {
        // Criar configurações padrão se não existirem
        const defaultSettings = {
          user_id: user.id,
          email_enabled: true,
          push_enabled: true,
          sms_enabled: false,
          digest_frequency: 'daily' as const,
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          auto_approval_reminders: true,
          deadline_alerts: true,
          system_maintenance: true,
        }

        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) throw createError
        setSettings(newSettings)
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
    }
  }

  // Buscar estatísticas
  const fetchStats = async () => {
    if (!user) return

    try {
      // Buscar estatísticas básicas
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('status, total_recipients, read_count')

      if (notificationsError) throw notificationsError

      const totalSent = notificationsData?.filter(n => n.status === 'sent').length || 0
      const totalRecipients = notificationsData?.reduce((sum, n) => sum + (n.total_recipients || 0), 0) || 0
      const totalRead = notificationsData?.reduce((sum, n) => sum + (n.read_count || 0), 0) || 0
      const scheduled = notificationsData?.filter(n => n.status === 'scheduled').length || 0
      const failed = notificationsData?.filter(n => n.status === 'failed').length || 0

      const stats: NotificationStats = {
        total_sent: totalSent,
        open_rate: totalRecipients > 0 ? (totalRead / totalRecipients) * 100 : 0,
        scheduled,
        failed,
        total_recipients: totalRecipients,
      }

      setStats(stats)
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchTemplates()
      fetchSettings()
      fetchStats()
    }
  }, [user?.id])

  // Criar notificação
  const createNotification = async (notificationData: Partial<Notification>) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          created_by: user.id,
          status: notificationData.scheduled_for ? 'scheduled' : 'draft',
        })
        .select()
        .single()

      if (error) throw error

      setNotifications(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Erro ao criar notificação:', err)
      throw err
    }
  }

  // Atualizar notificação
  const updateNotification = async (id: string, updates: Partial<Notification>) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setNotifications(prev => prev.map(n => n.id === id ? data : n))
      return data
    } catch (err) {
      console.error('Erro ao atualizar notificação:', err)
      throw err
    }
  }

  // Deletar notificação
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Erro ao deletar notificação:', err)
      throw err
    }
  }

  // Enviar notificação
  const sendNotification = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setNotifications(prev => prev.map(n => n.id === id ? data : n))
      return data
    } catch (err) {
      console.error('Erro ao enviar notificação:', err)
      throw err
    }
  }

  // Criar template
  const createTemplate = async (templateData: Partial<NotificationTemplate>) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          ...templateData,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Erro ao criar template:', err)
      throw err
    }
  }

  // Atualizar template
  const updateTemplate = async (id: string, updates: Partial<NotificationTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      console.error('Erro ao atualizar template:', err)
      throw err
    }
  }

  // Deletar template
  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Erro ao deletar template:', err)
      throw err
    }
  }

  // Atualizar configurações
  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!user || !settings) throw new Error('Usuário não autenticado ou configurações não encontradas')

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      return data
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err)
      throw err
    }
  }

  // Filtrar notificações
  const filterNotifications = (filters: {
    search?: string
    status?: string
    type?: string
    priority?: string
  }) => {
    return notifications.filter(notification => {
      const matchesSearch = !filters.search || 
        notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        notification.message.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || filters.status === 'all' || notification.status === filters.status
      const matchesType = !filters.type || filters.type === 'all' || notification.type === filters.type
      const matchesPriority = !filters.priority || filters.priority === 'all' || notification.priority === filters.priority

      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })
  }

  return {
    notifications,
    templates,
    settings,
    stats,
    loading,
    error,
    createNotification,
    updateNotification,
    deleteNotification,
    sendNotification,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateSettings,
    filterNotifications,
    refetch: () => {
      fetchNotifications()
      fetchTemplates()
      fetchSettings()
      fetchStats()
    }
  }
}
