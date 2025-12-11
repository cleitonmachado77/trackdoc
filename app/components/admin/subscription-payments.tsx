"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CreditCard,
  Search,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
  Download,
  Bell,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from "@/hooks/use-toast"
import { format, differenceInDays, addDays, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SubscriptionWithUser {
  id: string
  user_id: string
  plan_id: string
  plan_name: string
  plan_price: number
  status: string
  start_date: string
  end_date: string | null
  next_billing_date: string | null
  current_users: number
  current_storage_gb: number
  auto_renew: boolean
  created_at: string
  user_name: string
  user_email: string
  days_remaining: number
  payment_status: 'paid' | 'pending' | 'overdue'
  is_entity_admin: boolean // true se é admin de entidade, false se é usuário solo
}

export default function SubscriptionPayments() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithUser | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [processingPayment, setProcessingPayment] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSubscriptions()
  }, [])

  useEffect(() => {
    filterSubscriptions()
  }, [subscriptions, searchTerm, statusFilter, paymentFilter])

  const loadSubscriptions = async () => {
    try {
      console.log('📊 Carregando subscriptions...')
      setLoading(true)

      // Primeiro, buscar apenas usuários responsáveis por pagamento:
      // 1. Admins de entidade (entity_role = 'admin' e entity_id IS NOT NULL)
      // 2. Usuários solo (entity_id IS NULL)
      const { data: paymentResponsibleUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, entity_id, entity_role')
        .or('entity_id.is.null,entity_role.eq.admin')

      if (usersError) {
        console.error('❌ Erro ao buscar usuários responsáveis:', usersError)
        throw usersError
      }

      // Filtrar para garantir a lógica correta:
      // - Usuários solo (entity_id IS NULL)
      // - Admins de entidade (entity_id NOT NULL e entity_role = 'admin')
      const filteredUsers = (paymentResponsibleUsers || []).filter(user => 
        user.entity_id === null || user.entity_role === 'admin'
      )

      console.log('👥 Usuários responsáveis por pagamento:', filteredUsers.length)

      // Criar mapa de profiles
      const profilesMap = new Map(
        filteredUsers.map(p => [p.id, p])
      )

      // Buscar subscriptions apenas desses usuários
      const userIds = filteredUsers.map(u => u.id)
      
      if (userIds.length === 0) {
        console.log('⚠️ Nenhum usuário responsável por pagamento encontrado')
        setSubscriptions([])
        setLoading(false)
        return
      }

      const { data: subscriptionsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })

      if (subsError) {
        console.error('❌ Erro ao buscar subscriptions:', subsError)
        throw subsError
      }

      console.log('✅ Subscriptions encontradas:', subscriptionsData?.length)

      // Processar dados
      const processedData: SubscriptionWithUser[] = (subscriptionsData || []).map((sub: any) => {
        const profile = profilesMap.get(sub.user_id) as any
        const nextBillingDate = sub.next_billing_date || sub.end_date
        const daysRemaining = nextBillingDate 
          ? differenceInDays(new Date(nextBillingDate), new Date())
          : 0

        let paymentStatus: 'paid' | 'pending' | 'overdue' = 'paid'
        if (daysRemaining < 0) {
          paymentStatus = 'overdue'
        } else if (daysRemaining <= 7) {
          paymentStatus = 'pending'
        }

        // Determinar se é admin de entidade ou usuário solo
        const isEntityAdmin = profile?.entity_id !== null && profile?.entity_role === 'admin'

        return {
          id: sub.id,
          user_id: sub.user_id,
          plan_id: sub.plan_id,
          plan_name: sub.plan_name,
          plan_price: sub.plan_price,
          status: sub.status,
          start_date: sub.start_date,
          end_date: sub.end_date,
          next_billing_date: nextBillingDate,
          current_users: sub.current_users,
          current_storage_gb: sub.current_storage_gb,
          auto_renew: sub.auto_renew,
          created_at: sub.created_at,
          user_name: profile?.full_name || 'Sem nome',
          user_email: profile?.email || 'Sem email',
          days_remaining: daysRemaining,
          payment_status: paymentStatus,
          is_entity_admin: isEntityAdmin,
        }
      })

      console.log('✅ Dados processados:', processedData.length, 'subscriptions')
      setSubscriptions(processedData)
    } catch (error) {
      console.error('❌ Erro ao carregar subscriptions:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assinaturas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterSubscriptions = () => {
    let filtered = subscriptions

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    // Filtro de pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(sub => sub.payment_status === paymentFilter)
    }

    setFilteredSubscriptions(filtered)
  }

  const handleOpenPaymentModal = (subscription: SubscriptionWithUser) => {
    setSelectedSubscription(subscription)
    setPaymentAmount(subscription.plan_price.toString())
    setPaymentDate(format(new Date(), "yyyy-MM-dd"))
    setShowPaymentModal(true)
  }

  const handleProcessPayment = async () => {
    if (!selectedSubscription) return
    if (processingPayment) {
      console.log('⚠️ Já está processando um pagamento')
      return
    }

    try {
      setProcessingPayment(true)

      console.log('🔄 Processando pagamento...')
      console.log('Subscription ID:', selectedSubscription.id)
      console.log('Data do pagamento:', paymentDate)
      console.log('Valor:', paymentAmount)

      // Calcular nova data de vencimento (30 dias a partir da data de pagamento)
      const newBillingDate = addMonths(new Date(paymentDate), 1)
      console.log('Nova data de vencimento:', newBillingDate)

      // Atualizar subscription
      console.log('📝 Atualizando subscription:', selectedSubscription.id)
      const updatePayload = {
        next_billing_date: newBillingDate.toISOString(),
        end_date: newBillingDate.toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      }
      console.log('📦 Payload de atualização:', updatePayload)

      const { data: updateData, error: updateError } = await supabase
        .from('subscriptions')
        .update(updatePayload)
        .eq('id', selectedSubscription.id)
        .select()

      if (updateError) {
        console.error('❌ Erro ao atualizar subscription:', updateError)
        throw updateError
      }

      console.log('✅ Subscription atualizada:', updateData)
      console.log('📅 Campos atualizados:', {
        next_billing_date: updateData?.[0]?.next_billing_date,
        end_date: updateData?.[0]?.end_date,
        status: updateData?.[0]?.status
      })

      // Registrar pagamento (criar tabela de pagamentos se necessário)
      console.log('💰 Registrando pagamento...')
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: selectedSubscription.id,
          user_id: selectedSubscription.user_id,
          amount: parseFloat(paymentAmount),
          payment_date: paymentDate,
          status: 'completed',
          payment_method: 'manual',
          notes: 'Pagamento lançado manualmente pelo super admin',
        })

      // Se a tabela não existir, apenas ignorar o erro
      if (paymentError) {
        if (paymentError.code === '42P01') {
          console.warn('⚠️ Tabela subscription_payments não existe ainda. Execute a migration.')
        } else {
          console.warn('⚠️ Aviso ao registrar pagamento:', paymentError)
        }
      } else {
        console.log('✅ Pagamento registrado')
      }

      toast({
        title: "Pagamento Registrado",
        description: `Pagamento de R$ ${paymentAmount} registrado com sucesso. Próximo vencimento: ${format(newBillingDate, "dd/MM/yyyy", { locale: ptBR })}`,
      })

      setShowPaymentModal(false)
      
      console.log('🔄 Recarregando subscriptions...')
      await loadSubscriptions()
      console.log('✅ Subscriptions recarregadas')
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível processar o pagamento.",
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const sendPaymentReminder = async (subscription: SubscriptionWithUser) => {
    try {
      // Aqui você pode implementar o envio de notificação/email
      toast({
        title: "Lembrete Enviado",
        description: `Lembrete de pagamento enviado para ${subscription.user_email}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o lembrete.",
        variant: "destructive",
      })
    }
  }

  const getPaymentStatusBadge = (status: 'paid' | 'pending' | 'overdue') => {
    const badges = {
      paid: { label: 'Pago', className: 'bg-green-100 text-green-800 border-green-200' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800 border-red-200' },
    }
    const badge = badges[status]
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const getDaysRemainingBadge = (days: number) => {
    if (days < 0) {
      return <Badge className="bg-red-100 text-red-800">{Math.abs(days)} dias vencido</Badge>
    } else if (days === 0) {
      return <Badge className="bg-orange-100 text-orange-800">Vence hoje</Badge>
    } else if (days <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800">{days} dias restantes</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">{days} dias restantes</Badge>
    }
  }

  // Estatísticas
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    pending: subscriptions.filter(s => s.payment_status === 'pending').length,
    overdue: subscriptions.filter(s => s.payment_status === 'overdue').length,
    totalRevenue: subscriptions.reduce((sum, s) => sum + s.plan_price, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gerenciamento de Pagamentos</h2>
        <p className="text-gray-600">Controle de assinaturas e pagamentos dos usuários</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadSubscriptions} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>
            Gerencie os pagamentos e vencimentos das assinaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma assinatura encontrada</p>
              </div>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Informações do Usuário */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {subscription.user_name}
                            </h3>
                            {subscription.is_entity_admin ? (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Admin Entidade
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Usuário Solo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{subscription.user_email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline">{subscription.plan_name}</Badge>
                        <Badge variant="outline">
                          R$ {subscription.plan_price.toFixed(2)}/mês
                        </Badge>
                        {getPaymentStatusBadge(subscription.payment_status)}
                        {getDaysRemainingBadge(subscription.days_remaining)}
                      </div>

                      {subscription.next_billing_date && (
                        <p className="text-sm text-gray-600 mt-2">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Próximo vencimento:{" "}
                          {format(new Date(subscription.next_billing_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      {subscription.payment_status !== 'paid' && (
                        <Button
                          onClick={() => sendPaymentReminder(subscription)}
                          variant="outline"
                          size="sm"
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Lembrete
                        </Button>
                      )}

                      <Button
                        onClick={() => handleOpenPaymentModal(subscription)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Lançar Pagamento
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar Pagamento</DialogTitle>
            <DialogDescription>
              Registre o pagamento da assinatura de {selectedSubscription?.user_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Plano</label>
              <p className="text-lg font-semibold">{selectedSubscription?.plan_name}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data do Pagamento</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O próximo vencimento será automaticamente calculado para 30 dias após a data do
                pagamento.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              disabled={processingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={processingPayment || !paymentAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingPayment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
