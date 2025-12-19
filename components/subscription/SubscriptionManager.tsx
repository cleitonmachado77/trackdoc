'use client'

import { useSubscription } from '@/lib/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Users, 
  HardDrive, 
  AlertCircle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Package,
  Clock,
  XCircle,
  FileText,
  AlertTriangle
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
    isTrialExpired,
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
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong>Para ativar um plano:</strong> Entre em contato com nossa equipe de suporte para configurar sua assinatura e ter acesso a todas as funcionalidades.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/support">
                <AlertCircle className="h-4 w-4" />
                Falar com Suporte
              </Link>
            </Button>
          </div>
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

  // Verificar se é plano Trial
  const isTrial = subscription.status === 'trial'
  
  // Calcular data de fim do trial (com fallback para start_date + 14 dias)
  const calculateTrialEndDate = () => {
    if (subscription.trial_end_date) {
      return new Date(subscription.trial_end_date)
    }
    if (subscription.status === 'trial' && subscription.start_date) {
      const startDate = new Date(subscription.start_date)
      startDate.setDate(startDate.getDate() + 14)
      return startDate
    }
    return null
  }
  
  const trialEndDateCalculated = calculateTrialEndDate()
  
  // Calcular dias restantes do trial (usando Math.ceil para garantir que mostre pelo menos 1 dia quando ainda não expirou)
  const trialDaysRemaining = trialEndDateCalculated 
    ? Math.max(0, Math.ceil((trialEndDateCalculated.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800 border-green-200' },
      trial: { label: 'Período de Teste (14 dias)', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      canceled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      expired: { label: 'Expirado', className: 'bg-red-100 text-red-800 border-red-200' },
      past_due: { label: 'Pagamento Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    }
    const badge = badges[status as keyof typeof badges] || badges.active
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Trial Expirado - BLOQUEIO */}
      {isTrialExpired && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="text-red-800 font-bold">Período de Teste Expirado!</AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            <p className="mb-3">
              Seu período de teste de 14 dias terminou. Para continuar usando o sistema, 
              é necessário escolher um plano pago.
            </p>
            <div className="flex gap-2">
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="/choose-plan">Escolher um Plano</Link>
              </Button>
              <Button asChild variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                <Link href="/support">Falar com Suporte</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status do Trial Ativo - Sempre mostra dias restantes */}
      {isTrial && !isTrialExpired && daysUntilTrialEnd !== null && (
        <Alert className={`${daysUntilTrialEnd <= 3 ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'} dark:bg-blue-950/20`}>
          {daysUntilTrialEnd <= 3 ? (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          ) : (
            <Sparkles className="h-5 w-5 text-blue-600" />
          )}
          <AlertTitle className={daysUntilTrialEnd <= 3 ? 'text-amber-800' : 'text-blue-800'}>
            {daysUntilTrialEnd <= 3 ? 'Seu período de teste está acabando!' : 'Período de Teste Ativo'}
          </AlertTitle>
          <AlertDescription className={daysUntilTrialEnd <= 3 ? 'text-amber-700' : 'text-blue-700'}>
            <p className="mb-2">
              {daysUntilTrialEnd === 0 
                ? 'Seu período de teste termina hoje!' 
                : daysUntilTrialEnd === 1 
                  ? 'Você tem apenas 1 dia restante no período de teste.'
                  : `Você tem ${daysUntilTrialEnd} dias restantes para experimentar todas as funcionalidades gratuitamente.`
              }
            </p>
            <p className="text-sm">
              Durante o período de teste, você tem acesso a <strong>todas as funcionalidades</strong> do sistema.
            </p>
            {daysUntilTrialEnd <= 3 && (
              <div className="mt-3">
                <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <Link href="/choose-plan">Escolher um Plano Agora</Link>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Card Principal do Plano */}
      <Card className="border-2">
        <CardHeader className={`${isTrial ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} dark:from-blue-950/20 dark:to-indigo-950/20`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">
                  {isTrial ? 'Plano Trial' : `Plano ${plan.name}`}
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                {isTrial 
                  ? 'Período de teste com acesso completo por 14 dias' 
                  : 'Sua assinatura atual'
                }
              </CardDescription>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Informações do Trial */}
          {isTrial && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Informações do Período de Teste</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Duração total</p>
                  <p className="font-bold text-blue-900">14 dias</p>
                </div>
                <div>
                  <p className="text-blue-700">Dias restantes</p>
                  <p className={`font-bold ${trialDaysRemaining <= 3 ? 'text-amber-600' : 'text-blue-900'}`}>
                    {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Início do teste</p>
                  <p className="font-bold text-blue-900">
                    {subscription.trial_start_date 
                      ? format(new Date(subscription.trial_start_date), "dd/MM/yyyy", { locale: ptBR })
                      : format(new Date(subscription.start_date), "dd/MM/yyyy", { locale: ptBR })
                    }
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Término do teste</p>
                  <p className={`font-bold ${trialDaysRemaining <= 3 ? 'text-amber-600' : 'text-blue-900'}`}>
                    {trialEndDateCalculated 
                      ? format(trialEndDateCalculated, "dd/MM/yyyy", { locale: ptBR })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-700">
                  <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                  <strong>Todas as funcionalidades estão disponíveis</strong> durante o período de teste.
                </p>
              </div>
            </div>
          )}

          {/* Preço e Informações (para planos pagos) */}
          {!isTrial && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor mensal</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-600">
                    R$ {typeof plan.price === 'number' ? plan.price.toFixed(2).replace('.', ',') : plan.price}
                  </span>
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
          )}

          {/* Limites do Plano - Apenas para planos pagos (não Trial) */}
          {!isTrial && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Limites do Plano
              </h4>
              
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

              {/* Documentos - Ilimitados */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Documentos</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Ilimitados
                </Badge>
              </div>
            </div>
          )}

          {/* Informação de acesso ilimitado para Trial */}
          {isTrial && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Acesso Ilimitado Durante o Trial</span>
              </div>
              <p className="text-sm text-green-700">
                Durante o período de teste de 14 dias, você tem acesso ilimitado a usuários, armazenamento e documentos. 
                Aproveite para testar todas as funcionalidades do sistema!
              </p>
            </div>
          )}

          {/* Funcionalidades Incluídas */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-lg">
              {isTrial ? 'Funcionalidades Disponíveis no Trial' : 'Funcionalidades do Seu Plano'}
            </h4>
            {isTrial && (
              <p className="text-sm text-muted-foreground mb-3">
                Durante o período de teste, você tem acesso a todas as funcionalidades do sistema.
              </p>
            )}
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
                // No Trial, todas as funcionalidades estão disponíveis
                const isAvailable = isTrial ? true : value
                return (
                  <div 
                    key={key} 
                    className={`flex items-center gap-2 text-sm p-2 rounded ${isAvailable ? 'bg-green-50 dark:bg-green-950/20' : 'bg-gray-50 dark:bg-gray-900 opacity-50'}`}
                  >
                    {isAvailable ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={isAvailable ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 line-through'}>
                      {labels[key] || key}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Adicionais (apenas para planos pagos) */}
      {!isTrial && plan.limits.usuario_adicional_preco && (
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
                R$ {typeof plan.limits.usuario_adicional_preco === 'number' 
                  ? plan.limits.usuario_adicional_preco.toFixed(2).replace('.', ',') 
                  : plan.limits.usuario_adicional_preco}
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
                  R$ {typeof plan.limits.armazenamento_extra_preco === 'number' 
                    ? plan.limits.armazenamento_extra_preco.toFixed(2).replace('.', ',') 
                    : plan.limits.armazenamento_extra_preco}
                  <span className="text-sm font-normal text-muted-foreground">/GB/mês</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CTA para escolher plano (Trial) */}
      {isTrial && !isTrialExpired && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-lg font-semibold text-blue-900">
                    Gostando do TrackDoc?
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Escolha um plano antes do término do período de teste para continuar usando todas as funcionalidades sem interrupção.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/choose-plan">Ver Planos Disponíveis</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <Link href="/support">Falar com Suporte</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações e Suporte (planos pagos) */}
      {!isTrial && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Precisa de ajuda com seu plano?
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Para alterações no seu plano, adicionar recursos ou tirar dúvidas, entre em contato com nossa equipe de suporte.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="bg-white">
                    <Link href="/support">Falar com Suporte</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
