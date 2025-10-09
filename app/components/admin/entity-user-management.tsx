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
import { useAuth } from '@/lib/hooks/use-unified-auth'
import { createBrowserClient } from '@supabase/ssr'
import { checkSimpleEntityAdminStatus } from "@/lib/simple-entity-admin-utils"
import { EntityAdminDebug } from "../entity-admin-debug"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

interface EntityUser {
  id: string
  full_name: string
  email: string
  entity_role: 'user' | 'admin' | 'manager' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  last_login?: string
  phone?: string
  department?: string
  position?: string
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
}

const roleLabels = {
  admin: "Administrador",
  manager: "Gerente",
  user: "Usuario",
  viewer: "Visualizador",
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

  // Formulario para novo usuario
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    entity_role: "user" as 'user' | 'admin' | 'manager' | 'viewer',
    phone: "",
    department: "",
    position: "",
    password: ""
  })

  const fetchEntityUsers = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // Primeiro buscar o entity_id do perfil do usuário logado
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData?.entity_id) {
        console.log('Usuario nao esta associado a uma entidade')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, entity_role, status, created_at, last_login, phone, department, position')
        .eq('entity_id', profileData.entity_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntityUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: {
    full_name: string
    email: string
    entity_role: 'user' | 'admin' | 'manager' | 'viewer'
    phone?: string
    department?: string
    position?: string
    password: string
  }) => {
    if (!user?.id) return

    try {
      // Primeiro buscar o entity_id do perfil do usuário logado
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData?.entity_id) {
        setError('Usuario nao esta associado a uma entidade')
        return
      }

      // Chamar a Edge Function para criar o usuário
      const { data, error } = await supabase.functions.invoke('create-entity-user', {
        body: {
          full_name: userData.full_name,
          email: userData.email,
          entity_role: userData.entity_role,
          phone: userData.phone,
          department: userData.department,
          position: userData.position,
          password: userData.password,
          entity_id: profileData.entity_id
        }
      })

      if (error) {
        console.error('Erro na Edge Function:', error)
        setError('Erro ao cadastrar usuario. Tente novamente.')
        return
      }

      if (data.error) {
        setError(data.error)
        return
      }

      setSuccess('Usuario cadastrado com sucesso! Email com dados de acesso foi enviado.')
      setShowCreateModal(false)
      setFormData({
        full_name: "",
        email: "",
        entity_role: "user",
        phone: "",
        department: "",
        position: "",
        password: ""
      })
      
      // Recarregar lista de usuários
      await fetchEntityUsers()
    } catch (err) {
      console.error('Erro ao cadastrar usuario:', err)
      setError('Erro interno do servidor. Tente novamente.')
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
          department: userData.department,
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

  const filteredUsers = entityUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: entityUsers.length,
    active: entityUsers.filter(user => user.status === 'active').length,
    admins: entityUsers.filter(user => user.entity_role === 'admin').length,
  }

  // Verificar se as senhas coincidem
  const passwordsMatch = newPassword === confirmPassword
  const canUpdatePassword = newPassword && confirmPassword && passwordsMatch

  useEffect(() => {
    fetchEntityUsers()
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

  useEffect(() => {
    const checkEntityAdmin = async () => {
      if (!user?.id) return

      try {
        console.log('🔍 [EntityUserManagement] Verificando admin de entidade para usuário:', user.id)
        
        const adminStatus = await checkSimpleEntityAdminStatus(user.id)
        
        console.log('📊 [EntityUserManagement] Status de admin:', adminStatus)

        setIsEntityAdmin(adminStatus.isEntityAdmin)
        setUserEntityId(adminStatus.entityId)

        if (adminStatus.errors.length > 0) {
          console.log('⚠️ [EntityUserManagement] Problemas encontrados:', adminStatus.errors)
        }
      } catch (err) {
        console.error('❌ [EntityUserManagement] Erro geral ao verificar admin de entidade:', err)
      }
    }

    checkEntityAdmin()
  }, [user?.id])

  if (!isEntityAdmin) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Voce nao esta associado a nenhuma entidade como administrador. Apenas administradores de entidades podem gerenciar usuarios.
          </AlertDescription>
        </Alert>
        
        {/* Componente de diagnóstico para ajudar a resolver o problema */}
        <EntityAdminDebug />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuarios da Entidade</h1>
          <p className="text-gray-600">Gerencie os usuarios da sua entidade</p>
        </div>
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

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Usuarios da Entidade</CardTitle>
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
                          {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                        </Badge>
                        {user.department && (
                          <Badge variant="outline">{user.department}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                    {user.id !== user?.id && (
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
                  <SelectItem value="user">Usuario</SelectItem>
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
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="department">Departamento (opcional)</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Ex: Vendas, TI, RH"
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
                  entity_role: formData.entity_role,
                  phone: formData.phone,
                  department: formData.department,
                  position: formData.position,
                  password: formData.password
                })}
                disabled={!formData.full_name || !formData.email || !formData.password}
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
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
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
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={selectedUser.department || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                  placeholder="Ex: Vendas, TI, RH"
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
