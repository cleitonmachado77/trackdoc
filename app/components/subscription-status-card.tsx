"use client"

import { useAuth } from '@/lib/hooks/use-auth-final'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  HardDrive, 
  Users,
  ArrowRight 
} from "lucide-react"
import Link from "next/link"

export default function SubscriptionStatusCard() {
  const { user, subscription, usage } = useAuth()

  if (!user || !subscription) {
    return null
  }

  const isTrial = subscription.is_trial
  const isTrialExpiringSoon = isTrial && subscription.days_remaining <= 3
  const isExpired = subscription.days_remaining <= 0

  const getStatusIcon = () => {
    if (isTrial) {
      return <Clock className="h-4 w-4" />
    }
    return <Crown className="h-4 w-4" />
  }

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-800">Expirado</Badge>
    }
    if (isTrial) {
      return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
  }

  const getUsageByMetric = (metricName: string) => {
    return usage.find(u => u.metric_name === metricName) || {
      current_usage: 0,
      limit_value: 0,
      usage_percentage: 0
    }
  }

  const documentsUsage = getUsageByMetric('documents')
  const storageUsage = getUsageByMetric('storage_gb')

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Status da Assinatura</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">{subscription.plan_name}</h3>
          <p className="text-sm text-gray-600">{subscription.plan_description}</p>
        </div>

        {isTrial && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Dias restantes no trial:</span>
            <span className={`font-semibold ${isTrialExpiringSoon ? 'text-red-600' : 'text-blue-600'}`}>
              {subscription.days_remaining} dias
            </span>
          </div>
        )}

        {isTrialExpiringSoon && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Seu trial expira em {subscription.days_remaining} dias
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Escolha um plano para continuar usando o TrackDoc
            </p>
          </div>
        )}

        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Seu trial expirou
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Escolha um plano para continuar usando o TrackDoc
            </p>
          </div>
        )}

        {/* Uso dos Recursos */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Documentos
              </span>
              <span>{documentsUsage.current_usage} / {documentsUsage.limit_value}</span>
            </div>
            <Progress value={documentsUsage.usage_percentage} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Armazenamento
              </span>
              <span>{storageUsage.current_usage}GB / {storageUsage.limit_value}GB</span>
            </div>
            <Progress value={storageUsage.usage_percentage} className="h-2" />
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {(isTrial || isExpired) && (
            <Button asChild variant="outline" className="flex-1">
              <Link href="/support">
                Contatar Administrador
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          
          {!isTrial && !isExpired && (
            <Button asChild variant="outline" className="flex-1">
              <Link href="/account/billing">
                Gerenciar Assinatura
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
