"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Plus, Users, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function EntitiesAdminPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userEntity, setUserEntity] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [entityForm, setEntityForm] = useState({
    name: "",
    legalName: "",
    cnpj: "",
    phone: "",
    description: ""
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError) {
        setError('Erro ao carregar perfil do usuário')
        return
      }

      setUserProfile(profile)

      // Se usuário tem entidade, buscar dados da entidade
      if (profile.entity_id) {
        const { data: entity, error: entityError } = await supabase
          .from('entities')
          .select('*')
          .eq('id', profile.entity_id)
          .single()

        if (!entityError) {
          setUserEntity(entity)
        }
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados do usuário')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!entityForm.name.trim()) {
      setError('Nome da entidade é obrigatório')
      return
    }

    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      // Buscar plano padrão
      const { data: plans } = await supabase
        .from('plans')
        .select('id')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })
        .limit(1)

      const planId = plans?.[0]?.id

      // Criar entidade
      const { data: newEntity, error: entityError } = await supabase
        .from('entities')
        .insert([{
          name: entityForm.name,
          legal_name: entityForm.legalName || entityForm.name,
          cnpj: entityForm.cnpj || null,
          email: user?.email,
          phone: entityForm.phone || null,
          description: entityForm.description || null,
          subscription_plan_id: planId,
          max_users: 10,
          admin_user_id: user?.id,
          status: 'active',
          type: 'company'
        }])
        .select()
        .single()

      if (entityError) {
        setError(`Erro ao criar entidade: ${entityError.message}`)
        return
      }

      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          entity_id: newEntity.id,
          entity_role: 'admin',
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (profileError) {
        setError(`Erro ao atualizar perfil: ${profileError.message}`)
        return
      }

      // Criar assinatura trial
      if (planId) {
        await supabase
          .from('entity_subscriptions')
          .insert([{
            entity_id: newEntity.id,
            plan_id: planId,
            status: 'active',
            is_trial: true,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }])
      }

      setSuccess(`Entidade "${newEntity.name}" criada com sucesso! Você agora é o administrador.`)
      setShowCreateForm(false)
      setEntityForm({ name: "", legalName: "", cnpj: "", phone: "", description: "" })
      
      // Recarregar dados
      await loadUserData()

    } catch (err) {
      console.error('Erro ao criar entidade:', err)
      setError('Erro interno do servidor. Tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administração de Entidades</h1>
        <p className="text-gray-600">Gerencie sua organização e configurações</p>
      </div>

      {/* Status atual do usuário */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seu Status Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Nome</Label>
              <p className="text-lg font-semibold">{userProfile?.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-lg">{userProfile?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Tipo de Conta</Label>
              <p className="text-lg">
                {userEntity ? (
                  <span className="text-green-600 font-semibold">Administrador de Entidade</span>
                ) : (
                  <span className="text-blue-600">Usuário Individual</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Se usuário já tem entidade */}
      {userEntity ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              Sua Entidade
            </CardTitle>
            <CardDescription>
              Você é o administrador desta entidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome da Entidade</Label>
                  <p className="text-xl font-semibold">{userEntity.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Razão Social</Label>
                  <p className="text-lg">{userEntity.legal_name || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                  <p className="text-lg">{userEntity.cnpj || 'Não informado'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-lg">{userEntity.phone || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className="text-lg">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Ativa
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criada em</Label>
                  <p className="text-lg">
                    {new Date(userEntity.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button variant="outline" className="mr-3">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Usuários
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Se usuário não tem entidade */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Criar Nova Entidade
            </CardTitle>
            <CardDescription>
              Crie sua organização e torne-se o administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCreateForm ? (
              <div className="text-center py-8">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Você ainda não possui uma entidade
                </h3>
                <p className="text-gray-600 mb-6">
                  Crie sua organização para gerenciar usuários, documentos e configurações
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Entidade
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateEntity} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Entidade *</Label>
                    <Input
                      id="name"
                      value={entityForm.name}
                      onChange={(e) => setEntityForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Minha Empresa Ltda"
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="legalName">Razão Social</Label>
                    <Input
                      id="legalName"
                      value={entityForm.legalName}
                      onChange={(e) => setEntityForm(prev => ({ ...prev, legalName: e.target.value }))}
                      placeholder="Ex: Minha Empresa Limitada"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={entityForm.cnpj}
                      onChange={(e) => setEntityForm(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={entityForm.phone}
                      onChange={(e) => setEntityForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={entityForm.description}
                    onChange={(e) => setEntityForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição da entidade"
                    disabled={isCreating}
                  />
                </div>

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

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 mr-2" />
                        Criar Entidade
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'