"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from '@/lib/hooks/use-auth-final'
import SubscriptionPayments from "@/app/components/admin/subscription-payments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Building,
  CreditCard,
  Settings,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  HardDrive,
  FileText,
  Calendar,
  Mail,
  Phone,
  UserPlus,
  RefreshCw,
  BarChart3,
  Activity
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Plan {
  id: string
  name: string
  type: string
  price_monthly: number
  max_users: number
  max_storage_gb: number
  max_documents: number
  features: any
  is_active: boolean
}

interface User {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  role: string
  status: string
  entity_id: string | null
  created_at: string
  last_login: string | null
  subscription?: {
    id: string
    plan_id: string
    status: string
    start_date: string
    end_date: string | null
    current_users: number
    current_storage_gb: number
    plan?: Plan
  }
}

interface UserStats {
  userId: string
  documentsCount: number
  storageUsedGB: number
  lastActivity: string | null
}

interface Entity {
  id: string
  name: string
  legal_name: string | null
  document_number: string | null
  status: string
  created_at: string
  user_count: number
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalEntities: number
  totalDocuments: number
  storageUsedGB: number
  usersByPlan: { plan: string; count: number }[]
}

export default function SuperAdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Estados para dados
  const [users, setUsers] = useState<User[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")

  // Estados para modal de criação de usuário
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    phone: "",
    company: "",
    password: "",
    plan_id: "",
    role: "user"
  })

  // Verificar autorização
  useEffect(() => {
    checkAuthorization()
  }, [user])

  const checkAuthorization = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Apenas super_admin pode acessar
      if (profile?.role === 'super_admin') {
        setAuthorized(true)
        await loadAllData()
      } else {
        setAuthorized(false)
      }
    } catch (error) {
      console.error('Erro ao verificar autorização:', error)
      setAuthorized(false)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    await Promise.all([
      loadUsers(),
      loadEntities(),
      loadPlans(),
      loadStats(),
      loadUserStats()
    ])
  }

  const loadUsers = async () => {
    try {
      // Buscar TODOS os usuários, independente de terem subscription
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscription:subscriptions!left(
            id,
            plan_id,
            status,
            start_date,
            end_date,
            current_users,
            current_storage_gb,
            plan:plans(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Garantir que subscription seja um objeto único (não array)
      const processedData = data?.map(user => ({
        ...user,
        subscription: Array.isArray(user.subscription) 
          ? user.subscription[0] 
          : user.subscription
      }))
      
      setUsers(processedData || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadUserStats = async () => {
    try {
      // Carregar estatísticas de documentos por usuário
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('created_by, file_size, created_at')

      if (docsError) {
        console.warn('Erro ao carregar documentos:', docsError)
        // Não falhar se não houver documentos
        setUserStats({})
        return
      }

      // Agregar dados por usuário
      const statsMap: Record<string, UserStats> = {}
      
      docsData?.forEach(doc => {
        if (!doc.created_by) return
        
        if (!statsMap[doc.created_by]) {
          statsMap[doc.created_by] = {
            userId: doc.created_by,
            documentsCount: 0,
            storageUsedGB: 0,
            lastActivity: doc.created_at
          }
        }
        
        statsMap[doc.created_by].documentsCount++
        statsMap[doc.created_by].storageUsedGB += (doc.file_size || 0) / (1024 * 1024 * 1024) // Converter para GB
        
        // Atualizar última atividade
        if (doc.created_at && (!statsMap[doc.created_by].lastActivity || 
            new Date(doc.created_at) > new Date(statsMap[doc.created_by].lastActivity!))) {
          statsMap[doc.created_by].lastActivity = doc.created_at
        }
      })

      setUserStats(statsMap)
    } catch (error) {
      console.error('Erro ao carregar estatísticas de usuários:', error)
      setUserStats({})
    }
  }

  const loadEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntities(data || [])
    } catch (error) {
      console.error('Erro ao carregar entidades:', error)
    }
  }

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Usuários ativos
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Total de entidades
      const { count: totalEntities } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })

      // Total de documentos
      const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalEntities: totalEntities || 0,
        totalDocuments: totalDocuments || 0,
        storageUsedGB: 0,
        usersByPlan: []
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }


  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.full_name || !newUser.password || !newUser.plan_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    setCreatingUser(true)

    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: newUser.full_name
        }
      })

      if (authError) {
        // Tentar via API se admin não funcionar
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erro ao criar usuário')
        }

        const result = await response.json()
        
        toast({
          title: "Usuário criado",
          description: `Usuário ${newUser.full_name} criado com sucesso!`
        })

        setShowCreateUserModal(false)
        setNewUser({
          email: "",
          full_name: "",
          phone: "",
          company: "",
          password: "",
          plan_id: "",
          role: "user"
        })
        await loadUsers()
        return
      }

      // 2. Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.full_name,
          phone: newUser.phone,
          company: newUser.company,
          role: newUser.role,
          status: 'active',
          registration_completed: true
        })

      if (profileError) throw profileError

      // 3. Criar subscription
      const selectedPlan = plans.find(p => p.id === newUser.plan_id)
      if (selectedPlan) {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1) // 1 ano de validade

        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: authData.user.id,
            plan_id: newUser.plan_id,
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            current_users: 1,
            current_storage_gb: 0
          })

        if (subError) throw subError
      }

      toast({
        title: "Usuário criado",
        description: `Usuário ${newUser.full_name} criado com sucesso!`
      })

      setShowCreateUserModal(false)
      setNewUser({
        email: "",
        full_name: "",
        phone: "",
        company: "",
        password: "",
        plan_id: "",
        role: "user"
      })
      await loadUsers()

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleUpdateUserPlan = async (userId: string, planId: string) => {
    try {
      // Verificar se já existe subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (existingSub) {
        // Atualizar subscription existente
        const { error } = await supabase
          .from('subscriptions')
          .update({ plan_id: planId })
          .eq('id', existingSub.id)

        if (error) throw error
      } else {
        // Criar nova subscription
        const startDate = new Date()
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1)

        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            current_users: 1,
            current_storage_gb: 0
          })

        if (error) throw error
      }

      toast({
        title: "Plano atualizado",
        description: "O plano do usuário foi atualizado com sucesso."
      })

      await loadUsers()
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error)
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "Status atualizado",
        description: `Status do usuário alterado para ${status}.`
      })

      await loadUsers()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    // Filtro de plano - incluir "sem plano"
    let matchesPlan = false
    if (planFilter === "all") {
      matchesPlan = true
    } else if (planFilter === "no_plan") {
      matchesPlan = !user.subscription?.plan
    } else {
      matchesPlan = user.subscription?.plan?.type === planFilter
    }

    return matchesSearch && matchesStatus && matchesPlan
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspenso</Badge>
      case 'pending_confirmation':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlanBadge = (planType: string | undefined) => {
    switch (planType) {
      case 'basico':
        return <Badge className="bg-blue-100 text-blue-800">Básico</Badge>
      case 'profissional':
        return <Badge className="bg-purple-100 text-purple-800">Profissional</Badge>
      case 'enterprise':
        return <Badge className="bg-orange-100 text-orange-800">Enterprise</Badge>
      default:
        return <Badge variant="outline">Sem plano</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
            <p className="text-gray-600">Gerencie usuários, planos e configurações do sistema</p>
          </div>
          <Button onClick={() => loadAllData()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Usuários</p>
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuários Ativos</p>
                  <p className="text-3xl font-bold">{stats?.activeUsers || 0}</p>
                </div>
                <Activity className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Entidades</p>
                  <p className="text-3xl font-bold">{stats?.totalEntities || 0}</p>
                </div>
                <Building className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Documentos</p>
                  <p className="text-3xl font-bold">{stats?.totalDocuments || 0}</p>
                </div>
                <FileText className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="entities" className="gap-2">
              <Building className="h-4 w-4" />
              Entidades
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários por Plano</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plans.map(plan => {
                      const count = users.filter(u => 
                        u.subscription?.plan?.type === plan.type
                      ).length
                      const percentage = users.length > 0 
                        ? (count / users.length) * 100 
                        : 0

                      return (
                        <div key={plan.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{plan.name}</span>
                            <span className="font-medium">{count} usuários</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sem plano</span>
                        <span className="font-medium">
                          {users.filter(u => !u.subscription?.plan).length} usuários
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Últimos Usuários Cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="text-right">
                          {getPlanBadge(user.subscription?.plan?.type)}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>
                      Crie, edite e gerencie os usuários do sistema
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Novo Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Usuário</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para criar uma nova conta de usuário
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="usuario@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Nome Completo *</Label>
                          <Input
                            id="full_name"
                            value={newUser.full_name}
                            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                            placeholder="Nome do usuário"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Senha *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={newUser.phone}
                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Empresa</Label>
                          <Input
                            id="company"
                            value={newUser.company}
                            onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                            placeholder="Nome da empresa"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan">Plano *</Label>
                          <Select
                            value={newUser.plan_id}
                            onValueChange={(value) => setNewUser({ ...newUser, plan_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map(plan => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{plan.name} - R$ {plan.price_monthly}/mês</span>
                                    <span className="text-xs text-gray-500">
                                      {plan.max_users} usuários • {plan.max_storage_gb}GB • {plan.max_documents} docs
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {newUser.plan_id && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs font-medium text-blue-900 mb-2">Funcionalidades incluídas:</p>
                              <div className="grid grid-cols-2 gap-1 text-xs text-blue-800">
                                {(() => {
                                  const selectedPlan = plans.find(p => p.id === newUser.plan_id)
                                  if (!selectedPlan?.features) return null
                                  
                                  const featureLabels: Record<string, string> = {
                                    dashboard_gerencial: 'Dashboard',
                                    upload_documentos: 'Upload docs',
                                    solicitacao_aprovacoes: 'Aprovações',
                                    suporte_email: 'Suporte email',
                                    biblioteca_publica: 'Biblioteca',
                                    assinatura_eletronica_simples: 'Assinatura simples',
                                    assinatura_eletronica_multipla: 'Assinatura múltipla',
                                    chat_nativo: 'Chat',
                                    auditoria_completa: 'Auditoria',
                                    backup_automatico_diario: 'Backup',
                                    suporte_tecnico_dedicado: 'Suporte dedicado'
                                  }
                                  
                                  return Object.entries(selectedPlan.features)
                                    .filter(([_, value]) => value === true)
                                    .map(([key]) => (
                                      <div key={key} className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        <span>{featureLabels[key] || key}</span>
                                      </div>
                                    ))
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Função</Label>
                          <Select
                            value={newUser.role}
                            onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="manager">Gerente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateUserModal(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateUser} disabled={creatingUser}>
                          {creatingUser ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Criar Usuário
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nome, email ou empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                      <SelectItem value="suspended">Suspensos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="no_plan">Sem plano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabela de Usuários */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => {
                        const stats = userStats[user.id]
                        const plan = user.subscription?.plan
                        const usagePercentage = plan ? 
                          Math.round((stats?.storageUsedGB || 0) / plan.max_storage_gb * 100) : 0

                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{user.company || '-'}</TableCell>
                            <TableCell>
                              <Select
                                value={user.subscription?.plan_id || ""}
                                onValueChange={(value) => handleUpdateUserPlan(user.id, value)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue>
                                    {getPlanBadge(user.subscription?.plan?.type)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <FileText className="h-3 w-3 text-gray-400" />
                                  <span>{stats?.documentsCount || 0} docs</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <HardDrive className="h-3 w-3 text-gray-400" />
                                  <span>{stats?.storageUsedGB?.toFixed(2) || '0.00'} GB</span>
                                  {plan && stats && (
                                    <Badge 
                                      variant={usagePercentage > 80 ? "destructive" : "outline"}
                                      className="text-xs"
                                    >
                                      {usagePercentage}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.status}
                                onValueChange={(value) => handleUpdateUserStatus(user.id, value)}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue>
                                    {getStatusBadge(user.status)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Ativo</SelectItem>
                                  <SelectItem value="inactive">Inativo</SelectItem>
                                  <SelectItem value="suspended">Suspenso</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  Mostrando {filteredUsers.length} de {users.length} usuários
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entities Tab */}
          <TabsContent value="entities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Entidades Cadastradas</CardTitle>
                <CardDescription>
                  Visualize todas as entidades (empresas) do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Razão Social</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entities.map(entity => (
                        <TableRow key={entity.id}>
                          <TableCell className="font-medium">{entity.name}</TableCell>
                          <TableCell>{entity.legal_name || '-'}</TableCell>
                          <TableCell>{entity.document_number || '-'}</TableCell>
                          <TableCell>{getStatusBadge(entity.status)}</TableCell>
                          <TableCell>{formatDate(entity.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planos Disponíveis</CardTitle>
                <CardDescription>
                  Configuração dos planos do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map(plan => (
                    <Card key={plan.id} className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {plan.name}
                          {getPlanBadge(plan.type)}
                        </CardTitle>
                        <CardDescription>
                          <span className="text-2xl font-bold text-gray-900">
                            R$ {plan.price_monthly}
                          </span>
                          <span className="text-gray-500">/mês</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>Até {plan.max_users} usuários</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-gray-400" />
                            <span>{plan.max_storage_gb} GB de armazenamento</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span>Até {plan.max_documents} documentos</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="text-sm text-gray-500">
                          {users.filter(u => u.subscription?.plan?.type === plan.type).length} usuários neste plano
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <SubscriptionPayments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
