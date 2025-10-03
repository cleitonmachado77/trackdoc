'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface HealthStatus {
  timestamp: string
  status: 'healthy' | 'unhealthy' | 'error'
  checks: {
    connectivity: boolean
    supabaseConfig: boolean
    environment: boolean
  }
  details: {
    connectivity: string
    supabaseConfig: string
    environment: string
  }
  error?: string
}

export default function ConnectionStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
      setLastChecked(new Date())
    } catch (error) {
      setHealth({
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        checks: {
          connectivity: false,
          supabaseConfig: false,
          environment: false,
        },
        details: {
          connectivity: 'Erro ao verificar conectividade',
          supabaseConfig: 'Erro ao verificar configuração',
          environment: 'Erro ao verificar ambiente',
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Saudável</Badge>
      case 'unhealthy':
        return <Badge variant="secondary" className="bg-yellow-500">Problemas</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getCheckIcon = (check: boolean) => {
    return check ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {health?.status === 'healthy' ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <CardTitle>Status da Conexão</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(health?.status || 'unknown')}
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
          </div>
        </div>
        <CardDescription>
          Diagnóstico da conectividade e configuração do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {health && (
          <>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.status)}
              <span className="font-medium">
                Status Geral: {health.status === 'healthy' ? 'Saudável' : 
                              health.status === 'unhealthy' ? 'Problemas Detectados' : 'Erro'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getCheckIcon(health.checks.connectivity)}
                  <span className="font-medium">Conectividade</span>
                </div>
                <span className="text-sm text-gray-600">
                  {health.details.connectivity}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getCheckIcon(health.checks.supabaseConfig)}
                  <span className="font-medium">Configuração Supabase</span>
                </div>
                <span className="text-sm text-gray-600">
                  {health.details.supabaseConfig}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getCheckIcon(health.checks.environment)}
                  <span className="font-medium">Variáveis de Ambiente</span>
                </div>
                <span className="text-sm text-gray-600">
                  {health.details.environment}
                </span>
              </div>
            </div>

            {health.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-800">Erro:</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{health.error}</p>
              </div>
            )}

            {lastChecked && (
              <div className="text-xs text-gray-500 text-center">
                Última verificação: {lastChecked.toLocaleString()}
              </div>
            )}
          </>
        )}

        {!health && !loading && (
          <div className="text-center py-4 text-gray-500">
            Clique em "Verificar" para diagnosticar a conexão
          </div>
        )}
      </CardContent>
    </Card>
  )
}
