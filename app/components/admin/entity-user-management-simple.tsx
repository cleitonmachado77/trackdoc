"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react"

import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EntityUser {
  id: string
  full_name: string | null
  email: string | null
  entity_role: 'user' | 'admin' | 'manager' | 'viewer'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  created_at: string
  phone?: string | null
  position?: string | null
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

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-blue-100 text-blue-800",
  suspended: "bg-yellow-100 text-yellow-800",
  pending: "bg-orange-100 text-orange-800",
}

const roleLabels = {
  admin: "Administrador",
  manager: "Gerente",
  user: "Usuario",
  viewer: "Visualizador",
}

export default function EntityUserManagementSimple() {
  const { user } = useAuth()
  const [entityUsers, setEntityUsers] = useState<EntityUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // Formulario simplificado
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    entity_role: "user" as 'user' | 'admin' | 'manager' | 'viewer',
    phone: "",
    position: ""
  })

  // Informações da entidade do usuário
  const [entityInfo, setEntityInfo] = useState<{
    id: string
    name: string
    current_users: number
  } | null>(null)

  const fetchEntityUsers = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError('')

      // Buscar perfil do usuário logado
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id, entity_role')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData?.entity_id) {
        setError('Usuário não está associado a uma entidade')
        return
      }

      // Buscar informações da entidade
      const { data: entityData } = await supabase
        .from('entities')
        .select('id, name, current_users')
        .eq('id', profileData.entity_id)
        .single()

      if (entityData) {
        setEntityInfo(entityData)
      }

      // Buscar usuários da entidade
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, entity_role, status, created_at, phone, position')
        .eq('entity_id', profileData.entity_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setEntityUsers(data || [])

    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
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

      // Verificar se email já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle()

      if (existingProfile) {
        setError('Este email já está cadastrado no sistema')
        return
      }

      // MÉTODO SIMPLIFICADO: Criar usuário diretamente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            entity_id: entityInfo.id,
            entity_role: formData.entity_role,
            phone: formData.phone?.trim(),
            position: formData.position?.trim(),
            registration_type: 'entity_user'
          }
        }
      })

      if (authError) {
        setError(`Erro ao criar usuário: ${authError.message}`)
        return
      }

      if (authData.user) {
        // Aguardar um pouco para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Atualizar perfil com dados da entidade
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            entity_id: entityInfo.id,
            entity_role: formData.entity_role,
            phone: formData.phone?.trim() || null,
            position: formData.position?.trim() || null,
            registration_type: 'entity_user',
            status: 'inactive' // Será ativado quando confirmar email
          })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError)
        }

        setSuccess(`Usuário ${formData.full_name} criado com sucesso! Email de confirmação enviado.`)
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

        // Recarregar lista
        await fetchEntityUsers()
      }

    } catch (err) {
      console.error('Erro ao criar usuário:', err)
      setError('Erro interno do servidor. Tente novamente.')
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários da Entidade</h1>
          <p className="text-gray-600">{entityInfo.name}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Usuario
        </Button>
      </div>

      {/* Alertas */}
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
                placeholder="Buscar usuarios..."
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
              <p className="text-gray-600">Carregando usuarios...</p>
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
                      <AvatarFallback>{getInitials(user.full_name || 'U')}</AvatarFallback>
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
                            user.status === 'inactive' ? 'Aguardando Confirmação' :
                              user.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
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
            <DialogDescription>
              Preencha os dados para criar um novo usuário. Um email de confirmação será enviado automaticamente.
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
              <Label htmlFor="role">Cargo *</Label>
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
                  'Cadastrar Usuario'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}