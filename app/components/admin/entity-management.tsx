"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Plus, 
  Users, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserPlus
} from 'lucide-react'
import EntityUserManagement from './entity-user-management'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EntityData {
  id: string
  name: string
  legal_name?: string
  cnpj?: string
  email: string
  phone?: string
  description?: string
  status: string
  created_at: string
  admin_user_id?: string
  max_users: number
  current_users?: number
}

export default function EntityManagement() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userEntity, setUserEntity] = useState<EntityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  
  const [entityForm, setEntityForm] = useState({
    name: "",
    legalName: "",
    cnpj: "",
    phone: "",
    description: ""
  })

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
          // Contar usuários atuais da entidade
          const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('entity_id', entity.id)
            .eq('status', 'active')

          setUserEntity({
            ...entity,
            current_users: userCount || 0
          })
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
          registration_type: 'entity_admin',
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Administração de Entidades</h2>
          <p className="text-gray-600">Gerencie sua organização, usuários e configurações</p>
        </div>
      </div>

      {/* Status atual do usuário */}
      <Card>
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
                  <Badge className="bg-green-100 text-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrador de Entidade
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800">
                    Usuário Individual
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Se usuário já tem entidade */}
      {userEntity ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Informações da Entidade
                </CardTitle>
                <CardDescription>
                  Dados da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Nome da Entidade</Label>
                        <p className="text-xl font-semibold">{userEntity.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Razão Social</Label>
                        <p className="text-lg">{userEntity.legal_name || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                        <p className="text-lg">{userEntity.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                        <p className="text-lg">{userEntity.phone || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Usuários</Label>
                        <p className="text-lg">{userEntity.current_users || 0} / {userEntity.max_users}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Criada em</Label>
                        <p className="text-lg">
                          {new Date(userEntity.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {userEntity.description && (
                  <div className="mt-6 pt-6 border-t">
                    <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                    <p className="text-lg mt-1">{userEntity.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-semibold text-green-600">Ativa</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Usuários Ativos</p>
                      <p className="text-2xl font-bold mt-1">{userEntity.current_users || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Limite de Usuários</p>
                      <p className="text-2xl font-bold mt-1">{userEntity.max_users}</p>
                    </div>
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <EntityUserManagement />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações da Entidade
                </CardTitle>
                <CardDescription>
                  Gerencie as configurações da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      As configurações avançadas da entidade estarão disponíveis em breve.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" disabled>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações Gerais
                    </Button>
                    <Button variant="outline" disabled>
                      <Shield className="h-4 w-4 mr-2" />
                      Permissões
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
                  Crie sua organização para gerenciar usuários, documentos e configurações de forma centralizada
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