"use client"

import { useAuth } from '@/lib/hooks/use-auth-final'
import { useUserProfile, useUserUsage } from "@/hooks/use-database-data"
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

export default function SubscriptionStatus() {
  const { user } = useAuth()
  const { profile } = useUserProfile(user?.id)
  const { usage } = useUserUsage()

  if (!user || !profile) {
    return null
  }

  // Verificar se é trial baseado no período de uso
  const isTrial = usage.some(u => 
    u.metric_name === 'documents' && 
    new Date(u.period_end) > new Date()
  )

  const trialEnd = usage.find(u => u.metric_name === 'documents')?.period_end
  const daysRemaining = trialEnd ? Math.ceil((new Date(trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

  const planName = isTrial ? 'Trial' : 'Ativo'
  const planDescription = isTrial ? 'Período de teste gratuito de 7 dias' : 'Plano ativo'

  const getStatusIcon = () => {
    if (isTrial) {
      return <Clock className="h-4 w-4" />
    }
    return <Crown className="h-4 w-4" />
  }

  const getStatusBadge = () => {
    if (isTrial) {
      return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
  }

  const getUsageByMetric = (metricName: string) => {
    const usageItem = usage.find(u => u.metric_name === metricName)
    if (!usageItem) {
      return {
        current_usage: 0,
        limit_value: 0,
        usage_percentage: 0
      }
    }
    return {
      ...usageItem,
      usage_percentage: (usageItem.current_usage / usageItem.limit_value) * 100
    }
  }

  const documentsUsage = getUsageByMetric('documents')
  const storageUsage = getUsageByMetric('storage')
  const usersUsage = getUsageByMetric('users')

  const isTrialExpiringSoon = isTrial && daysRemaining <= 3

  return (
    <div className="space-y-4">
      {/* Status da Assinatura */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusIcon()}
              {planName}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{planDescription}</p>
          
          {isTrial && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dias restantes no trial:</span>
              <span className={`font-semibold ${isTrialExpiringSoon ? 'text-red-600' : 'text-blue-600'}`}>
                {daysRemaining} dias
              </span>
            </div>
          )}

          {isTrialExpiringSoon && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Seu trial expira em {daysRemaining} dias
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Escolha um plano para continuar usando o TrackDoc
              </p>
            </div>
          )}

          {isTrial && (
            <Button asChild className="w-full">
              <Link href="/pricing">
                Ver Planos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Uso dos Recursos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uso dos Recursos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Documentos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Documentos</span>
              </div>
              <span className="text-sm text-gray-600">
                {documentsUsage.current_usage} / {documentsUsage.limit_value}
              </span>
            </div>
            <Progress value={documentsUsage.usage_percentage} className="h-2" />
          </div>

          {/* Armazenamento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Armazenamento</span>
              </div>
              <span className="text-sm text-gray-600">
                {storageUsage.current_usage}GB / {storageUsage.limit_value}GB
              </span>
            </div>
            <Progress value={storageUsage.usage_percentage} className="h-2" />
          </div>

          {/* Usuários */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Usuários</span>
              </div>
              <span className="text-sm text-gray-600">
                {usersUsage.current_usage} / {usersUsage.limit_value}
              </span>
            </div>
            <Progress value={usersUsage.usage_percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recursos do Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recursos Incluídos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Recursos básicos de gestão de documentos
            </li>
            {!isTrial && (
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Recursos avançados e automação
              </li>
            )}
            {!isTrial && (
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Acesso à API
              </li>
            )}
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Suporte: {isTrial ? 'Email' : 'Prioritário'}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 