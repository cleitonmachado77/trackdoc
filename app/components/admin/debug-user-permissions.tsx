"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DebugUserPermissions() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugInfo = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Buscar perfil completo do usuário logado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
        setDebugInfo({ error: profileError.message })
        return
      }

      // Buscar informações da entidade
      let entityInfo = null
      if (profile.entity_id) {
        const { data: entity } = await supabase
          .from('entities')
          .select('*')
          .eq('id', profile.entity_id)
          .single()
        
        entityInfo = entity
      }

      // Buscar todos os usuários da entidade
      let entityUsers = []
      if (profile.entity_id) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, email, full_name, entity_role, status')
          .eq('entity_id', profile.entity_id)
        
        entityUsers = users || []
      }

      // Verificar auth.users
      const { data: authUser } = await supabase.auth.getUser()

      setDebugInfo({
        currentUser: {
          id: user.id,
          email: user.email,
          authEmail: authUser.user?.email,
        },
        profile: profile,
        entity: entityInfo,
        entityUsers: entityUsers,
        permissions: {
          isAdmin: profile.entity_role === 'admin',
          hasEntityId: !!profile.entity_id,
          isActive: profile.status === 'active',
          canManageUsers: profile.entity_role === 'admin' && !!profile.entity_id && profile.status === 'active'
        }
      })

    } catch (err) {
      console.error('Erro ao buscar informações de debug:', err)
      setDebugInfo({ error: err instanceof Error ? err.message : 'Erro desconhecido' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [user?.id])

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Usuário não autenticado</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Debug de Permissões do Usuário</CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchDebugInfo}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo?.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{debugInfo.error}</AlertDescription>
            </Alert>
          ) : debugInfo ? (
            <>
              {/* Usuário Atual */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Usuário Autenticado</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">ID:</span>
                    <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{debugInfo.currentUser.id}</code>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2">{debugInfo.currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Perfil */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Perfil (profiles)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <span className="ml-2">{debugInfo.profile.full_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Entity Role:</span>
                    <Badge className="ml-2" variant={debugInfo.profile.entity_role === 'admin' ? 'default' : 'secondary'}>
                      {debugInfo.profile.entity_role || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge className="ml-2" variant={debugInfo.profile.status === 'active' ? 'default' : 'destructive'}>
                      {debugInfo.profile.status || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Entity ID:</span>
                    <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                      {debugInfo.profile.entity_id || 'NULL'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Entidade */}
              {debugInfo.entity ? (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700">Entidade</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nome:</span>
                      <span className="ml-2">{debugInfo.entity.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{debugInfo.entity.id}</code>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Usuário não está associado a nenhuma entidade</AlertDescription>
                </Alert>
              )}

              {/* Permissões */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Verificação de Permissões</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">É Admin?</span>
                    {debugInfo.permissions.isAdmin ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tem Entity ID?</span>
                    {debugInfo.permissions.hasEntityId ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Está Ativo?</span>
                    {debugInfo.permissions.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-semibold">Pode Gerenciar Usuários?</span>
                    {debugInfo.permissions.canManageUsers ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Usuários da Entidade */}
              {debugInfo.entityUsers.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700">
                    Usuários da Entidade ({debugInfo.entityUsers.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {debugInfo.entityUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{u.full_name || u.email}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {u.entity_role === 'manager' ? 'Gerente' : 
                             u.entity_role === 'admin' ? 'Administrador' :
                             u.entity_role === 'user' ? 'Usuário' :
                             u.entity_role === 'viewer' ? 'Visualizador' :
                             u.entity_role}
                          </Badge>
                          <Badge variant={u.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                            {u.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnóstico */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 space-y-2">
                <h3 className="font-semibold text-sm text-blue-900">Diagnóstico</h3>
                {!debugInfo.permissions.canManageUsers ? (
                  <div className="space-y-2 text-sm text-blue-800">
                    <p className="font-medium">❌ Este usuário NÃO pode gerenciar outros usuários porque:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {!debugInfo.permissions.isAdmin && (
                        <li>O entity_role não é 'admin' (atual: {debugInfo.profile.entity_role})</li>
                      )}
                      {!debugInfo.permissions.hasEntityId && (
                        <li>Não possui entity_id associado</li>
                      )}
                      {!debugInfo.permissions.isActive && (
                        <li>O status não é 'active' (atual: {debugInfo.profile.status})</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Este usuário PODE gerenciar outros usuários
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Carregando informações...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
