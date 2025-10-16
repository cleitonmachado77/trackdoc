"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  AlertCircle, 
  Clock,
  RefreshCw,
  FileText,
  UserCheck,
  Workflow,
  PenTool,
  X,
  Settings,
  Shield,
  Info
} from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useNotificationCounterNotifierSimple } from "@/hooks/use-notification-counter-simple"
import { useToast } from "@/hooks/use-toast"

// Usar o mesmo client do contexto de autenticação
import { getSupabaseSingleton } from "@/lib/supabase-singleton"

interface UnifiedNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'approval' | 'workflow' | 'signature' | 'system'
  created_at: string
  read: boolean
  metadata?: {
    process_name?: string
    document_title?: string
    step_name?: string
  } | null
  source?: string
}

export default function UnifiedNotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { notifyCounterChange } = useNotificationCounterNotifierSimple()
  const supabase = getSupabaseSingleton()
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<UnifiedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterRead, setFilterRead] = useState("all")
  const [showSettings, setShowSettings] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Buscar todas as notificações do usuário
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Teste: verificar se conseguimos acessar a tabela notifications diretamente
      console.log('🔍 Testando acesso à tabela notifications...')
      const { data: testData, error: testError } = await supabase
        .from('notifications')
        .select('id, title, status')
        .limit(5)
      
      if (testError) {
        console.error('❌ Erro ao acessar tabela notifications:', testError)
      } else {
        console.log('✅ Acesso à tabela notifications OK:', testData?.length || 0, 'registros')
      }
      
      const { data, error } = await supabase
        .from('notification_feed')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const unifiedNotifications: UnifiedNotification[] = (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority || 'medium',
        category: notification.category || 'system',
        created_at: notification.created_at,
        read: notification.is_read,
        metadata: notification.metadata || null,
        source: notification.source || 'notifications'
      }))

      setNotifications(unifiedNotifications)
      setFilteredNotifications(unifiedNotifications)
      
      console.log('📧 Notificações carregadas:', {
        total: unifiedNotifications.length,
        naoLidas: unifiedNotifications.filter(n => !n.read).length
      })
      
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  // Marcar notificação como lida
  const markAsRead = async (notification: UnifiedNotification) => {
    if (!user) return

    try {
      console.log('📖 Marcando notificação como lida via API:', notification.id)
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notification.id,
          action: 'mark_read',
          user_email: user.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao marcar como lida')
      }

      const result = await response.json()
      console.log('✅ Notificação marcada como lida via API:', result)

      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ))
      setFilteredNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ))

      setTimeout(() => {
        notifyCounterChange()
      }, 500)

    } catch (error: any) {
      console.error('❌ Erro ao marcar como lida:', error)
      toast({
        title: "Erro",
        description: `Não foi possível marcar como lida: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      })
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user) return

    try {
      console.log('📖 Marcando todas as notificações como lidas')
      
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .in('recipients', [user.email])
        .neq('status', 'read')

      if (error) {
        console.error('❌ Erro ao marcar todas como lidas:', error)
        throw error
      }

      console.log('✅ Todas as notificações marcadas como lidas')

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setFilteredNotifications(prev => prev.map(n => ({ ...n, read: true })))

      setTimeout(() => {
        notifyCounterChange()
      }, 500)

      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas.",
      })

    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas como lidas.",
        variant: "destructive",
      })
    }
  }

  // Remover notificação individual
  const removeNotification = async (notificationId: string) => {
    if (!user) return

    try {
      console.log('🗑️ Removendo notificação via API:', notificationId)

      const response = await fetch(`/api/notifications?id=${notificationId}&user_email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao remover notificação')
      }

      const result = await response.json()
      console.log('✅ Notificação removida com sucesso via API:', result)

      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setFilteredNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Notificar mudança no contador
      setTimeout(() => {
        notifyCounterChange()
      }, 500)

      toast({
        title: "Sucesso",
        description: "Notificação removida com sucesso.",
      })

    } catch (error: any) {
      console.error('❌ Erro ao remover notificação:', error)
      toast({
        title: "Erro",
        description: `Não foi possível remover a notificação: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      })
    }
  }

  // Remover notificações selecionadas
  const removeSelectedNotifications = async () => {
    if (!user || selectedNotifications.length === 0) return

    try {
      console.log('🗑️ Removendo notificações selecionadas via API:', selectedNotifications.length)
      
      const response = await fetch(`/api/notifications?ids=${selectedNotifications.join(',')}&user_email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao remover notificações')
      }

      const result = await response.json()
      console.log('✅ Notificações removidas com sucesso via API:', result)

      // Atualizar estado local
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)))
      setFilteredNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)))
      setSelectedNotifications([])
      setShowDeleteConfirm(false)

      // Notificar mudança no contador
      setTimeout(() => {
        notifyCounterChange()
      }, 500)

      toast({
        title: "Sucesso",
        description: `${selectedNotifications.length} notificação(ões) removida(s) com sucesso.`,
      })

    } catch (error: any) {
      console.error('❌ Erro ao remover notificações:', error)
      toast({
        title: "Erro",
        description: `Não foi possível remover as notificações selecionadas: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      })
    }
  }

  // Limpar todas as notificações lidas
  const clearReadNotifications = async () => {
    if (!user) return

    try {
      const readIds = notifications.filter(n => n.read).map(n => n.id)
      
      if (readIds.length === 0) {
        toast({
          title: "Info",
          description: "Não há notificações lidas para remover.",
        })
        return
      }

      console.log('🗑️ Limpando notificações lidas:', readIds.length)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', readIds)

      if (error) {
        console.error('❌ Erro ao limpar notificações lidas:', error)
        throw error
      }

      console.log('✅ Notificações lidas removidas')

      // Atualizar estado local
      setNotifications(prev => prev.filter(n => !n.read))
      setFilteredNotifications(prev => prev.filter(n => !n.read))

      // Notificar mudança no contador
      setTimeout(() => {
        notifyCounterChange()
      }, 500)

      toast({
        title: "Sucesso",
        description: `${readIds.length} notificação(ões) lida(s) removida(s) com sucesso.`,
      })

    } catch (error: any) {
      console.error('❌ Erro ao limpar notificações lidas:', error)
      toast({
        title: "Erro",
        description: `Não foi possível limpar as notificações lidas: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      })
    }
  }

  // Limpar todas as notificações
  const clearAllNotifications = async () => {
    if (!user) return

    try {
      console.log('🧹 Limpando todas as notificações do usuário')
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('recipients', [user.email])

      if (error) {
        console.error('❌ Erro ao limpar notificações:', error)
        throw error
      }

      console.log('✅ Todas as notificações foram removidas')

      // Atualizar estado local
      setNotifications([])
      setFilteredNotifications([])
      setSelectedNotifications([])

      // Notificar mudança no contador
      setTimeout(() => {
        notifyCounterChange()
      }, 500)

      toast({
        title: "Sucesso",
        description: "Todas as notificações foram removidas.",
      })

    } catch (error: any) {
      console.error('❌ Erro ao limpar notificações:', error)
      toast({
        title: "Erro",
        description: `Não foi possível limpar as notificações: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      })
    }
  }

  // Selecionar/deselecionar notificação
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  // Selecionar todas as notificações visíveis
  const selectAllVisible = () => {
    const visibleIds = filteredNotifications.map(n => n.id)
    setSelectedNotifications(visibleIds)
  }

  // Deselecionar todas
  const deselectAll = () => {
    setSelectedNotifications([])
  }

  // Aplicar filtros
  useEffect(() => {
    let filtered = notifications

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por categoria
    if (filterCategory !== "all") {
      filtered = filtered.filter(n => n.category === filterCategory)
    }

    // Filtro por status de leitura
    if (filterRead !== "all") {
      filtered = filtered.filter(n => 
        filterRead === "unread" ? !n.read : n.read
      )
    }

    setFilteredNotifications(filtered)
    
    // Limpar seleção quando filtros mudam
    setSelectedNotifications([])
  }, [notifications, searchTerm, filterCategory, filterRead])

  // Carregar notificações ao montar componente
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Contar notificações por tipo
  const unreadCount = notifications.filter(n => !n.read).length
  const importantCount = notifications.filter(n => 
    n.priority === 'high' || n.priority === 'urgent'
  ).length

  // Renderizar ícone por categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'approval':
        return <UserCheck className="h-4 w-4" />
      case 'workflow':
        return <Workflow className="h-4 w-4" />
      case 'signature':
        return <PenTool className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Renderizar cor por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return "bg-green-100 text-green-800"
      case 'error':
        return "bg-red-100 text-red-800"
      case 'warning':
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  // Renderizar cor por prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return "bg-red-100 text-red-800"
      case 'high':
        return "bg-orange-100 text-orange-800"
      case 'medium':
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Renderizar lista de notificações
  const renderNotifications = (notificationsToRender: UnifiedNotification[]) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (notificationsToRender.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma notificação encontrada</p>
            <p className="text-sm text-gray-400">
              Todas as notificações estão em dia!
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {notificationsToRender.map((notification) => (
          <Card 
            key={notification.id} 
            className={`transition-all hover:shadow-md ${
              !notification.read ? 'border-primary/50 bg-accent/50' : ''
            } ${selectedNotifications.includes(notification.id) ? 'border-primary bg-accent' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox para seleção */}
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryIcon(notification.category)}
                    <h4 className={`font-medium ${!notification.read ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                      {notification.title}
                    </h4>
                    <Badge variant="outline" className={getTypeColor(notification.type)}>
                      {notification.type === 'success' ? 'Sucesso' : 
                       notification.type === 'error' ? 'Erro' :
                       notification.type === 'warning' ? 'Aviso' : 'Info'}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                      {notification.priority === 'urgent' ? 'Urgente' :
                       notification.priority === 'high' ? 'Alta' :
                       notification.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  {notification.metadata?.document_title && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {notification.metadata.document_title}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.created_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeNotification(notification.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Notificações</h1>
          <p className="text-muted-foreground">
            Todas as suas notificações importantes em um só lugar
            {selectedNotifications.length > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({selectedNotifications.length} selecionada{selectedNotifications.length > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Configurações */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Ações em Lote</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllVisible}
                    disabled={filteredNotifications.length === 0}
                  >
                    Selecionar todas visíveis
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={deselectAll}
                    disabled={selectedNotifications.length === 0}
                  >
                    Deselecionar todas
                  </Button>
                </div>
                {selectedNotifications.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover selecionadas ({selectedNotifications.length})
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Limpeza Automática</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearReadNotifications}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar lidas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={markAllAsRead}
                    disabled={notifications.filter(n => !n.read).length === 0}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Marcar todas como lidas
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={clearAllNotifications}
                    disabled={notifications.length === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar todas
                  </Button>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Notificações de departamento são automaticamente filtradas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>As notificações são organizadas por prioridade e categoria</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Bell className="h-4 w-4" />
                <span>Você recebe apenas notificações importantes (alta/urgente prioridade)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="h-4 w-4" />
                <span>As notificações são atualizadas automaticamente após exclusão</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    Confirmar exclusão de {selectedNotifications.length} notificação(ões)?
                  </p>
                  <p className="text-sm text-red-700">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={removeSelectedNotifications}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não lidas</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Importantes</p>
                <p className="text-2xl font-bold text-orange-600">{importantCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprovações</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.category === 'approval').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="approval">Aprovações</SelectItem>

                <SelectItem value="signature">Assinatura</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      {renderNotifications(filteredNotifications)}
    </div>
  )
}
