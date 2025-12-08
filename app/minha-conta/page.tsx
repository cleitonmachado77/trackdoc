"use client"

import { useState, useEffect } from "react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useProfile } from "@/app/components/profile-context"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Key,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  MapPin,
  Briefcase,
  Clock,
  UserCheck,
  Settings,
  Lock,
  Camera,
  Upload,
  Trash2,
  Image,
  ArrowLeft,
  CreditCard
} from "lucide-react"
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  role: string | null
  status: string | null
  permissions: any
  avatar_url: string | null
  entity_id: string | null
  department_id: string | null
  position: string | null
  last_login: string | null
  registration_type: string | null
  entity_role: string | null
  registration_completed: boolean | null
  selected_plan_id: string | null
  created_at: string | null
  updated_at: string | null
  entity?: {
    name: string
    legal_name?: string
  }
  department?: {
    name: string
  }
}

interface MinhaContaPageProps {
  onBack?: () => void
}

export default function MinhaContaPage({ onBack }: MinhaContaPageProps = {}) {
  const { user } = useAuth()
  const { refreshProfile } = useProfile()
  const { toast } = useToast()

  // Estados para perfil
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estados para alteração de senha
  const [showPasswordForm, setShowPasswordForm] = useState(false)
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
  const [changingPassword, setChangingPassword] = useState(false)

  // Estados para edição do perfil
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({})

  // Estados para foto de perfil
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Carregar perfil do usuário
  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    }
  }, [user?.id])

  const fetchProfile = async () => {
    try {
      setLoading(true)

      // Buscar informações de autenticação do usuário
      const { data: { user: authUser } } = await supabase.auth.getUser()

      // Primeiro buscar o perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError) throw profileError

      // Atualizar last_login com o dado do auth se disponível
      if (authUser?.last_sign_in_at) {
        profileData.last_login = authUser.last_sign_in_at
      }

      // Depois buscar a entidade se existir
      let entityData = null
      if (profileData.entity_id) {
        const { data: entity, error: entityError } = await supabase
          .from('entities')
          .select('name, legal_name')
          .eq('id', profileData.entity_id)
          .single()

        if (!entityError) {
          entityData = entity
        }
      }

      // Buscar departamento se existir
      let departmentData = null
      if (profileData.department_id) {
        const { data: department, error: departmentError } = await supabase
          .from('departments')
          .select('name')
          .eq('id', profileData.department_id)
          .single()

        if (!departmentError) {
          departmentData = department
        }
      }

      // Combinar os dados
      const completeProfile = {
        ...profileData,
        entity: entityData,
        department: departmentData
      }

      // Debug logging para identificar o problema
      console.log('Dados do perfil carregados:', {
        id: completeProfile.id,
        full_name: completeProfile.full_name,
        entity_id: completeProfile.entity_id,
        entity: completeProfile.entity,
        entity_name: completeProfile.entity?.name,
        department: completeProfile.department
      })

      setProfile(completeProfile)
      setEditedProfile(completeProfile)
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error)
      toast({
        title: "Erro ao carregar perfil",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          phone: editedProfile.phone,
          company: editedProfile.company,
          position: editedProfile.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      setProfile({ ...profile!, ...editedProfile })
      setEditing(false)

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })

      // Atualizar o contexto global do perfil para refletir na sidebar
      console.log('🔄 Atualizando perfil na sidebar...')
      await refreshProfile()
      console.log('✅ Perfil atualizado na sidebar')
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro na confirmação",
        description: "A nova senha e a confirmação não coincidem.",
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

    try {
      setChangingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordForm(false)

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      })
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      })
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingAvatar(true)

      // Gerar nome único para o arquivo
      const fileExtension = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExtension}`
      const filePath = `${user?.id}/${fileName}`

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar perfil no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) throw updateError

      // Atualizar estado local
      setProfile({ ...profile!, avatar_url: publicUrl })
      setAvatarPreview(null)

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      })

      // Atualizar o contexto global do perfil para refletir na sidebar
      console.log('🔄 Atualizando foto na sidebar...')
      await refreshProfile()
      console.log('✅ Foto atualizada na sidebar')
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error)
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!profile?.avatar_url) return

    try {
      setUploadingAvatar(true)

      // Remover do banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) throw updateError

      // Tentar remover do storage (não é crítico se falhar)
      try {
        // Extrair o caminho completo do arquivo da URL
        const urlParts = profile.avatar_url.split('/avatars/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage
            .from('avatars')
            .remove([filePath])
        }
      } catch (storageError) {
        console.warn('Erro ao remover arquivo do storage:', storageError)
      }

      // Atualizar estado local
      setProfile({ ...profile, avatar_url: null })

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida com sucesso.",
      })

      // Atualizar o contexto global do perfil para refletir na sidebar
      console.log('🔄 Removendo foto da sidebar...')
      await refreshProfile()
      console.log('✅ Foto removida da sidebar')
    } catch (error: any) {
      console.error('Erro ao remover avatar:', error)
      toast({
        title: "Erro ao remover foto",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarPreview = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inativo</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Suspenso</Badge>
      default:
        return <Badge variant="outline">N/A</Badge>
    }
  }

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Administrador</Badge>
      case 'manager':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Gerente</Badge>
      case 'user':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Usuário</Badge>
      case 'viewer':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Visualizador</Badge>
      default:
        return <Badge variant="outline">N/A</Badge>
    }
  }

  const getUserRoleDescription = () => {
    // Priorizar entity_role se existir
    if (profile?.entity_role === 'admin') {
      return {
        badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Administrador da Entidade</Badge>,
        description: 'Você tem permissões administrativas completas na sua entidade'
      }
    }
    
    if (profile?.entity_role === 'manager') {
      return {
        badge: <Badge className="bg-orange-100 text-orange-800 border-orange-200">Gerente</Badge>,
        description: 'Você pode gerenciar documentos e usuários do seu departamento'
      }
    }
    
    if (profile?.entity_role === 'user') {
      return {
        badge: <Badge className="bg-gray-100 text-gray-800 border-gray-200">Usuário</Badge>,
        description: 'Você pode visualizar e gerenciar seus próprios documentos'
      }
    }

    // Fallback para role do sistema
    if (profile?.role === 'super_admin') {
      return {
        badge: <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Administrador</Badge>,
        description: 'Você tem acesso total ao sistema'
      }
    }

    if (profile?.role === 'admin') {
      return {
        badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Administrador</Badge>,
        description: 'Você tem permissões administrativas no sistema'
      }
    }

    // Verificar registration_type como último recurso
    if (profile?.registration_type === 'entity_admin') {
      return {
        badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Administrador da Entidade</Badge>,
        description: 'Você criou e administra esta entidade'
      }
    }

    if (profile?.registration_type === 'individual') {
      return {
        badge: <Badge className="bg-green-100 text-green-800 border-green-200">Usuário Individual</Badge>,
        description: 'Você usa o sistema de forma independente'
      }
    }

    return {
      badge: <Badge variant="outline">Usuário</Badge>,
      description: 'Acesso padrão ao sistema'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível carregar as informações do perfil.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-50">
      <div className="w-full p-6">
        <div className="mb-6 space-y-4">
          <Button
            variant="outline"
            onClick={onBack || (() => window.location.href = '/?view=admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-trackdoc-black">Minha Conta</h1>
            <p className="text-trackdoc-gray">Gerencie suas informações pessoais e configurações</p>
          </div>
        </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none [&[data-state=active]]:!bg-blue-600 [&[data-state=active]]:!text-white [&[data-state=active]]:hover:!bg-blue-600 [&[data-state=active]]:focus:!bg-blue-600"
          >
            <User className="h-4 w-4" />
            Informações Pessoais
          </TabsTrigger>
          <TabsTrigger 
            value="plan" 
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none [&[data-state=active]]:!bg-blue-600 [&[data-state=active]]:!text-white [&[data-state=active]]:hover:!bg-blue-600 [&[data-state=active]]:focus:!bg-blue-600"
          >
            <CreditCard className="h-4 w-4" />
            Plano
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none [&[data-state=active]]:!bg-blue-600 [&[data-state=active]]:!text-white [&[data-state=active]]:hover:!bg-blue-600 [&[data-state=active]]:focus:!bg-blue-600"
          >
            <Lock className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>
                Personalize seu perfil com uma foto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Avatar atual */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Controles */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={(e) => {
                        handleAvatarPreview(e)
                        handleAvatarUpload(e)
                      }}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                    <Button
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingAvatar}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {profile.avatar_url ? 'Alterar Foto' : 'Adicionar Foto'}
                    </Button>

                    {profile.avatar_url && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>• Formatos aceitos: JPG, PNG, GIF</p>
                    <p>• Tamanho máximo: 5MB</p>
                    <p>• Recomendado: 400x400 pixels</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Suas informações pessoais e de contato
                  </CardDescription>
                </div>
                <Button
                  variant={editing ? "outline" : "default"}
                  onClick={() => {
                    if (editing) {
                      setEditedProfile(profile)
                    }
                    setEditing(!editing)
                  }}
                  className="flex items-center gap-2"
                >
                  {editing ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Editar
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  {editing ? (
                    <Input
                      id="full_name"
                      value={editedProfile.full_name || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{profile.full_name || 'N/A'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{profile.email || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{profile.phone || 'N/A'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  {editing && !profile.entity_id ? (
                    <Input
                      id="company"
                      value={editedProfile.company || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, company: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>
                        {profile.entity?.name || 
                         profile.entity?.legal_name || 
                         profile.company || 
                         'N/A'}
                      </span>
                    </div>
                  )}
                  {profile.entity_id && (
                    <p className="text-xs text-muted-foreground">
                      Nome da entidade (não editável)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  {editing ? (
                    <Input
                      id="position"
                      value={editedProfile.position || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, position: e.target.value })}
                      placeholder="Seu cargo na empresa"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span>{profile.position || 'N/A'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Shield className="h-4 w-4 text-gray-500" />
                    {getStatusBadge(profile.status)}
                  </div>
                </div>
              </div>

              {editing && (
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
              <CardDescription>
                Informações sobre sua conta e permissões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Papel do Usuário - Destaque */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-base font-semibold text-blue-900">Seu Papel no Sistema</Label>
                    <div className="mt-2 flex items-center gap-2">
                      {getUserRoleDescription().badge}
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      {getUserRoleDescription().description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>
                      {profile.entity?.name || 
                       profile.entity?.legal_name || 
                       (profile.entity_id ? `Entidade ID: ${profile.entity_id}` : 'Usuário Individual')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{profile.department?.name || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Último Login</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(profile.last_login)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conta Criada</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(profile.created_at)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <SubscriptionManager userId={user?.id || ''} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Alteração de Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Mantenha sua conta segura alterando sua senha regularmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showPasswordForm ? (
                <div className="text-center py-6">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Clique no botão abaixo para alterar sua senha
                  </p>
                  <Button
                    onClick={() => setShowPasswordForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Alterar Senha
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Digite sua nova senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
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
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirme sua nova senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A senha deve ter pelo menos 6 caracteres.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="flex items-center gap-2"
                    >
                      {changingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Alterar Senha
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}