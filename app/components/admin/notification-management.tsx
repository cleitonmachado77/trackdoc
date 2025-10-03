"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"
import {
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Download,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function NotificationManagement() {
  const { toast } = useToast()
  const {
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
    refetch
  } = useNotifications()

  // Estados locais
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  // Estados para formulários
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as const,
    priority: "medium" as const,
    recipients: "",
    channels: ["email"] as ("email" | "push" | "sms")[],
    scheduledFor: "",
  })

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    content: "",
    type: "custom" as const,
    variables: "",
  })

  // Função para alternar status do template
  const handleTemplateToggle = async (templateId: string, newActiveState: boolean) => {
    try {
      await updateTemplate(templateId, { is_active: newActiveState })
      toast({
        title: newActiveState ? "Template ativado" : "Template desativado",
        description: `O template foi ${newActiveState ? "ativado" : "desativado"} com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar template.",
        variant: "destructive",
      })
    }
  }

  // Funções para cores dos badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "info":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Função para criar notificação
  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Erro",
        description: "Título e mensagem são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      const recipients = newNotification.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      await createNotification({
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        priority: newNotification.priority,
        recipients,
        channels: newNotification.channels,
        scheduled_for: newNotification.scheduledFor ? new Date(newNotification.scheduledFor).toISOString() : undefined,
      })

      toast({
        title: "Notificação criada",
        description: "A notificação foi criada com sucesso.",
      })

      setIsCreateModalOpen(false)
      setNewNotification({
        title: "",
        message: "",
        type: "info",
        priority: "medium",
        recipients: "",
        channels: ["email"],
        scheduledFor: "",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar notificação.",
        variant: "destructive",
      })
    }
  }

  // Função para criar template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast({
        title: "Erro",
        description: "Nome, assunto e conteúdo são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      const variables = newTemplate.variables
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)

      await createTemplate({
        name: newTemplate.name,
        subject: newTemplate.subject,
        content: newTemplate.content,
        type: newTemplate.type,
        variables,
      })

      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso.",
      })

      setIsTemplateModalOpen(false)
      setNewTemplate({
        name: "",
        subject: "",
        content: "",
        type: "custom",
        variables: "",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar template.",
        variant: "destructive",
      })
    }
  }

  // Função para atualizar configurações
  const handleUpdateSettings = async () => {
    if (!settings) return

    try {
      await updateSettings({
        email_enabled: settings.email_enabled,
        push_enabled: settings.push_enabled,
        sms_enabled: settings.sms_enabled,
        digest_frequency: settings.digest_frequency,
        quiet_hours_enabled: settings.quiet_hours_enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
        auto_approval_reminders: settings.auto_approval_reminders,
        deadline_alerts: settings.deadline_alerts,
        system_maintenance: settings.system_maintenance,
      })

      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram atualizadas.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      })
    }
  }

  // Função para deletar notificação
  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id)
      toast({
        title: "Notificação excluída",
        description: "A notificação foi excluída com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir notificação.",
        variant: "destructive",
      })
    }
  }

  // Função para deletar template
  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id)
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir template.",
        variant: "destructive",
      })
    }
  }

  // Função para enviar notificação
  const handleSendNotification = async (id: string) => {
    try {
      await sendNotification(id)
      toast({
        title: "Notificação enviada",
        description: "A notificação foi enviada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação.",
        variant: "destructive",
      })
    }
  }

  // Filtrar notificações
  const filteredNotifications = filterNotifications({
    search: searchTerm,
    status: filterStatus,
    type: filterType,
  })

  // Renderizar visão geral
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Enviadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_sent || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Notificações enviadas com sucesso</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Abertura</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.open_rate ? `${stats.open_rate.toFixed(1)}%` : '0%'}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Percentual de notificações lidas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agendadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.scheduled || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Para os próximos 7 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Falhas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.failed || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Notificações com erro</p>
        </CardContent>
      </Card>
    </div>
  )

  // Renderizar lista de notificações
  const renderNotifications = () => (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="scheduled">Agendadas</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="failed">Falhas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="info">Informação</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <Download className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Notificação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Notificação</DialogTitle>
                <DialogDescription>Crie uma nova notificação para enviar aos usuários.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      placeholder="Título da notificação"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Informação</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Conteúdo da notificação"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={newNotification.priority}
                      onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Destinatários</Label>
                    <Input
                      id="recipients"
                      value={newNotification.recipients}
                      onChange={(e) => setNewNotification({ ...newNotification, recipients: e.target.value })}
                      placeholder="emails separados por vírgula"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Canais de Envio</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email"
                        checked={newNotification.channels.includes("email")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification({ ...newNotification, channels: [...newNotification.channels, "email"] })
                          } else {
                            setNewNotification({
                              ...newNotification,
                              channels: newNotification.channels.filter((c) => c !== "email"),
                            })
                          }
                        }}
                      />
                      <Label htmlFor="email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="push"
                        checked={newNotification.channels.includes("push")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification({ ...newNotification, channels: [...newNotification.channels, "push"] })
                          } else {
                            setNewNotification({
                              ...newNotification,
                              channels: newNotification.channels.filter((c) => c !== "push"),
                            })
                          }
                        }}
                      />
                      <Label htmlFor="push">Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sms"
                        checked={newNotification.channels.includes("sms")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification({ ...newNotification, channels: [...newNotification.channels, "sms"] })
                          } else {
                            setNewNotification({
                              ...newNotification,
                              channels: newNotification.channels.filter((c) => c !== "sms"),
                            })
                          }
                        }}
                      />
                      <Label htmlFor="sms">SMS</Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledFor">Agendar Para (opcional)</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={newNotification.scheduledFor}
                    onChange={(e) => setNewNotification({ ...newNotification, scheduledFor: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateNotification}>Criar Notificação</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Notificações */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando notificações...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Erro ao carregar notificações: {error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma notificação encontrada.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status === "sent" && "Enviada"}
                          {notification.status === "scheduled" && "Agendada"}
                          {notification.status === "draft" && "Rascunho"}
                          {notification.status === "failed" && "Falha"}
                        </Badge>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type === "info" && "Info"}
                          {notification.type === "warning" && "Aviso"}
                          {notification.type === "error" && "Erro"}
                          {notification.type === "success" && "Sucesso"}
                        </Badge>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority === "low" && "Baixa"}
                          {notification.priority === "medium" && "Média"}
                          {notification.priority === "high" && "Alta"}
                          {notification.priority === "urgent" && "Urgente"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Criada: {new Date(notification.created_at).toLocaleDateString()}</span>
                        {notification.sent_at && <span>Enviada: {new Date(notification.sent_at).toLocaleDateString()}</span>}
                        {notification.scheduled_for && (
                          <span>Agendada: {new Date(notification.scheduled_for).toLocaleDateString()}</span>
                        )}
                        <span>Destinatários: {notification.total_recipients}</span>
                        {notification.status === "sent" && (
                          <span>
                            Lidas: {notification.read_count}/{notification.total_recipients}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {notification.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel === "email" && <Mail className="h-3 w-3 mr-1" />}
                            {channel === "push" && <Bell className="h-3 w-3 mr-1" />}
                            {channel === "sms" && <MessageSquare className="h-3 w-3 mr-1" />}
                            {channel.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {notification.status === "draft" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSendNotification(notification.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Notificação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )

  // Renderizar templates
  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Templates de Notificação</h3>
          <p className="text-gray-600">Gerencie templates reutilizáveis para notificações</p>
        </div>
        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>Crie um template reutilizável para notificações.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Nome do Template</Label>
                  <Input
                    id="templateName"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Nome do template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateType">Tipo</Label>
                  <Select
                    value={newTemplate.type}
                    onValueChange={(value: any) => setNewTemplate({ ...newTemplate, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approval">Aprovação</SelectItem>
                      <SelectItem value="deadline">Prazo</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateSubject">Assunto</Label>
                <Input
                  id="templateSubject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="Assunto do template (use {{variavel}} para variáveis)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateContent">Conteúdo</Label>
                <Textarea
                  id="templateContent"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Conteúdo do template (use {{variavel}} para variáveis)"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateVariables">Variáveis Disponíveis</Label>
                <Input
                  id="templateVariables"
                  value={newTemplate.variables}
                  onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                  placeholder="Variáveis separadas por vírgula (ex: userName, count, date)"
                />
                <p className="text-xs text-gray-500">Use {'{{}}'} no assunto e conteúdo para inserir variáveis dinâmicas</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate}>Criar Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">
                      {template.type === "approval" && "Aprovação"}
                      {template.type === "deadline" && "Prazo"}
                      {template.type === "system" && "Sistema"}
                      {template.type === "custom" && "Personalizado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Assunto:</strong> {template.subject}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">{template.content}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Variáveis:</span>
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) => handleTemplateToggle(template.id, checked)}
                  />
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Renderizar configurações
  const renderSettings = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Configurações de Notificação</h3>
          <p className="text-gray-600">Configure como e quando as notificações são enviadas</p>
        </div>

        <div className="grid gap-6">
          {/* Canais de Notificação */}
          <Card>
            <CardHeader>
              <CardTitle>Canais de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-enabled">Notificações por Email</Label>
                  <p className="text-sm text-gray-500">Enviar notificações via email</p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={settings.email_enabled}
                  onCheckedChange={(checked) => updateSettings({ email_enabled: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-enabled">Notificações Push</Label>
                  <p className="text-sm text-gray-500">Enviar notificações push no navegador</p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={settings.push_enabled}
                  onCheckedChange={(checked) => updateSettings({ push_enabled: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-enabled">Notificações SMS</Label>
                  <p className="text-sm text-gray-500">Enviar notificações via SMS (apenas urgentes)</p>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={settings.sms_enabled}
                  onCheckedChange={(checked) => updateSettings({ sms_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Frequência de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Frequência de Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="digest-frequency">Frequência do Resumo</Label>
                <Select
                  value={settings.digest_frequency}
                  onValueChange={(value: any) => updateSettings({ digest_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Imediato</SelectItem>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Controla com que frequência os resumos de notificação são enviados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Horário Silencioso */}
          <Card>
            <CardHeader>
              <CardTitle>Horário Silencioso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quiet-hours">Ativar Horário Silencioso</Label>
                  <p className="text-sm text-gray-500">Não enviar notificações durante determinado período</p>
                </div>
                <Switch
                  id="quiet-hours"
                  checked={settings.quiet_hours_enabled}
                  onCheckedChange={(checked) => updateSettings({ quiet_hours_enabled: checked })}
                />
              </div>
              {settings.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Início</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => updateSettings({ quiet_hours_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">Fim</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => updateSettings({ quiet_hours_end: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notificações Automáticas */}
          <Card>
            <CardHeader>
              <CardTitle>Notificações Automáticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-approval">Lembretes de Aprovação</Label>
                  <p className="text-sm text-gray-500">Enviar lembretes automáticos para aprovações pendentes</p>
                </div>
                <Switch
                  id="auto-approval"
                  checked={settings.auto_approval_reminders}
                  onCheckedChange={(checked) => updateSettings({ auto_approval_reminders: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="deadline-alerts">Alertas de Prazo</Label>
                  <p className="text-sm text-gray-500">Enviar alertas quando documentos estão próximos do vencimento</p>
                </div>
                <Switch
                  id="deadline-alerts"
                  checked={settings.deadline_alerts}
                  onCheckedChange={(checked) => updateSettings({ deadline_alerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="system-maintenance">Manutenção do Sistema</Label>
                  <p className="text-sm text-gray-500">Notificar sobre manutenções programadas</p>
                </div>
                <Switch
                  id="system-maintenance"
                  checked={settings.system_maintenance}
                  onCheckedChange={(checked) => updateSettings({ system_maintenance: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleUpdateSettings}>Salvar Configurações</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()} • {notification.total_recipients}{" "}
                          destinatários
                        </p>
                      </div>
                      <Badge className={getStatusColor(notification.status)}>
                        {notification.status === "sent" && "Enviada"}
                        {notification.status === "scheduled" && "Agendada"}
                        {notification.status === "draft" && "Rascunho"}
                        {notification.status === "failed" && "Falha"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">{renderNotifications()}</TabsContent>

        <TabsContent value="templates">{renderTemplates()}</TabsContent>

        <TabsContent value="settings">{renderSettings()}</TabsContent>
      </Tabs>
    </div>
  )
}
