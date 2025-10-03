"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserProfile, usePlans } from "@/hooks/use-database-data"
import { useUserSubscription } from "@/hooks/use-subscriptions"
import { useAccessStatus } from "@/hooks/use-access-status"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import AvatarUpload from "../components/avatar-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  CreditCard, 
  Shield, 
  Settings, 
  Key, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Crown,
  Zap,
  Loader2,
  Edit,
  Save,
  X,
  Eye,
  EyeOff
} from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MinhaContaPage() {
  const { user, updatePassword } = useAuth()
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user?.id)
  const { plans, loading: plansLoading } = usePlans()
  const { subscription, loading: subscriptionLoading } = useUserSubscription()
  const { accessStatus, loading: accessLoading } = useAccessStatus()
  const { toast } = useToast()

  // Estados para edição de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    position: ''
  })

  // Estados para alteração de senha
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Estados de loading
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPasswordLoading, setIsChangingPasswordLoading] = useState(false)
  
  // Estado para avatar
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)

  // Carregar dados do perfil quando disponível
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        role: profile.role || '',
        department: profile.department || '',
        position: profile.position || ''
      })
      setCurrentAvatarUrl(profile.avatar_url)
    }
  }, [profile])

  // Função para salvar perfil usando API
  const handleSaveProfile = async () => {
    if (!user?.id) return

    setIsSavingProfile(true)
    try {
      console.log('🔍 [MinhaConta] Iniciando atualização do perfil via API...')
      console.log('👤 [MinhaConta] User ID:', user.id)
      console.log('📝 [MinhaConta] Dados a serem atualizados:', {
        full_name: profileData.full_name,
        phone: profileData.phone,
        company: profileData.company,
        role: profileData.role
      })

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          phone: profileData.phone,
          role: profileData.role,
          department: profileData.department,
          position: profileData.position
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição')
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar perfil')
      }

      console.log('✅ [MinhaConta] Perfil atualizado com sucesso via API:', result.profile)

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      })

      setIsEditingProfile(false)
    } catch (error: any) {
      console.error('❌ [MinhaConta] Erro ao atualizar perfil:', error)
      
      let errorMessage = "Não foi possível salvar suas informações. Tente novamente."
      
      if (error.message?.includes('permission denied')) {
        errorMessage = "Você não tem permissão para atualizar este perfil."
      } else if (error.message?.includes('not found')) {
        errorMessage = "Perfil não encontrado. Entre em contato com o suporte."
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = "Já existe um perfil com essas informações."
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }

      toast({
        title: "Erro ao atualizar perfil",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Função para alterar senha
  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos de senha.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação não são iguais.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPasswordLoading(true)
    try {
      await updatePassword(passwordData.newPassword)
      
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      })

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setIsChangingPassword(false)
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast({
        title: "Erro ao alterar senha",
        description: "Não foi possível alterar sua senha. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPasswordLoading(false)
    }
  }

  // Função para cancelar edição
  const handleCancelEdit = () => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        role: profile.role || '',
        department: profile.department || '',
        position: profile.position || ''
      })
    }
    setIsEditingProfile(false)
  }

  // Função para cancelar alteração de senha
  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setIsChangingPassword(false)
  }

  if (profileLoading || subscriptionLoading || accessLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(217 91% 92% / 0.3)' }}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando informações da conta...</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: 'hsl(217 91% 92% / 0.3)',
        backgroundImage: 'none'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minha Conta</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais, plano de assinatura e configurações de segurança</p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
            <TabsTrigger value="perfil" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              <Crown className="h-4 w-4" />
              Plano
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Aba Perfil */}
          <TabsContent value="perfil" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-transparent border-b border-blue-200/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <User className="h-6 w-6 text-blue-600" />
                      Informações Pessoais
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Gerencie suas informações de perfil e dados de contato
                    </CardDescription>
                  </div>
                  {!isEditingProfile ? (
                    <Button 
                      onClick={() => setIsEditingProfile(true)} 
                      variant="outline" 
                      size="sm"
                      className="bg-white/80 hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={isSavingProfile} 
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-800 text-white shadow-sm"
                      >
                        {isSavingProfile ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                      <Button 
                        onClick={handleCancelEdit} 
                        variant="outline" 
                        size="sm"
                        className="bg-white/80 hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 shadow-sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar e informações básicas */}
                <div className="flex items-start gap-6">
                  <AvatarUpload
                    currentAvatarUrl={currentAvatarUrl}
                    userName={profile?.full_name}
                    onAvatarChange={setCurrentAvatarUrl}
                    size="xl"
                    showUploadButton={true}
                  />
                  <div className="flex-1 pt-4">
                    <h3 className="text-xl font-semibold">{profile?.full_name || 'Usuário'}</h3>
                    <p className="text-gray-600">{profile?.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {profile?.role || 'Usuário'}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      Clique na câmera para alterar sua foto de perfil
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Formulário de edição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!isEditingProfile}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">O email não pode ser alterado</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <select
                      id="role"
                      value={profileData.role}
                      onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                      disabled={!isEditingProfile}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                      <option value="manager">Gerente</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Seu departamento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Posição</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Sua posição na empresa"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Plano */}
          <TabsContent value="plano" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-transparent border-b border-yellow-200/30">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Crown className="h-6 w-6 text-yellow-600" />
                  Plano Atual
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Informações sobre seu plano de assinatura atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <Crown className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{subscription.plan?.name}</h3>
                          <p className="text-gray-600">{subscription.plan?.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          R$ {subscription.plan?.price_monthly}
                        </div>
                        <div className="text-sm text-gray-500">por mês</div>
                      </div>
                    </div>

                    {/* Status da assinatura */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Status</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Próxima Cobrança</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">Recursos</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {subscription.plan?.features?.length || 0} recursos incluídos
                        </p>
                      </div>
                    </div>

                    {/* Features do plano */}
                    {subscription.plan?.features && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Recursos Incluídos:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {subscription.plan.features.map((feature: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Gerenciar Pagamento
                      </Button>
                      <Button variant="outline">
                        <Crown className="h-4 w-4 mr-2" />
                        Alterar Plano
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você não possui um plano ativo. <Button variant="link" className="p-0 h-auto">Escolha um plano</Button> para ter acesso a todos os recursos.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Segurança */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-transparent border-b border-green-200/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Shield className="h-6 w-6 text-green-600" />
                      Segurança da Conta
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Gerencie sua senha e configurações de segurança
                    </CardDescription>
                  </div>
                  {!isChangingPassword && (
                    <Button 
                      onClick={() => setIsChangingPassword(true)} 
                      variant="outline" 
                      size="sm"
                      className="bg-white/80 hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 shadow-sm"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isChangingPassword ? (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium">Alterar Senha</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleChangePassword} 
                        disabled={isChangingPasswordLoading}
                        className="flex-1"
                      >
                        {isChangingPasswordLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Nova Senha
                      </Button>
                      <Button onClick={handleCancelPasswordChange} variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Senha da Conta</h4>
                          <p className="text-sm text-gray-600">Última alteração há mais de 30 dias</p>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Recomendado alterar
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Autenticação de Dois Fatores</h4>
                          <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Em breve
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Configurações */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-transparent border-b border-purple-200/30">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Settings className="h-6 w-6 text-purple-600" />
                  Configurações da Conta
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Personalize sua experiência no TrackDoc
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações por Email</h4>
                        <p className="text-sm text-gray-600">Receba atualizações sobre seus documentos</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Configurar
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Tema da Interface</h4>
                        <p className="text-sm text-gray-600">Personalize a aparência do sistema</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Em breve
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Idioma</h4>
                        <p className="text-sm text-gray-600">Português (Brasil)</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Alterar
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">Zona Perigosa</h4>
                      <p className="text-sm text-red-600">Ações irreversíveis para sua conta</p>
                    </div>
                    <Button variant="destructive" size="sm" disabled>
                      Excluir Conta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
