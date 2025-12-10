"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LimitGuard } from "@/components/subscription/LimitGuard"
import { LimitAlert } from "@/components/subscription/LimitAlert"
import { useEntityPlan } from "@/hooks/use-entity-plan"
import {
  Users,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Building2,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import { formatCPF, formatCEP, formatPhone } from "@/lib/format-utils"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EntityUser {
  id: string
  full_name: string | null
  email: string | null
  entity_role: 'user' | 'admin' | 'manager' | 'viewer'
  status: 'active' | 'inactive' | 'suspended' | 'pending_confirmation' | 'deleted'
  created_at: string
  phone?: string | null
  position?: string | null
  updated_at?: string | null
  avatar_url?: string | null
  deleted_at?: string | null
}

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

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-orange-100 text-orange-800",
  suspended: "bg-yellow-100 text-yellow-800",
  pending_confirmation: "bg-blue-100 text-blue-800",
}

const roleLabels = {
  admin: "Administrador",
  manager: "Gerente",
  user: "Usuário",
  viewer: "Visualizador",
}

export default function EntityUserManagement() {
  const { user } = useAuth()
  const [entityUsers, setEntityUsers] = useState<EntityUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<EntityUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    entity_role: "user" as 'user' | 'admin' | 'manager' | 'viewer',
    phone: "",
    position: "",
    cpf: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zipcode: ""
  })

  const [entityInfo, setEntityInfo] = useState<{
    id: string
    name: string
    current_users: number
    logo_url: string | null
  } | null>(null)

  // Hook para informações do plano da entidade (só inicializar após ter entityInfo)
  const { planInfo, loading: planLoading, error: planError, refreshPlanInfo } = useEntityPlan(entityInfo?.id)
  
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const fetchEntityUsers = async () => {
    if (!user?.id) {
      console.log('⚠️ [fetchEntityUsers] Sem user.id, abortando')
      return
    }

    try {
      console.log('🔄 [fetchEntityUsers] Iniciando busca de usuários...')
      setLoading(true)
      setError('')

      // Buscar perfil do usuário logado
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id, entity_role')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData?.entity_id) {
        console.error('❌ [fetchEntityUsers] Erro ao buscar perfil:', profileError)
        setError('Usuário não está associado a uma entidade')
        return
      }

      console.log('✅ [fetchEntityUsers] Perfil encontrado:', { entity_id: profileData.entity_id, entity_role: profileData.entity_role })

      // Armazenar o papel do usuário atual
      setCurrentUserRole(profileData.entity_role)

      // Buscar informações da entidade
      const { data: entityData } = await supabase
        .from('entities')
        .select('id, name, current_users, logo_url')
        .eq('id', profileData.entity_id)
        .single()

      if (entityData) {
        setEntityInfo(entityData)
      }

      // Buscar usuários da entidade (excluindo usuários com soft delete)
      const timestamp = Date.now()
      console.log(`🔍 [fetchEntityUsers] Buscando usuários ativos (timestamp: ${timestamp})...`)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, entity_role, status, created_at, phone, position, avatar_url, updated_at, deleted_at')
        .eq('entity_id', profileData.entity_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [fetchEntityUsers] Erro ao buscar usuários:', error)
        throw error
      }

      console.log('✅ [fetchEntityUsers] Usuários carregados (excluindo soft deleted):', { 
        count: data?.length || 0, 
        users: data?.map(u => ({ 
          id: u.id.substring(0, 8), 
          name: u.full_name, 
          status: u.status,
          email: u.email,
          deleted_at: u.deleted_at || 'null'
        })) 
      })
      setEntityUsers(data || [])

    } catch (err) {
      console.error('❌ [fetchEntityUsers] Erro ao carregar usuários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
      console.log('🏁 [fetchEntityUsers] Busca finalizada')
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida')
        return
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB')
        return
      }
      
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const uploadLogo = async () => {
    if (!logoFile || !entityInfo?.id) return
    
    try {
      setUploadingLogo(true)
      setError('')
      
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${entityInfo.id}/logo-${Date.now()}.${fileExt}`
      
      const { data, error: uploadError } = await supabase.storage
        .from('entity-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) throw uploadError
      
      const { data: publicUrlData } = supabase.storage
        .from('entity-logos')
        .getPublicUrl(fileName)
      
      const logoUrl = publicUrlData.publicUrl
      
      // Atualizar entidade com URL do logo
      const { error: updateError } = await supabase
        .from('entities')
        .update({ logo_url: logoUrl })
        .eq('id', entityInfo.id)
      
      if (updateError) throw updateError
      
      setSuccess('Logo atualizado com sucesso!')
      setShowLogoModal(false)
      setLogoFile(null)
      setLogoPreview(null)
      
      // Atualizar entityInfo
      setEntityInfo(prev => prev ? { ...prev, logo_url: logoUrl } : null)
      
    } catch (err) {
      console.error('Erro ao fazer upload do logo:', err)
      setError('Erro ao fazer upload do logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const openEditModal = (user: EntityUser) => {
    setSelectedUser(user)
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "", // Não preencher senha ao editar
      entity_role: user.entity_role,
      phone: user.phone || "",
      position: user.position || ""
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (user: EntityUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const openStatusModal = (user: EntityUser) => {
    setSelectedUser(user)
    setShowStatusModal(true)
  }

  const updateUser = async () => {
    if (!selectedUser?.id || !entityInfo?.id) return

    try {
      setError('')
      setIsUpdatingUser(true)

      // Validações básicas
      if (!formData.full_name.trim()) {
        setError('Nome completo é obrigatório')
        return
      }

      console.log('🔧 [updateUser] Atualizando usuário...')
      
      const updateData: any = {
        full_name: formData.full_name.trim(),
        entity_role: formData.entity_role,
        phone: formData.phone?.trim() || null,
        position: formData.position?.trim() || null,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      console.log('✅ [updateUser] Usuário atualizado')
      
      setSuccess(`Usuário ${formData.full_name} atualizado com sucesso!`)
      setShowEditModal(false)
      setSelectedUser(null)
      
      // Limpar formulário
      setFormData({
        full_name: "",
        email: "",
        password: "",
        entity_role: "user",
        phone: "",
        position: ""
      })

      // Recarregar lista
      await fetchEntityUsers()

    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro interno do servidor')
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const toggleUserStatus = async () => {
    if (!selectedUser?.id) return

    try {
      setError('')
      setIsDeletingUser(true)

      // Verificar se não está tentando inativar a si mesmo
      if (selectedUser.id === user?.id) {
        setError('Você não pode alterar o status da sua própria conta')
        return
      }

      const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active'

      // Atualizar status do usuário
      // O campo updated_at será atualizado automaticamente pelo trigger
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus
        })
        .eq('id', selectedUser.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      const action = newStatus === 'inactive' ? 'inativado' : 'ativado'
      setSuccess(`Usuário ${selectedUser.full_name} ${action} com sucesso!`)
      setShowStatusModal(false)
      setSelectedUser(null)

      // Recarregar lista e informações do plano
      await fetchEntityUsers()
      await refreshPlanInfo()

    } catch (err) {
      console.error('Erro ao alterar status do usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do usuário')
    } finally {
      setIsDeletingUser(false)
    }
  }

  const deleteUserPermanently = async () => {
    if (!selectedUser?.id) {
      console.log('⚠️ [deleteUser] Sem selectedUser.id, abortando')
      return
    }

    try {
      setError('')
      setIsDeletingUser(true)

      console.log('🗑️ [deleteUser] Excluindo usuário permanentemente...', { 
        userId: selectedUser.id, 
        userName: selectedUser.full_name,
        status: selectedUser.status,
        updated_at: selectedUser.updated_at
      })

      // Verificar se não está tentando excluir a si mesmo
      if (selectedUser.id === user?.id) {
        console.log('⚠️ [deleteUser] Tentativa de excluir a própria conta')
        setError('Você não pode excluir sua própria conta')
        setIsDeletingUser(false)
        return
      }

      // Verificar se passou 7 dias desde a última atualização (inativação)
      if (selectedUser.status === 'inactive' && selectedUser.updated_at) {
        const updatedDate = new Date(selectedUser.updated_at)
        const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
        
        console.log('📅 [deleteUser] Verificando período de inativação:', { daysSinceUpdate, required: 7 })
        
        if (daysSinceUpdate < 7) {
          console.log('⚠️ [deleteUser] Período de 7 dias não atingido')
          setError(`Este usuário só poderá ser excluído após ${7 - daysSinceUpdate} dia(s)`)
          setIsDeletingUser(false)
          return
        }
      }

      // Excluir usuário usando API admin
      console.log('🔄 [deleteUser] Chamando API de exclusão...')
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ [deleteUser] Erro na API:', result)
        throw new Error(result.error || 'Erro ao excluir usuário')
      }

      console.log('✅ [deleteUser] Usuário excluído com sucesso via API:', result)
      
      // Fechar modal e limpar seleção
      console.log('🔄 [deleteUser] Fechando modal e limpando seleção...')
      setShowDeleteModal(false)
      setSelectedUser(null)
      
      // Recarregar lista e informações do plano antes de mostrar mensagem de sucesso
      console.log('🔄 [deleteUser] Recarregando lista de usuários e informações do plano...')
      await fetchEntityUsers()
      await refreshPlanInfo()
      console.log('✅ [deleteUser] Lista e plano recarregados')
      
      // Mostrar mensagem de sucesso após recarregar
      setSuccess(`Usuário excluído permanentemente!`)
      console.log('✅ [deleteUser] Processo de exclusão concluído')

    } catch (err) {
      console.error('❌ [deleteUser] Erro ao excluir usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário')
    } finally {
      setIsDeletingUser(false)
      console.log('🏁 [deleteUser] Finalizando processo')
    }
  }

  const canDeleteUser = (user: EntityUser): boolean => {
    if (user.status !== 'inactive' || !user.updated_at) return false
    
    const updatedDate = new Date(user.updated_at)
    const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysSinceUpdate >= 7
  }

  const getDaysUntilDeletion = (user: EntityUser): number => {
    if (!user.updated_at) return 0
    
    const updatedDate = new Date(user.updated_at)
    const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return Math.max(0, 7 - daysSinceUpdate)
  }

  const createUser = async () => {
    if (!user?.id || !entityInfo?.id) return

    try {
      setError('')
      setIsCreatingUser(true)

      // Validações básicas
      if (!formData.full_name.trim()) {
        setError('Nome completo é obrigatório')
        return
      }

      if (!formData.email.trim()) {
        setError('Email é obrigatório')
        return
      }

      if (!formData.password.trim()) {
        setError('Senha é obrigatória')
        return
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return
      }

      console.log('🔧 [createUser] Criando usuário...')
      
      const response = await fetch('/api/create-entity-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          entity_id: entityInfo.id,
          entity_role: formData.entity_role,
          phone: formData.phone?.trim() || null,
          position: formData.position?.trim() || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário')
      }

      console.log('✅ [createUser] Usuário criado:', result)
      
      setSuccess(`Usuário ${formData.full_name} criado com sucesso! Um email de confirmação foi enviado para ${formData.email}. O usuário poderá fazer login após confirmar o email.`)
      setShowCreateModal(false)
      
      // Limpar formulário
      setFormData({
        full_name: "",
        email: "",
        password: "",
        entity_role: "user",
        phone: "",
        position: ""
      })

      // Recarregar lista e informações do plano
      await fetchEntityUsers()
      await refreshPlanInfo()

    } catch (err) {
      console.error('Erro ao criar usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro interno do servidor')
    } finally {
      setIsCreatingUser(false)
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

  useEffect(() => {
    fetchEntityUsers()
  }, [user?.id])

  // Limpar mensagens após alguns segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 8000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (!entityInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Você ainda não possui uma entidade
          </h3>
          <p className="text-gray-600">
            Crie uma entidade para gerenciar usuários
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Logo da Entidade */}
          <div className="relative group">
            {entityInfo.logo_url ? (
              <div className="h-16 w-16 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center">
                <img
                  src={entityInfo.logo_url}
                  alt={entityInfo.name}
                  className="h-full w-full object-contain p-1"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowLogoModal(true)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários da Entidade</h1>
            <p className="text-gray-600">{entityInfo.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {planInfo && !planLoading && entityInfo && (
            <div className="text-sm text-gray-600">
              {planInfo.currentUsers}/{planInfo.maxUsers} usuários
            </div>
          )}
          <LimitGuard userId={user?.id} limitType="users" showAlert={false}>
            <Button 
              onClick={() => setShowCreateModal(true)}
              disabled={planInfo ? !planInfo.canCreateUser : false}
            >
              <Plus className="h-4 w-4 mr-2" />
              {planInfo && !planInfo.canCreateUser ? 'Limite Atingido' : 'Cadastrar Usuário'}
            </Button>
          </LimitGuard>
        </div>
      </div>

      {/* Informações do Plano */}
      {planInfo && entityInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Limite de Usuários</h3>
                  <p className="text-sm text-blue-700">
                    Plano {planInfo.planName} - {planInfo.currentUsers} de {planInfo.maxUsers} usuários utilizados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {planInfo.remainingUsers}
                </div>
                <div className="text-sm text-blue-700">
                  {planInfo.remainingUsers === 1 ? 'usuário restante' : 'usuários restantes'}
                </div>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span>Uso atual</span>
                <span>{Math.round((planInfo.currentUsers / planInfo.maxUsers) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (planInfo.currentUsers / planInfo.maxUsers) >= 0.9 
                      ? 'bg-red-500' 
                      : (planInfo.currentUsers / planInfo.maxUsers) >= 0.8 
                        ? 'bg-yellow-500' 
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((planInfo.currentUsers / planInfo.maxUsers) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Alerta quando próximo do limite */}
            {!planInfo.canCreateUser && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">
                    Limite de usuários atingido
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Para criar mais usuários, faça upgrade do seu plano ou remova usuários inativos.
                </p>
              </div>
            )}

            {/* Alerta quando próximo do limite (80% ou mais) */}
            {planInfo.canCreateUser && (planInfo.currentUsers / planInfo.maxUsers) >= 0.8 && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 font-medium">
                    Próximo do limite
                  </span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Você está usando {Math.round((planInfo.currentUsers / planInfo.maxUsers) * 100)}% do seu limite de usuários.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      <LimitAlert userId={user?.id} limitType="users" showAt={[80, 90]} />
      
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Usuários</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((entityUser) => (
                <div key={entityUser.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entityUser.avatar_url || undefined} alt={entityUser.full_name || 'Avatar'} />
                      <AvatarFallback>{getInitials(entityUser.full_name || 'U')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{entityUser.full_name}</h3>
                      <p className="text-sm text-gray-600">{entityUser.email}</p>
                      {entityUser.position && (
                        <p className="text-xs text-gray-500">{entityUser.position}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={roleColors[entityUser.entity_role]}>
                          {roleLabels[entityUser.entity_role]}
                        </Badge>
                        <Badge className={statusColors[entityUser.status] || "bg-gray-100 text-gray-800"}>
                          {entityUser.status === 'active' ? (
                            'Ativo'
                          ) : entityUser.status === 'inactive' ? (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Inativo
                            </span>
                          ) : entityUser.status === 'pending_confirmation' ? (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Confirmação Pendente
                            </span>
                          ) : entityUser.status === 'suspended' ? (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Suspenso
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {entityUser.status}
                            </span>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botões de ação - apenas para admins */}
                  {currentUserRole === 'admin' && entityUser.id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(entityUser)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openStatusModal(entityUser)}
                          className={entityUser.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                        >
                          {entityUser.status === 'active' ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Inativar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        {canDeleteUser(entityUser) && (
                          <DropdownMenuItem 
                            onClick={() => openDeleteModal(entityUser)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Permanentemente
                          </DropdownMenuItem>
                        )}
                        {entityUser.status === 'inactive' && !canDeleteUser(entityUser) && (
                          <DropdownMenuItem disabled className="text-gray-400 text-xs">
                            Exclusão disponível em {getDaysUntilDeletion(entityUser)} dia(s)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Upload de Logo */}
      <Dialog open={showLogoModal} onOpenChange={setShowLogoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Logo da Entidade</DialogTitle>
            <DialogDescription>
              Faça upload de uma imagem para representar sua entidade na biblioteca pública
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!logoPreview && !entityInfo?.logo_url ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="logo-upload-modal"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                />
                <label
                  htmlFor="logo-upload-modal"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-4 bg-gray-100 rounded-full">
                    <ImageIcon className="h-8 w-8 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Clique para fazer upload do logo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG ou GIF (máx. 2MB)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                      <img
                        src={logoPreview || entityInfo?.logo_url || ''}
                        alt="Preview do logo"
                        className="h-40 w-40 object-contain"
                      />
                    </div>
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0"
                        onClick={removeLogo}
                        disabled={uploadingLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {!logoPreview && (
                  <div className="text-center">
                    <input
                      type="file"
                      id="logo-change-modal"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                      disabled={uploadingLogo}
                    />
                    <label htmlFor="logo-change-modal">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => document.getElementById('logo-change-modal')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Logo
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLogoModal(false)
                  setLogoFile(null)
                  setLogoPreview(null)
                }}
                disabled={uploadingLogo}
              >
                Cancelar
              </Button>
              <Button
                onClick={uploadLogo}
                disabled={!logoFile || uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Salvar Logo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_full_name">Nome Completo *</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ex: João Silva"
                disabled={isUpdatingUser}
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
            </div>
            <div>
              <Label htmlFor="edit_role">Função *</Label>
              <Select
                value={formData.entity_role}
                onValueChange={(value: 'user' | 'admin' | 'manager' | 'viewer') =>
                  setFormData({ ...formData, entity_role: value })
                }
                disabled={isUpdatingUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ex: (11) 99999-9999"
                disabled={isUpdatingUser}
              />
            </div>
            <div>
              <Label htmlFor="edit_position">Cargo</Label>
              <Input
                id="edit_position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Analista, Gerente"
                disabled={isUpdatingUser}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                disabled={isUpdatingUser}
              >
                Cancelar
              </Button>
              <Button
                onClick={updateUser}
                disabled={!formData.full_name || isUpdatingUser}
              >
                {isUpdatingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Mudança de Status */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === 'active' ? 'Inativar Usuário' : 'Ativar Usuário'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.status === 'active' 
                ? 'O usuário não poderá mais acessar a plataforma.'
                : 'O usuário poderá acessar a plataforma novamente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className={selectedUser?.status === 'active' ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
              <AlertCircle className={`h-4 w-4 ${selectedUser?.status === 'active' ? 'text-orange-600' : 'text-green-600'}`} />
              <AlertDescription className={selectedUser?.status === 'active' ? 'text-orange-700' : 'text-green-700'}>
                {selectedUser?.status === 'active' ? (
                  <>
                    Você está prestes a <strong>inativar</strong> o usuário <strong>{selectedUser?.full_name}</strong>.
                    <br /><br />
                    • O usuário não poderá fazer login
                    <br />
                    • Todas as ações na plataforma serão bloqueadas
                    <br />
                    • Após 7 dias, será possível excluir permanentemente
                  </>
                ) : (
                  <>
                    Você está prestes a <strong>ativar</strong> o usuário <strong>{selectedUser?.full_name}</strong>.
                    <br /><br />
                    • O usuário poderá fazer login novamente
                    <br />
                    • Todas as permissões serão restauradas
                  </>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedUser(null)
                }}
                disabled={isDeletingUser}
              >
                Cancelar
              </Button>
              <Button
                variant={selectedUser?.status === 'active' ? 'default' : 'default'}
                className={selectedUser?.status === 'active' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
                onClick={toggleUserStatus}
                disabled={isDeletingUser}
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : selectedUser?.status === 'active' ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Inativar Usuário
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ativar Usuário
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão Permanente */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão Permanente</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você está prestes a <strong>excluir permanentemente</strong> o usuário <strong>{selectedUser?.full_name}</strong>.
                <br /><br />
                • Todos os dados serão removidos permanentemente
                <br />
                • Esta ação não pode ser desfeita
                <br />
                • O usuário não poderá ser recuperado
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
                disabled={isDeletingUser}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={deleteUserPermanently}
                disabled={isDeletingUser}
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Permanentemente
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário. O usuário poderá fazer login imediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ex: João Silva"
                disabled={isCreatingUser}
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
                disabled={isCreatingUser}
              />
            </div>
            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                disabled={isCreatingUser}
              />
            </div>
            <div>
              <Label htmlFor="role">Função *</Label>
              <Select
                value={formData.entity_role}
                onValueChange={(value: 'user' | 'admin' | 'manager' | 'viewer') =>
                  setFormData({ ...formData, entity_role: value })
                }
                disabled={isCreatingUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="Ex: (11) 99999-9999"
                disabled={isCreatingUser}
              />
            </div>
            <div>
              <Label htmlFor="position">Cargo (opcional)</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Analista, Gerente"
                disabled={isCreatingUser}
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF (opcional)</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
                disabled={isCreatingUser}
              />
            </div>
            
            {/* Seção de Endereço */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900">Endereço (opcional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="address_street">Rua</Label>
                  <Input
                    id="address_street"
                    value={formData.address_street}
                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                    placeholder="Nome da rua"
                    disabled={isCreatingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="address_number">Número</Label>
                  <Input
                    id="address_number"
                    value={formData.address_number}
                    onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                    placeholder="123"
                    disabled={isCreatingUser}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  placeholder="Apto, sala, etc."
                  disabled={isCreatingUser}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="address_neighborhood">Bairro</Label>
                  <Input
                    id="address_neighborhood"
                    value={formData.address_neighborhood}
                    onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                    placeholder="Nome do bairro"
                    disabled={isCreatingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input
                    id="address_city"
                    value={formData.address_city}
                    onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                    placeholder="Nome da cidade"
                    disabled={isCreatingUser}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="address_state">Estado</Label>
                  <Select
                    value={formData.address_state}
                    onValueChange={(value) => setFormData({ ...formData, address_state: value })}
                    disabled={isCreatingUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Acre</SelectItem>
                      <SelectItem value="AL">Alagoas</SelectItem>
                      <SelectItem value="AP">Amapá</SelectItem>
                      <SelectItem value="AM">Amazonas</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="DF">Distrito Federal</SelectItem>
                      <SelectItem value="ES">Espírito Santo</SelectItem>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="MA">Maranhão</SelectItem>
                      <SelectItem value="MT">Mato Grosso</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="PA">Pará</SelectItem>
                      <SelectItem value="PB">Paraíba</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="PI">Piauí</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="RO">Rondônia</SelectItem>
                      <SelectItem value="RR">Roraima</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="SE">Sergipe</SelectItem>
                      <SelectItem value="TO">Tocantins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address_zipcode">CEP</Label>
                  <Input
                    id="address_zipcode"
                    value={formData.address_zipcode}
                    onChange={(e) => setFormData({ ...formData, address_zipcode: formatCEP(e.target.value) })}
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={isCreatingUser}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingUser}
              >
                Cancelar
              </Button>
              <Button
                onClick={createUser}
                disabled={!formData.full_name || !formData.email || !formData.password || isCreatingUser}
              >
                {isCreatingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Cadastrar Usuário'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}