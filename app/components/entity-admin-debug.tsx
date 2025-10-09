"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-unified-auth'
import { checkSimpleEntityAdminStatus, fixSimpleEntityAdminStatus, listSimpleEntities } from '@/lib/simple-entity-admin-utils'
import { checkGlobalAdminStatus } from '@/lib/entity-admin-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Database, AlertTriangle, CheckCircle, XCircle, Settings, Users } from 'lucide-react'

export function EntityAdminDebug() {
  const { user } = useAuth()
  const [adminStatus, setAdminStatus] = useState<any>(null)
  const [entities, setEntities] = useState<any[]>([])
  const [globalAdminStatus, setGlobalAdminStatus] = useState<any>(null)
  const [selectedEntityId, setSelectedEntityId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)

  const checkStatus = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [entityStatus, entitiesList, globalStatus] = await Promise.all([
        checkSimpleEntityAdminStatus(user.id),
        listSimpleEntities(),
        checkGlobalAdminStatus(user.id)
      ])

      setAdminStatus(entityStatus)
      setEntities(entitiesList.entities)
      setGlobalAdminStatus(globalStatus)

      // Se o usuário não tem entity_id mas é global admin, sugerir uma entidade
      if (!entityStatus.entityId && globalStatus.isGlobalAdmin && entitiesList.entities.length > 0) {
        setSelectedEntityId(entitiesList.entities[0].id)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fixAdminStatus = async () => {
    if (!user?.id || !selectedEntityId) return

    setFixing(true)
    try {
      const result = await fixSimpleEntityAdminStatus(user.id, selectedEntityId)
      
      if (result.success) {
        alert('Status de admin corrigido com sucesso! Recarregue a página.')
        await checkStatus()
      } else {
        alert(`Erro ao corrigir status: ${result.error}`)
      }
    } catch (error) {
      alert(`Erro geral: ${error}`)
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [user?.id])

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Diagnóstico de Admin de Entidade
          </CardTitle>
          <CardDescription>
            Verificação e correção de permissões de administrador de entidade
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

          {/* Status Global Admin */}
          {globalAdminStatus && (
            <div>
              <h4 className="font-medium mb-2">Admin Global</h4>
              <div className="flex items-center gap-2">
                {globalAdminStatus.isGlobalAdmin ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="default">Sim</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge variant="secondary">Não</Badge>
                  </>
                )}
                <span className="text-sm text-gray-600">
                  Role: {globalAdminStatus.role || 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Status Admin de Entidade */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Admin de Entidade</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={checkStatus}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {adminStatus ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {adminStatus.isEntityAdmin ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">Sim</Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">Não</Badge>
                    </>
                  )}
                </div>

                <div className="text-sm space-y-1">
                  <p><strong>Entity ID:</strong> {adminStatus.entityId || 'Nenhuma'}</p>
                  <p><strong>Entity Role:</strong> {adminStatus.entityRole || 'N/A'}</p>
                  <p><strong>Global Role:</strong> {adminStatus.globalRole || 'N/A'}</p>
                </div>

                {adminStatus.errors.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Problemas encontrados:</p>
                        {adminStatus.errors.map((error: string, index: number) => (
                          <p key={index} className="text-sm text-red-600">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Dados do Perfil */}
                {adminStatus.profileData && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Dados Completos do Perfil</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(adminStatus.profileData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Verificando status...</span>
              </div>
            )}
          </div>

          {/* Correção de Status */}
          {adminStatus && !adminStatus.isEntityAdmin && globalAdminStatus?.isGlobalAdmin && (
            <div>
              <h4 className="font-medium mb-2">Corrigir Status de Admin</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Selecionar Entidade:</label>
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={fixAdminStatus}
                  disabled={!selectedEntityId || fixing}
                  className="w-full"
                >
                  {fixing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Corrigindo...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Corrigir Status de Admin
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Entidades Disponíveis */}
          <div>
            <h4 className="font-medium mb-2">Entidades Disponíveis</h4>
            {entities.length > 0 ? (
              <div className="space-y-1">
                {entities.map((entity) => (
                  <div key={entity.id} className="flex items-center justify-between text-sm">
                    <span>{entity.name}</span>
                    <Badge variant="outline">{entity.id.slice(0, 8)}...</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma entidade encontrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
