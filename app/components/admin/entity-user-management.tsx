"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Send,
  Clock,
  Key,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import { checkSimpleEntityAdminStatus } from "@/lib/simple-entity-admin-utils"

// Componente para criar entidade quando o usuário não tem uma
function CreateEntityInterface({ onEntityCreated }: { onEntityCreated: () => void }) {
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    cnpj: '',
    email: '',
    type: 'company' as 'company' | 'organization' | 'individual',
    description: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Brasil'
    }
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !formData.name.trim() || !formData.email.trim()) return

    setIsCreating(true)
    setError('')
    setSuccess('')

    try {
      // Preparar endereço como JSONB
      const addressData = formData.address.street.trim() ? {
        street: formData.address.street.trim(),
        city: formData.address.city.trim(),
        state: formData.address.state.trim(),
        zip_code: formData.address.zip_code.trim(),
        country: formData.address.country
      } : null

      // Criar a entidade
      const { data: entityData, error: entityError } = await supabase
        .from('entities')
        .insert([{
          name: formData.name.trim(),
          legal_name: formData.legal_name.trim() || null,
          cnpj: formData.cnpj.trim() || null,
          email: formData.email.trim(),
          type: formData.type,
          description: formData.description.trim() || null,
          phone: formData.phone.trim() || null,
          address: addressData,
          admin_user_id: user.id,
          status: 'active',
          max_users: 5,
          current_users: 1
        }])
        .select()
        .single()

      if (entityError) throw entityError

      // Atualizar o perfil do usuário para associá-lo à entidade
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          entity_id: entityData.id,
          entity_role: 'admin',
          registration_type: 'entity_admin'
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      setSuccess('Entidade criada com sucesso! Redirecionando...')
      setTimeout(() => {
        onEntityCreated()
      }, 2000)

    } catch (err) {
      console.error('Erro ao criar entidade:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar entidade')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Entidade</h1>
        <p className="text-gray-600">
          Você ainda não possui uma entidade. Crie uma para gerenciar usuários e documentos.
        </p>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateEntity} className="space-y-4">
            {/* Nome da Entidade */}
            <div>
              <Label htmlFor="name">Nome da Entidade *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Minha Empresa"
                required
                disabled={isCreating}
              />
            </div>

            {/* Razão Social */}
            <div>
              <Label htmlFor="legal_name">Razão Social</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
                placeholder="Ex: Minha Empresa Ltda"
                disabled={isCreating}
              />
            </div>

            {/* CNPJ */}
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
                disabled={isCreating}
              />
            </div>

            {/* Email da Entidade */}
            <div>
              <Label htmlFor="email">Email da Entidade *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contato@minhaempresa.com"
                required
                disabled={isCreating}
              />
            </div>

            {/* Tipo */}
            <div>
              <Label htmlFor="type">Tipo de Entidade</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="organization">Organização</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Telefone */}
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                disabled={isCreating}
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva brevemente sua entidade..."
                disabled={isCreating}
              />
            </div>

            {/* Endereço Estruturado */}
            <div className="space-y-3">
              <Label>Endereço</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Rua e número"
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  disabled={isCreating}
                />
                <Input
                  placeholder="Cidade"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  disabled={isCreating}
                />
                <Input
                  placeholder="Estado"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  disabled={isCreating}
                />
                <Input
                  placeholder="CEP"
                  value={formData.address.zip_code}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, zip_code: e.target.value }
                  }))}
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Mensagens */}
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

            {/* Botão */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isCreating || !formData.name.trim() || !formData.email.trim()}
            >
              {isCreating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Criando Entidade...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Criar Entidade
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">O que acontece após criar a entidade?</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Você se tornará o administrador da entidade</li>
                <li>• Poderá convidar e gerenciar outros usuários</li>
                <li>• Terá acesso completo aos recursos de gestão</li>
                <li>• Poderá criar departamentos e definir permissões</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

interface EntityUser {
  id: string
  invitation_id?: string // Para convites pendentes
  full_name: string | null
  email: string | null
  entity_role: 'user' | 'admin' | 'manager' | 'viewer'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  created_at: string
  last_login?: string | null
  phone?: string | null
  department_id?: string | null  // UUID, não texto
  position?: string | null
  invitation_token?: string // Para convites pendentes
  expires_at?: string // Para convites pendentes
  password?: string // Para aprovação
  invited_by?: string // Quem convidou
}

// Função para gerar iniciais do nome completo
const getInitials = (fullName: string) => {
  const names = fullName.trim().split(" ")
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

const roleColors = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  user: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800",
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
  suspended: "bg-yellow-100 text-yellow-800",
  pending: "bg-orange-100 text-orange-800",
}

const roleLabels = {
  admin: "Administrador",
  manager: "Gerente",
  user: "Usuario",
  viewer: "Visualizador",
}

const roleDescriptions = {
  admin: "Acesso completo ao sistema, pode gerenciar usuários, configurações e todas as funcionalidades da entidade.",
  manager: "Pode gerenciar documentos e usuários da sua área, com permissões administrativas limitadas.",
  user: "Acesso padrão para criar, editar e visualizar documentos dentro das suas permissões.",
  viewer: "Acesso somente leitura, pode visualizar documentos mas não pode criar ou editar.",
}

export default function EntityUserManagement() {
  const { user } = useAuth()
  const [entityUsers, setEntityUsers] = useState<EntityUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<EntityUser | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<EntityUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<EntityUser | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // Formulario para novo usuario
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    entity_id: "",
    entity_role: "user" as 'user' | 'admin' | 'manager' | 'viewer',
    phone: "",
    position: ""
  })

  // Lista de entidades disponíveis para o usuário logado
  const [availableEntities, setAvailableEntities] = useState<Array<{id: string, name: string}>>([])
  const [loadingEntities, setLoadingEntities] = useState(false)
  
  // Informações da entidade do usuário
  const [entityInfo, setEntityInfo] = useState<{
    id: string
    name: string
    legal_name: string | null
    email: string
    type: string
    current_users: number
    created_at: string
  } | null>(null)

  const fetchEntityUsers = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError('')
      
      console.log('🔍 [fetchEntityUsers] Buscando usuários da entidade para:', user.id)
      
      // Primeiro buscar o entity_id do perfil do usuário logado
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id, entity_role')
        .eq('id', user.id)
        .single()

      console.log('📊 [fetchEntityUsers] Perfil do usuário:', profileData)

      if (profileError) {
        console.error('❌ [fetchEntityUsers] Erro ao buscar perfil:', profileError)
        setError('Erro ao verificar perfil do usuário')
        return
      }

      if (!profileData?.entity_id) {
        console.log('⚠️ [fetchEntityUsers] Usuário não está associado a uma entidade')
        setError('Usuário não está associado a uma entidade')
        return
      }

      // Buscar todos os usuários da entidade
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          email, 
          entity_role, 
          status, 
          created_at,
          last_login,
          phone,
          department_id,
          position
        `)
        .eq('entity_id', profileData.entity_id)
        .order('created_at', { ascending: false })

      console.log('👥 [fetchEntityUsers] Usuários encontrados:', data?.length || 0)

      if (error) {
        console.error('❌ [fetchEntityUsers] Erro ao buscar usuários:', error)
        throw error
      }

      // Buscar também convites pendentes
      const { data: invitations } = await supabase
        .from('entity_invitations')
        .select('*')
        .eq('entity_id', profileData.entity_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      console.log('📨 [fetchEntityUsers] Convites pendentes:', invitations?.length || 0)

      // Converter convites em formato de usuário para exibição
      const pendingUsers = (invitations || []).map(invitation => {
        const messageData = invitation.message ? JSON.parse(invitation.message) : {}
        return {
          id: `invitation-${invitation.id}`,
          invitation_id: invitation.id,
          full_name: messageData.full_name || 'Usuário Convidado',
          email: invitation.email,
          entity_role: invitation.entity_role || invitation.role,
          status: 'pending' as const,
          created_at: invitation.created_at,
          last_login: null,
          phone: messageData.phone || null,
          department_id: null,
          position: messageData.position || null,
          invitation_token: invitation.token,
          expires_at: invitation.expires_at,
          password: messageData.password, // Para aprovação
          invited_by: invitation.invited_by
        }
      })

      // Combinar usuários reais com convites pendentes
      const allUsers = [...(data || []), ...pendingUsers]
      setEntityUsers(allUsers)
      
      console.log('✅ [fetchEntityUsers] Usuários e convites carregados:', allUsers.length)
      
    } catch (err) {
      console.error('❌ [fetchEntityUsers] Erro geral:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  // Função para aprovar convite e criar usuário real
  const approveInvitation = async (invitation: EntityUser) => {
    if (!user?.id || !invitation.invitation_id) return

    try {
      setError('')
      setIsCreatingUser(true)
      console.log('🔍 [approveInvitation] Aprovando convite:', invitation.email)

      // Primeiro buscar dados completos do convite
      const { data: invitationData, error: fetchError } = await supabase
        .from('entity_invitations')
        .select('*')
        .eq('id', invitation.invitation_id)
        .single()

      if (fetchError || !invitationData) {
        console.error('❌ [approveInvitation] Erro ao buscar convite:', fetchError)
        setError('Erro ao buscar dados do convite')
        return
      }

      console.log('📋 [approveInvitation] Dados do convite:', invitationData)

      // Extrair dados do message
      const messageData = invitationData.message ? JSON.parse(invitationData.message) : {}
      
      console.log('🚀 [approveInvitation] Criando usuário real...')

      // Criar usuário real usando a API de registro do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitationData.email,
        password: messageData.password,
        options: {
          data: {
            full_name: messageData.full_name,
            entity_id: invitationData.entity_id,
            entity_role: invitationData.entity_role,
            phone: messageData.phone,
            position: messageData.position,
            created_by_admin: true,
            registration_type: 'entity_user'
          }
        }
      })

      if (authError) {
        console.error('❌ [approveInvitation] Erro ao criar usuário:', authError)
        setError(`Erro ao aprovar convite: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError('Erro: Usuário não foi criado corretamente')
        return
      }

      console.log('✅ [approveInvitation] Usuário criado no auth:', authData.user.id)

      // Aguardar trigger criar o perfil
      console.log('⏳ [approveInvitation] Aguardando trigger criar perfil...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verificar se perfil foi criado pelo trigger
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!profileCheck) {
        console.log('⚠️ [approveInvitation] Perfil não foi criado pelo trigger, criando com políticas RLS...')
        
        // Criar perfil usando as políticas RLS atualizadas
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            full_name: messageData.full_name,
            email: invitationData.email,
            entity_id: invitationData.entity_id,
            entity_role: invitationData.entity_role,
            phone: messageData.phone,
            position: messageData.position,
            registration_type: 'entity_user',
            registration_completed: true,
            status: 'active',
            role: 'user',
            permissions: ['read', 'write']
          }])

        if (insertError) {
          console.error('❌ [approveInvitation] Erro ao criar perfil:', insertError)
          setError(`Erro ao criar perfil: ${insertError.message}`)
          return
        }
        
        console.log('✅ [approveInvitation] Perfil criado com políticas RLS')
      } else {
        console.log('✅ [approveInvitation] Perfil já existe, atualizando...')
        
        // Atualizar perfil existente com dados da entidade
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: messageData.full_name,
            entity_id: invitationData.entity_id,
            entity_role: invitationData.entity_role,
            phone: messageData.phone,
            position: messageData.position,
            registration_type: 'entity_user',
            registration_completed: true,
            status: 'active'
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('❌ [approveInvitation] Erro ao atualizar perfil:', updateError)
          setError(`Erro ao atualizar perfil: ${updateError.message}`)
          return
        }
        
        console.log('✅ [approveInvitation] Perfil atualizado com políticas RLS')
      }

      // Marcar convite como aceito
      const { error: acceptError } = await supabase
        .from('entity_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.invitation_id)

      if (acceptError) {
        console.error('❌ [approveInvitation] Erro ao marcar convite como aceito:', acceptError)
        // Não falhar aqui, o usuário foi criado
      }

      // Atualizar contador de usuários na entidade
      const { data: entityData } = await supabase
        .from('entities')
        .select('current_users')
        .eq('id', invitationData.entity_id)
        .single()

      if (entityData) {
        await supabase
          .from('entities')
          .update({ 
            current_users: (entityData.current_users || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', invitationData.entity_id)
      }

      console.log('✅ [approveInvitation] Convite aprovado com sucesso!')
      
      setSuccess(`✅ Convite aprovado com sucesso!

👤 Usuário: ${messageData.full_name}
📧 Email: ${invitationData.email}
🔑 Senha: ${messageData.password}
🆔 ID: ${authData.user.id}
🎯 Status: Ativo e pronto para login

O usuário já pode fazer login no sistema.`)

      // Recarregar lista
      await fetchEntityUsers()

    } catch (err) {
      console.error('❌ [approveInvitation] Erro geral:', err)
      setError('Erro interno do servidor. Tente novamente.')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const createUser = async (userData: {
    full_name: string
    email: string
    password: string
    entity_id: string
    entity_role: 'user' | 'admin' | 'manager' | 'viewer'
    phone?: string
    position?: string
  }) => {
    if (!user?.id) return

    try {
      setError('')
      setIsCreatingUser(true)
      console.log('🔍 [createUser] Iniciando criação de usuário virtual:', userData.email)

      // Validações básicas
      if (!userData.full_name.trim()) {
        setError('Nome completo é obrigatório')
        return
      }

      if (!userData.email.trim()) {
        setError('Email é obrigatório')
        return
      }

      if (!userData.password.trim()) {
        setError('Senha é obrigatória')
        return
      }

      if (userData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return
      }

      if (!userData.entity_id) {
        setError('Selecione uma entidade')
        return
      }

      console.log('🔍 [createUser] Verificando se email já existe...')

      // Verificar se email já existe na tabela profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', userData.email.trim().toLowerCase())
        .maybeSingle()

      if (existingProfile) {
        setError('Este email já está cadastrado no sistema')
        return
      }

      // Verificar se email já existe na tabela auth.users (via RPC se disponível)
      try {
        const { data: existingAuth } = await supabase.auth.getUser()
        // Não podemos verificar diretamente outros usuários sem API admin
        // Vamos confiar na verificação da tabela profiles
      } catch (authCheckError) {
        console.log('⚠️ [createUser] Não foi possível verificar auth.users, continuando...')
      }

      console.log('🚀 [createUser] Criando convite para aprovação...')

      // Gerar token único para o convite
      const invitationToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // Expira em 30 dias
      
      // Criar convite na tabela entity_invitations
      const { error: invitationError } = await supabase
        .from('entity_invitations')
        .insert([{
          entity_id: userData.entity_id,
          email: userData.email.trim().toLowerCase(),
          role: userData.entity_role,
          status: 'pending',
          invited_by: user.id,
          token: invitationToken,
          expires_at: expiresAt.toISOString(),
          entity_role: userData.entity_role,
          message: JSON.stringify({
            full_name: userData.full_name.trim(),
            password: userData.password,
            phone: userData.phone?.trim() || null,
            position: userData.position?.trim() || null,
            created_by_admin: true
          })
        }])

      if (invitationError) {
        console.error('❌ [createUser] Erro ao criar convite:', invitationError)
        setError(`Erro ao criar convite: ${invitationError.message}`)
        return
      }

      console.log('✅ [createUser] Convite criado com sucesso!')

      console.log('✅ [createUser] Processo concluído!')
      
      setSuccess(`✅ Convite de usuário criado com sucesso!

📧 Email: ${userData.email.trim().toLowerCase()}
🔑 Senha: ${userData.password}
👤 Cargo: ${userData.entity_role}
🏢 Entidade: ${availableEntities.find(e => e.id === userData.entity_id)?.name}
🎫 Token: ${invitationToken}

⏳ AGUARDANDO APROVAÇÃO:
- O convite aparecerá na lista com status "Pendente"
- Clique em "Aprovar" para criar o usuário real
- Após aprovação, o usuário poderá fazer login
- Convite expira em 30 dias

🎯 O convite aparecerá na lista para aprovação.`)
      
      setShowCreateModal(false)
      
      // Limpar formulário
      setFormData({
        full_name: "",
        email: "",
        password: "",
        entity_id: availableEntities.length === 1 ? availableEntities[0].id : "",
        entity_role: "user",
        phone: "",
        position: ""
      })
      
      // Recarregar lista de usuários
      await fetchEntityUsers()
      
    } catch (err) {
      console.error('❌ [createUser] Erro geral:', err)
      setError('Erro interno do servidor. Tente novamente.')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: {
          user_id: userId,
          new_password: newPassword,
          send_email: true
        }
      })

      if (error) {
        console.error('Erro na Edge Function:', error)
        setError('Erro ao atualizar senha. Tente novamente.')
        return
      }

      if (data.error) {
        setError(data.error)
        return
      }

      setSuccess('Senha atualizada com sucesso! Email foi enviado para o usuário.')
      setShowPasswordModal(false)
      setSelectedUserForPassword(null)
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error('Erro ao atualizar senha:', err)
      setError('Erro interno do servidor. Tente novamente.')
    }
  }

  const handleSaveUser = async (userData: EntityUser) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          entity_role: userData.entity_role,
          status: userData.status,
          phone: userData.phone,
          position: userData.position
        })
        .eq('id', userData.id)

      if (error) throw error

      setEntityUsers(prev => prev.map(user => 
        user.id === userData.id 
          ? { ...user, ...userData }
          : user
      ))
      
      setSuccess('Usuario atualizado com sucesso!')
      setShowUserModal(false)
      setSelectedUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuario')
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      // Remover usuario da entidade (nao deletar do sistema)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          entity_id: null,
          entity_role: null,
          status: 'suspended'
        })
        .eq('id', userToDelete.id)

      if (error) throw error

      setEntityUsers(prev => prev.filter(user => user.id !== userToDelete.id))
      
      setShowDeleteConfirm(false)
      setUserToDelete(null)
      setSuccess('Usuario removido da entidade com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover usuario')
    }
  }

  const filteredUsers = entityUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = (user?.full_name || '').toLowerCase()
    const email = (user?.email || '').toLowerCase()
    
    return fullName.includes(searchLower) || email.includes(searchLower)
  })

  const stats = {
    total: entityUsers.length,
    active: entityUsers.filter(user => user.status === 'active').length,
    admins: entityUsers.filter(user => user.entity_role === 'admin').length,
  }

  // Verificar se as senhas coincidem
  const passwordsMatch = newPassword === confirmPassword
  const canUpdatePassword = newPassword && confirmPassword && passwordsMatch

  // Buscar entidades disponíveis para o usuário logado
  const fetchAvailableEntities = async () => {
    if (!user?.id) return

    try {
      setLoadingEntities(true)
      console.log('🔍 [fetchAvailableEntities] Buscando entidades para:', user.id)

      // Buscar entidades onde o usuário é admin
      const { data: entities, error } = await supabase
        .from('entities')
        .select('id, name')
        .eq('admin_user_id', user.id)
        .eq('status', 'active')

      if (error) {
        console.error('❌ [fetchAvailableEntities] Erro:', error)
        return
      }

      console.log('📊 [fetchAvailableEntities] Entidades encontradas:', entities)
      setAvailableEntities(entities || [])

      // Se há apenas uma entidade, selecionar automaticamente
      if (entities && entities.length === 1) {
        setFormData(prev => ({ ...prev, entity_id: entities[0].id }))
      }

    } catch (err) {
      console.error('❌ [fetchAvailableEntities] Erro geral:', err)
    } finally {
      setLoadingEntities(false)
    }
  }

  useEffect(() => {
    fetchEntityUsers()
    fetchAvailableEntities()
  }, [user?.id])

  // Limpar mensagens apos 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Verificar se o usuário é admin de uma entidade
  const [isEntityAdmin, setIsEntityAdmin] = useState(false)
  const [userEntityId, setUserEntityId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const checkEntityAdmin = async () => {
      if (!user?.id) {
        setDebugInfo('Usuário não logado')
        return
      }

      try {
        setDebugInfo('Verificando perfil do usuário...')
        console.log('🔍 [EntityUserManagement] Verificando admin de entidade para usuário:', user.id)
        
        // Verificação simples direta no banco
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('entity_id, entity_role, full_name, email')
          .eq('id', user.id)
          .single()

        console.log('📊 [EntityUserManagement] Perfil encontrado:', profileData)
        
        if (profileError) {
          setDebugInfo(`Erro ao buscar perfil: ${profileError.message}`)
          console.error('❌ Erro ao buscar perfil:', profileError)
          return
        }

        if (!profileData) {
          setDebugInfo('Perfil não encontrado')
          return
        }

        if (profileData.entity_id) {
          setIsEntityAdmin(true)
          setUserEntityId(profileData.entity_id)
          
          // Buscar informações completas da entidade
          const { data: entityData, error: entityError } = await supabase
            .from('entities')
            .select('id, name, legal_name, email, type, current_users, created_at')
            .eq('id', profileData.entity_id)
            .single()

          if (entityData && !entityError) {
            setEntityInfo(entityData)
          }
        } else {
          setIsEntityAdmin(false)
        }

      } catch (err) {
        console.error('❌ [EntityUserManagement] Erro geral:', err)
        setDebugInfo(`Erro geral: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      }
    }

    checkEntityAdmin()
  }, [user?.id])

  if (!isEntityAdmin) {
    return (
      <div className="space-y-4">
        <CreateEntityInterface onEntityCreated={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end items-center">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Usuario
        </Button>
      </div>

      {/* Alertas */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Informações da Entidade */}
      {entityInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              Informações da Entidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{entityInfo.name}</h3>
                {entityInfo.legal_name && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Razão Social:</span> {entityInfo.legal_name}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Email:</span> {entityInfo.email}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Tipo:</span> {
                    entityInfo.type === 'company' ? 'Empresa' :
                    entityInfo.type === 'organization' ? 'Organização' : 'Individual'
                  }
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Total de Usuários</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {entityInfo.current_users}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Criada em:</span>{' '}
                  {new Date(entityInfo.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.active}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.admins}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Usuários da Entidade</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuario encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={roleColors[user.entity_role]}>
                          {roleLabels[user.entity_role]}
                        </Badge>
                        <Badge className={statusColors[user.status]}>
                          {user.status === 'active' ? 'Ativo' : 
                           user.status === 'inactive' ? 'Inativo' : 
                           user.status === 'suspended' ? 'Suspenso' : 
                           user.status === 'pending' ? 'Aguardando Aprovação' : user.status}
                        </Badge>

                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.status === 'pending' ? (
                      // Botão de aprovação para convites pendentes
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => approveInvitation(user)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    ) : (
                      // Botões normais para usuários ativos
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserForPassword(user)
                            setShowPasswordModal(true)
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {user.id !== user?.id && user.status !== 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUserToDelete(user)
                          setShowDeleteConfirm(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cadastro */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Seleção de Entidade */}
            <div>
              <Label htmlFor="entity">Entidade *</Label>
              <Select
                value={formData.entity_id}
                onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
                disabled={loadingEntities || availableEntities.length <= 1}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingEntities 
                      ? "Carregando entidades..." 
                      : availableEntities.length === 0
                      ? "Nenhuma entidade disponível"
                      : "Selecione uma entidade"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableEntities.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Você não é administrador de nenhuma entidade
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Defina uma senha para o usuario"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="role">Cargo *</Label>
              <Select
                value={formData.entity_role}
                onValueChange={(value: 'user' | 'admin' | 'manager' | 'viewer') => 
                  setFormData({ ...formData, entity_role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="user">Usuario</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>{roleDescriptions.user}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="manager">Gerente</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>{roleDescriptions.manager}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>{roleDescriptions.admin}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>{roleDescriptions.viewer}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="position">Cargo (opcional)</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Gerente, Analista, Estagiário"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createUser({
                  full_name: formData.full_name,
                  email: formData.email,
                  password: formData.password,
                  entity_id: formData.entity_id,
                  entity_role: formData.entity_role,
                  phone: formData.phone,
                  position: formData.position
                })}
                disabled={!formData.full_name || !formData.email || !formData.password || !formData.entity_id}
              >
                Cadastrar Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edicao de Usuario */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={selectedUser.full_name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={selectedUser.email}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="role">Cargo</Label>
                <Select
                  value={selectedUser.entity_role}
                  onValueChange={(value: 'user' | 'admin' | 'manager' | 'viewer') => 
                    setSelectedUser({ ...selectedUser, entity_role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SelectItem value="user">Usuario</SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{roleDescriptions.user}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SelectItem value="manager">Gerente</SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{roleDescriptions.manager}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{roleDescriptions.admin}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SelectItem value="viewer">Visualizador</SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{roleDescriptions.viewer}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                    setSelectedUser({ ...selectedUser, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={selectedUser.phone || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={selectedUser.position || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, position: e.target.value })}
                  placeholder="Ex: Gerente, Analista, Estagiário"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleSaveUser(selectedUser)}>
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Alterar Senha */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha - {selectedUserForPassword?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_password">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm_password">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className={confirmPassword && !passwordsMatch ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-600 mt-1">
                  As senhas não coincidem
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword("")
                  setConfirmPassword("")
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => updateUserPassword(selectedUserForPassword!.id, newPassword)}
                disabled={!canUpdatePassword}
              >
                Atualizar Senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmacao de Exclusao */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuario da Entidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {userToDelete?.full_name} da entidade? 
              Esta acao nao exclui o usuario do sistema, apenas o remove da entidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
