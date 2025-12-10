'use client'

import { useEntityPlan } from '@/hooks/use-entity-plan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, AlertCircle, CheckCircle } from 'lucide-react'

interface EntityUserLimitsProps {
  entityId: string
  showCreateButton?: boolean
  onCreateUser?: () => void
}

export function EntityUserLimits({ 
  entityId, 
  showCreateButton = false, 
  onCreateUser 
}: EntityUserLimitsProps) {
  const { 
    planInfo, 
    loading, 
    error, 
    checkCanCreateUser, 
    getRemainingUsers 
  } = useEntityPlan(entityId)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span>Carregando informações do plano...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Erro: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!planInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span>Nenhuma informação de plano encontrada</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const usagePercentage = (planInfo.currentUsers / planInfo.maxUsers) * 100
  const canCreate = checkCanCreateUser()
  const remaining = getRemainingUsers()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Limites do Plano</span>
          <Badge variant={canCreate ? "default" : "destructive"}>
            {planInfo.planName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progresso de uso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usuários utilizados</span>
            <span>{planInfo.currentUsers} de {planInfo.maxUsers}</span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${usagePercentage >= 90 ? 'bg-red-100' : usagePercentage >= 70 ? 'bg-yellow-100' : 'bg-green-100'}`}
          />
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2">
          {canCreate ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                Você pode criar mais {remaining} usuário{remaining !== 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">
                Limite de usuários atingido
              </span>
            </>
          )}
        </div>

        {/* Botão de criar usuário */}
        {showCreateButton && (
          <button
            onClick={onCreateUser}
            disabled={!canCreate}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              canCreate
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canCreate ? 'Criar Novo Usuário' : 'Limite Atingido'}
          </button>
        )}

        {/* Informações adicionais */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Plano: {planInfo.planName} ({planInfo.planType})</div>
          {!canCreate && (
            <div className="text-red-600">
              Para criar mais usuários, faça upgrade do seu plano
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente simples para mostrar apenas o status
 */
export function EntityUserStatus({ entityId }: { entityId: string }) {
  const { planInfo, loading, error } = useEntityPlan(entityId)

  if (loading || error || !planInfo) {
    return null
  }

  const usagePercentage = (planInfo.currentUsers / planInfo.maxUsers) * 100
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      <Users className="h-4 w-4" />
      <span>{planInfo.currentUsers}/{planInfo.maxUsers} usuários</span>
      {usagePercentage >= 90 && (
        <Badge variant="destructive" className="text-xs">
          Limite próximo
        </Badge>
      )}
    </div>
  )
}