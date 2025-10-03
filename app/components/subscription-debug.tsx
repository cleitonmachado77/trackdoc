"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { checkSubscriptionTables } from '@/lib/subscription-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Database, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export function SubscriptionDebug() {
  const { user, subscription, loading } = useAuth()
  const [tableStatus, setTableStatus] = useState<{
    subscriptionsExists: boolean
    plansExists: boolean
    errors: string[]
  } | null>(null)
  const [checkingTables, setCheckingTables] = useState(false)

  const checkTables = async () => {
    setCheckingTables(true)
    try {
      const status = await checkSubscriptionTables()
      setTableStatus(status)
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error)
    } finally {
      setCheckingTables(false)
    }
  }

  useEffect(() => {
    checkTables()
  }, [])

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnóstico de Subscription
          </CardTitle>
          <CardDescription>
            Informações sobre o estado das tabelas e subscription do usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status do Usuário */}
          <div>
            <h4 className="font-medium mb-2">Usuário Atual</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{user.email}</Badge>
              <Badge variant="secondary">{user.id.slice(0, 8)}...</Badge>
            </div>
          </div>

          {/* Status da Subscription */}
          <div>
            <h4 className="font-medium mb-2">Subscription Atual</h4>
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : subscription ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="default">Ativa</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p>ID: {subscription.subscription_id}</p>
                  <p>Plano: {subscription.plan_name}</p>
                  <p>Status: {subscription.status}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive">Sem Subscription</Badge>
              </div>
            )}
          </div>

          {/* Status das Tabelas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Status das Tabelas</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={checkTables}
                disabled={checkingTables}
              >
                {checkingTables ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {tableStatus ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {tableStatus.subscriptionsExists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    subscriptions: {tableStatus.subscriptionsExists ? 'OK' : 'ERRO'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {tableStatus.plansExists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    plans: {tableStatus.plansExists ? 'OK' : 'ERRO'}
                  </span>
                </div>

                {tableStatus.errors.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Erros encontrados:</p>
                        {tableStatus.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Verificando tabelas...</span>
              </div>
            )}
          </div>

          {/* Informações Adicionais */}
          <div>
            <h4 className="font-medium mb-2">Informações Técnicas</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              <p>Ambiente: {process.env.NODE_ENV}</p>
              <p>Timestamp: {new Date().toISOString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
