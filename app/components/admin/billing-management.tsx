"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CreditCard,
  Calendar,
  DollarSign,
  Download,
  Edit,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  FileText,
  Clock,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react"
import { usePlans, type Plan } from "@/hooks/use-plans"
import { useUserSubscription, useUserInvoices, useUserPaymentMethods } from "@/hooks/use-subscriptions"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useUserUsage } from "@/hooks/use-database-data"

export default function BillingManagement() {
  const { user } = useAuth()
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false)
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("")
  
  // Hooks para dados reais do Supabase
  const { plans, loading: plansLoading, error: plansError } = usePlans()
  const { subscription, loading: subscriptionLoading, error: subscriptionError } = useUserSubscription()
  const { invoices, loading: invoicesLoading, error: invoicesError } = useUserInvoices()
  const { paymentMethods, loading: paymentMethodsLoading, error: paymentMethodsError } = useUserPaymentMethods()
  const { usage } = useUserUsage()

  // Plano atual baseado na assinatura real
  // NOTA: Não há limite de documentos nos planos, apenas usuários e armazenamento
  const currentPlan = subscription ? {
    name: subscription.plan?.name || 'Plano não encontrado',
    price_monthly: subscription.plan?.price || 0,
    max_users: plans.find(p => p.name === subscription.plan?.name)?.max_users || 1,
    max_storage_gb: plans.find(p => p.name === subscription.plan?.name)?.max_storage_gb || 1,
    features: subscription.plan?.features || [],
    is_trial: subscription.status === 'trial',
    trial_days: subscription.trial_end_date ? Math.ceil((new Date(subscription.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
    nextBilling: subscription.end_date,
  } : {
    name: "Nenhum plano ativo",
    price_monthly: 0,
    max_users: 1,
    max_storage_gb: 1,
    features: ["Acesso limitado", "Entre em contato para mais informações"],
    is_trial: false,
    trial_days: 0,
    nextBilling: new Date().toISOString(),
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCardBrandIcon = (brand: string) => {
    // Em um projeto real, você usaria ícones específicos das bandeiras
    return <CreditCard className="h-4 w-4" />
  }

  const getUsageByMetric = (metricName: string) => {
    return usage.find(u => u.metric_name === metricName) || {
      current_usage: 0,
      limit_value: 0
    }
  }

  const storageUsage = getUsageByMetric('storage_gb')
  const usersUsage = getUsageByMetric('users')

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando dados de assinatura...</span>
      </div>
    )
  }

  if (subscriptionError) {
    return (
      <div className="text-center py-8 text-red-600">
        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
        {subscriptionError}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Plano Atual
          </CardTitle>
          <CardDescription>Gerencie seu plano de assinatura e recursos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{currentPlan.name}</h3>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {currentPlan.price_monthly?.toFixed(2) || "0.00"}
                  <span className="text-sm font-normal text-gray-500">/mês</span>
                </p>
                {currentPlan.is_trial && (
                  <Badge className="bg-green-100 text-green-800 mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    Trial - {currentPlan.trial_days} dias
                  </Badge>
                )}
                {subscription?.status && (
                  <Badge className={`mt-2 ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                    subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                    subscription.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status === 'active' ? 'Ativo' :
                     subscription.status === 'trial' ? 'Trial' :
                     subscription.status === 'expired' ? 'Expirado' :
                     subscription.status === 'canceled' ? 'Cancelado' : subscription.status}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Até {currentPlan.max_users} usuários</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{currentPlan.max_storage_gb}GB de armazenamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Documentos ilimitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Próxima cobrança: {currentPlan.nextBilling ? new Date(currentPlan.nextBilling).toLocaleDateString("pt-BR") : 'Não definida'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={showPlanChangeDialog} onOpenChange={setShowPlanChangeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Alterar Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Alterar Plano de Assinatura</DialogTitle>
                      <DialogDescription>Escolha o plano que melhor atende às suas necessidades</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {plansLoading ? (
                        <div className="col-span-3 flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Carregando planos...</span>
                        </div>
                      ) : plansError ? (
                        <div className="col-span-3 text-center py-8 text-red-600">
                          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                          {plansError}
                        </div>
                      ) : (
                        plans.map((plan) => (
                          <Card
                            key={plan.id}
                            className={`cursor-pointer transition-colors ${selectedPlan === plan.id ? "ring-2 ring-blue-500" : ""}`}
                            onClick={() => setSelectedPlan(plan.id)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <div className="text-2xl font-bold text-blue-600">
                                R$ {plan.price_monthly.toFixed(2)}
                                <span className="text-sm font-normal text-gray-500">/mês</span>
                              </div>
                              {plan.is_trial && (
                                <Badge className="bg-green-100 text-green-800 w-fit">
                                  Trial - {plan.trial_days} dias
                                </Badge>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="text-xs text-gray-600 mb-2">
                                {plan.description}
                              </div>
                              {plan.features?.slice(0, 5).map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-xs">{feature}</span>
                                </div>
                              ))}
                              {plan.features && plan.features.length > 5 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  +{plan.features.length - 5} recursos adicionais
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setShowPlanChangeDialog(false)}>
                        Cancelar
                      </Button>
                      <Button disabled={!selectedPlan}>Confirmar Alteração</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline">Cancelar Assinatura</Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Recursos Inclusos</h4>
              <div className="space-y-2">
                {currentPlan.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de Pagamento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Métodos de Pagamento
              </CardTitle>
              <CardDescription>Gerencie seus cartões e formas de pagamento</CardDescription>
            </div>
            <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cartão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                  <DialogDescription>Adicione um novo cartão de crédito ou débito</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Data de Expiração</Label>
                      <Input id="expiryDate" placeholder="MM/AA" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nome no Cartão</Label>
                    <Input id="cardName" placeholder="João Silva" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowPaymentMethodDialog(false)}>
                    Cancelar
                  </Button>
                  <Button>Adicionar Cartão</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethodsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando métodos de pagamento...</span>
            </div>
          ) : paymentMethodsError ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              {paymentMethodsError}
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum método de pagamento cadastrado</p>
              <p className="text-sm">Adicione um cartão para facilitar os pagamentos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCardBrandIcon(method.brand || 'card')}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {method.type === 'card' && method.last_four 
                            ? `**** **** **** ${method.last_four}`
                            : method.type === 'pix' 
                            ? 'PIX'
                            : 'Transferência Bancária'
                          }
                        </span>
                        {method.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </div>

                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button variant="outline" size="sm">
                        Definir como Padrão
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Histórico de Faturas
          </CardTitle>
          <CardDescription>Visualize e baixe suas faturas anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando faturas...</span>
            </div>
          ) : invoicesError ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              {invoicesError}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma fatura encontrada</p>
              <p className="text-sm">As faturas aparecerão aqui após o primeiro pagamento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{invoice.id}</div>
                      <p className="text-sm text-gray-500">{invoice.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {invoice.amount.toFixed(2)}</div>
                      <p className="text-sm text-gray-500">
                        {new Date(invoice.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(invoice.status)}
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uso Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Uso Atual</CardTitle>
          <CardDescription>Monitore o uso dos recursos do seu plano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usuários</span>
                <span className="text-sm text-gray-500">
                  {usersUsage.current_usage} / {currentPlan.max_users}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((usersUsage.current_usage / currentPlan.max_users) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Armazenamento</span>
                <span className="text-sm text-gray-500">
                  {storageUsage.current_usage.toFixed(1)}GB / {currentPlan.max_storage_gb}GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((storageUsage.current_usage / currentPlan.max_storage_gb) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Documentos são ilimitados - não há barra de progresso */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
