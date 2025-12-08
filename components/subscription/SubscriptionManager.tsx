'use client'

import { useState } from 'react'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Users, 
  HardDrive, 
  CreditCard, 
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface SubscriptionManagerProps {
  userId: string
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const { subscription, loading, error, isTrialActive, daysUntilTrialEnd, refetch } = useSubscription(userId)
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar informações da assinatura: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma Assinatura Ativa</CardTitle>
          <CardDescription>
            Você ainda não possui um plano ativo. Escolha um plano para começar a usar todas as funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/pricing">
              <Sparkles className="h-4 w-4" />
              Ver Planos Disponíveis
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const plan = subscription.plan
  if (!plan) return null

  const usersPercentage = (subscription.current_users / plan.limits.max_usuarios) * 100
  const storagePercentage = (subscription.current_storage_gb / plan.limits.armazenamento_gb) * 100

  return (
    <div className="space-y-6">
      {/* Status do Trial */}
      {isTrialActive && daysUntilTrialEnd !== null && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Período de teste ativo!</strong> Você tem {daysUntilTrialEnd} dias restantes para experimentar 
            o plano {plan.name} gratuitamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Informações do Plano */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Plano {plan.name}</CardTitle>
              <CardDescription>
                {subscription.status === 'trial' ? 'Período de teste' : 'Assinatura ativa'}
              </CardDescription>
            </div>
            <Badge 
              variant={subscription.status === 'active' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {subscription.status === 'active' && 'Ativo'}
              {subscription.status === 'trial' && 'Trial'}
              {subscription.status === 'canceled' && 'Cancelado'}
              {subscription.status === 'expired' && 'Expirado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preço */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">R$ {plan.price}</span>
            <span className="text-muted-foreground">/mês</span>
          </div>

          {/* Datas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data de início</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(subscription.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {subscription.trial_end_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fim do trial</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(subscription.trial_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Uso de Recursos */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">Uso de Recursos</h4>
            
            {/* Usuários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Usuários</span>
                </div>
                <span className="font-medium">
                  {subscription.current_users} / {plan.limits.max_usuarios}
                </span>
              </div>
              <Progress value={usersPercentage} className="h-2" />
            </div>

            {/* Armazenamento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>Armazenamento</span>
                </div>
                <span className="font-medium">
                  {subscription.current_storage_gb.toFixed(2)} GB / {plan.limits.armazenamento_gb} GB
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
            </div>
          </div>

          {/* Funcionalidades Incluídas */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold">Funcionalidades Incluídas</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(plan.features).map(([key, value]) => {
                if (!value) return null
                const labels: Record<string, string> = {
                  dashboard_gerencial: 'Dashboard gerencial',
                  upload_documentos: 'Upload de documentos',
                  solicitacao_aprovacoes: 'Solicitação de aprovações',
                  suporte_email: 'Suporte por e-mail',
                  biblioteca_publica: 'Biblioteca Pública',
                  assinatura_eletronica_simples: 'Assinatura eletrônica simples',
                  assinatura_eletronica_multipla: 'Assinatura eletrônica múltipla',
                  chat_nativo: 'Chat nativo',
                  auditoria_completa: 'Auditoria completa',
                  backup_automatico_diario: 'Backup automático diário',
                  suporte_tecnico_dedicado: 'Suporte técnico dedicado',
                }
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{labels[key]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button asChild variant="default" className="gap-2">
              <Link href="/pricing">
                <Sparkles className="h-4 w-4" />
                Fazer Upgrade
              </Link>
            </Button>
            
            {subscription.stripe_subscription_id && (
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Gerenciar Pagamento
              </Button>
            )}
            
            {subscription.status === 'active' && (
              <Button variant="ghost" className="text-destructive">
                Cancelar Assinatura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      {plan.limits.usuario_adicional_preco && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recursos Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Usuário adicional:</strong> R$ {plan.limits.usuario_adicional_preco} por usuário/mês
            </p>
            {plan.limits.armazenamento_extra_preco && (
              <p>
                <strong>Armazenamento extra:</strong> R$ {plan.limits.armazenamento_extra_preco} por GB/mês
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
