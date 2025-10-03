"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle, AlertCircle, Loader2, User, Shield } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from "next/navigation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

interface EntityInvitation {
  id: string
  entity_id: string
  email: string
  role: 'user' | 'admin' | 'manager' | 'viewer'
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  token: string
  expires_at: string
  created_at: string
}

interface Entity {
  id: string
  name: string
  legal_name?: string
  email: string
}

const roleLabels = {
  user: 'Usuário',
  admin: 'Administrador',
  manager: 'Gerente',
  viewer: 'Visualizador'
}

const roleColors = {
  user: "bg-green-100 text-green-800",
  admin: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-800",
}

export default function EntityInvitationAccept({ token }: { token: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [invitation, setInvitation] = useState<EntityInvitation | null>(null)
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchInvitation()
  }, [token])

  const fetchInvitation = async () => {
    try {
      setLoading(true)
      
      // Buscar o convite pelo token
      const { data: invitationData, error: invitationError } = await supabase
        .from('entity_invitations')
        .select('*')
        .eq('token', token)
        .single()

      if (invitationError) {
        if (invitationError.code === 'PGRST116') {
          setError("Convite não encontrado ou inválido")
        } else {
          setError("Erro ao carregar convite")
        }
        return
      }

      // Verificar se o convite expirou
      if (new Date(invitationData.expires_at) < new Date()) {
        setError("Este convite expirou")
        return
      }

      // Verificar se o convite já foi aceito ou cancelado
      if (invitationData.status !== 'pending') {
        setError("Este convite já foi processado")
        return
      }

      setInvitation(invitationData)

      // Buscar dados da entidade
      const { data: entityData, error: entityError } = await supabase
        .from('entities')
        .select('id, name, legal_name, email')
        .eq('id', invitationData.entity_id)
        .single()

      if (entityError) {
        setError("Erro ao carregar dados da entidade")
        return
      }

      setEntity(entityData)
    } catch (err) {
      setError("Erro interno do servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user || !invitation || !entity) return

    try {
      setAccepting(true)

      // Verificar se o usuário já está em uma entidade
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      if (currentProfile?.entity_id) {
        setError("Você já está vinculado a uma entidade. Entre em contato com o suporte para mais informações.")
        return
      }

      // Atualizar o perfil do usuário para vincular à entidade
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          entity_id: entity.id,
          registration_type: 'entity_user',
          entity_role: invitation.role
        })
        .eq('id', user.id)

      if (profileError) {
        setError("Erro ao vincular à entidade")
        return
      }

      // Atualizar status do convite para aceito
      const { error: invitationError } = await supabase
        .from('entity_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      if (invitationError) {
        console.error('Erro ao atualizar convite:', invitationError)
        // Não falhar se apenas a atualização do convite falhar
      }

      setSuccess("Convite aceito com sucesso! Você agora faz parte da entidade.")
      
      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      setError("Erro ao aceitar convite")
    } finally {
      setAccepting(false)
    }
  }

  const handleDeclineInvitation = async () => {
    if (!invitation) return

    try {
      setAccepting(true)

      // Atualizar status do convite para cancelado
      const { error } = await supabase
        .from('entity_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitation.id)

      if (error) {
        setError("Erro ao cancelar convite")
        return
      }

      setSuccess("Convite recusado com sucesso.")
      
      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      setError("Erro ao recusar convite")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-600">Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/")} 
              className="w-full"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation || !entity) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Convite para Entidade</CardTitle>
          <CardDescription>
            Você foi convidado para participar de uma organização no TrackDoc
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Informações da Entidade */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-3">Informações da Entidade</h3>
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">Nome:</Label>
                <p className="text-gray-900">{entity.name}</p>
              </div>
              {entity.legal_name && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Razão Social:</Label>
                  <p className="text-gray-900">{entity.legal_name}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-700">Email:</Label>
                <p className="text-gray-900">{entity.email}</p>
              </div>
            </div>
          </div>

          {/* Informações do Convite */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Detalhes do Convite</h3>
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">Email Convidado:</Label>
                <p className="text-gray-900">{invitation.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Função:</Label>
                <div className="mt-1">
                  <Badge className={roleColors[invitation.role]}>
                    {roleLabels[invitation.role]}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Data do Convite:</Label>
                <p className="text-gray-900">
                  {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Expira em:</Label>
                <p className="text-gray-900">
                  {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="flex-1"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aceitando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aceitar Convite
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDeclineInvitation}
              disabled={accepting}
              className="flex-1"
            >
              Recusar Convite
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              Ao aceitar este convite, você será vinculado à entidade e terá acesso aos recursos compartilhados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
