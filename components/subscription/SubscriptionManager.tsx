'use client'

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
  AlertCircle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface SubscriptionManagerProps {
  userId: string
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const { 
    subscription, 
    loading, 
    error, 
    isTrialActive, 
    daysUntilTrialEnd,
    getRemainingUsers,
    getRemainingStorage,
    getUsagePercentage
  } = useSubscription(userId)

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

  const usersPercentage = getUsagePercentage('users')
  const storagePercentage = getUsagePercentage('storage')
  const remainingUsers = getRemainingUsers()
  const remainingStorage = getRemainingStorage()

  // Determinar status de alerta
  const usersAlert = usersPercentage >= 90 ? 'critical' : usersPercentage >= 80 ? 'warning' : 'normal'
  const storageAlert = storagePercentage >= 90 ? 'critical' : storagePercentage >= 80 ? 'warning' : 'normal'

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800 border-green-200' },
      trial: { label: 'Período de Teste', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      canceled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      expired: { label: 'Expirado', className: 'bg-red-100 text-red-800 border-red-200' },
      past_due: { label: 'Pagamento Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    }
    const badge = badges[status as keyof typeof badges] || badges.active
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Status do Trial */}
      {isTrialActive && daysUntilTrialEnd !== null && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Período de teste ativo!</strong> Você tem {daysUntilTrialEnd} {daysUntilTrialEnd === 1 ? 'dia' : 'dias'} restantes para experimentar 
            o plano {plan.name} gratuitamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Card Principal do Plano */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">Plano {plan.name}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {subscription.status === 'trial' ? 'Período de teste' : 'Sua assinatura atual'}
              </CardDescription>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Preço e Informações */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor mensal</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">R$ {plan.price}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Data de início</p>
              <p className="text-sm font-medium">
                {format(new Date(subscription.start_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Uso de Recursos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Uso de Recursos</h4>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Fazer Upgrade
                </Link>
              </Button>
            </div>
            
            {/* Usuários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Usuários</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${usersAlert === 'critical' ? 'text-red-600' : usersAlert === 'warning' ? 'text-amber-600' : 'text-gray-900'}`}>
                    {subscription.current_users} / {plan.limits.max_usuarios}
                  </span>
                  <span className="text-muted-foreground ml-2">({usersPercentage}%)</span>
                </div>
              </div>
              <Progress 
                value={usersPercentage} 
                className={`h-2 ${usersAlert === 'critical' ? '[&>div]:bg-red-600' : usersAlert === 'warning' ? '[&>div]:bg-amber-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                {remainingUsers > 0 
                  ? `${remainingUsers} ${remainingUsers === 1 ? 'usuário disponível' : 'usuários disponíveis'}`
                  : 'Limite atingido'
                }
              </p>
            </div>

            {/* Armazenamento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Armazenamento</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${storageAlert === 'critical' ? 'text-red-600' : storageAlert === 'warning' ? 'text-amber-600' : 'text-gray-900'}`}>
                    {subscription.current_storage_gb.toFixed(2)} / {plan.limits.armazenamento_gb} GB
                  </span>
                  <span className="text-muted-foreground ml-2">({storagePercentage}%)</span>
                </div>
              </div>
              <Progress 
                value={storagePercentage} 
                className={`h-2 ${storageAlert === 'critical' ? '[&>div]:bg-red-600' : storageAlert === 'warning' ? '[&>div]:bg-amber-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                {remainingStorage > 0 
                  ? `${remainingStorage.toFixed(2)} GB disponíveis`
                  : 'Limite atingido'
                }
              </p>
            </div>
          </div>

          {/* Funcionalidades Incluídas */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-lg">Funcionalidades do Seu Plano</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(plan.features).map(([key, value]) => {
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
                  <div 
                    key={key} 
                    className={`flex items-center gap-2 text-sm p-2 rounded ${value ? 'bg-green-50 dark:bg-green-950/20' : 'bg-gray-50 dark:bg-gray-900 opacity-50'}`}
                  >
                    {value ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 line-through'}>
                      {labels[key]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Adicionais */}
      {plan.limits.usuario_adicional_preco && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Recursos Adicionais Disponíveis
            </CardTitle>
            <CardDescription>
              Expanda seu plano conforme sua necessidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Usuário adicional</p>
                  <p className="text-sm text-muted-foreground">Adicione mais usuários ao seu plano</p>
                </div>
              </div>
              <p className="text-lg font-bold text-blue-600">
                R$ {plan.limits.usuario_adicional_preco}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>
            {plan.limits.armazenamento_extra_preco && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Armazenamento extra</p>
                    <p className="text-sm text-muted-foreground">Aumente seu espaço de armazenamento</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  R$ {plan.limits.armazenamento_extra_preco}
                  <span className="text-sm font-normal text-muted-foreground">/GB/mês</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações e Suporte */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Precisa de ajuda com seu plano?
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Para alterações no seu plano, adicionar recursos ou tirar dúvidas, entre em contato com o administrador do sistema ou nossa equipe de suporte.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild className="bg-white">
                  <Link href="/pricing">Ver Outros Planos</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="bg-white">
                  <Link href="/support">Falar com Suporte</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
