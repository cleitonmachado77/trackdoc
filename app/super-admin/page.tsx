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
import { formatFileSize, formatStorageGB } from "@/lib/utils"
import { formatCPF, formatCEP, formatPhone } from "@/lib/format-utils"

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

interface UserLimits {
  userId: string
  planName: string
  planType: string
  maxUsers: number
  maxStorageGB: number
  currentUsers: number
  currentStorageGB: number
  currentDocuments: number // Mantido para exibição, mas sem limite
  usersLimitReached: boolean
  storageLimitReached: boolean
  usersUsagePercent: number
  storageUsagePercent: number
  isEntityData: boolean // Indica se os dados são da entidade ou do usuário solo
}

interface EntityData {
  entityId: string
  documentsCount: number // Mantido para exibição, mas sem limite
  storageGB: number
  usersCount: number
  planName: string
  maxStorageGB: number
  maxUsers: number
  storagePercent: number
  usersPercent: number
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
  const [userLimits, setUserLimits] = useState<Record<string, UserLimits>>({})
  const [entityData, setEntityData] = useState<Record<string, EntityData>>({})

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
    role: "user",
    cpf: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zipcode: ""
  })

  // Verificar autorização
  useEffect(() => {
    checkAuthorization()
  }, [user])

  const checkAuthorization = async () => {
    if (!user?.id) {
      console.log('❌ [checkAuthorization] Usuário não encontrado')
      setLoading(false)
      return
    }

    try {
      console.log('🔐 [checkAuthorization] Verificando autorização para:', user.id)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('❌ [checkAuthorization] Erro ao buscar perfil:', error)
        throw error
      }

      console.log('👤 [checkAuthorization] Perfil encontrado:', profile)

      // Apenas super_admin pode acessar
      if (profile?.role === 'super_admin') {
        console.log('✅ [checkAuthorization] Usuário autorizado como super_admin')
        setAuthorized(true)
        await loadAllData()
      } else {
        console.log('❌ [checkAuthorization] Usuário não é super_admin:', profile?.role)
        setAuthorized(false)
      }
    } catch (error) {
      console.error('❌ [checkAuthorization] Erro ao verificar autorização:', error)
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
      loadUserStats(),
      loadUserLimits(),
      loadEntityData()
    ])
  }

  const loadUsers = async () => {
    try {
      // Buscar TODOS os usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Buscar subscriptions separadamente
      const { data: subscriptionsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_id, status, start_date, end_date, current_users, current_storage_gb')

      if (subsError) {
        console.warn('Erro ao buscar subscriptions:', subsError)
      }

      // Buscar plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')

      if (plansError) {
        console.warn('Erro ao buscar plans:', plansError)
      }

      // Criar mapas
      const plansMap = new Map((plansData || []).map(p => [p.id, p]))
      const subscriptionsMap = new Map(
        (subscriptionsData || []).map(s => [s.user_id, { ...s, plan: plansMap.get(s.plan_id) }])
      )

      // Combinar dados
      const processedData = (profilesData || []).map(user => ({
        ...user,
        subscription: subscriptionsMap.get(user.id) || null
      }))
      
      setUsers(processedData || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadUserStats = async () => {
    try {
      console.log('🔄 [loadUserStats] Iniciando carregamento de estatísticas por usuário...')
      
      // Buscar todos os usuários para calcular suas estatísticas
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id')

      if (usersError) {
        console.warn('⚠️ [loadUserStats] Erro ao carregar usuários:', usersError)
        setUserStats({})
        return
      }

      console.log('👥 [loadUserStats] Usuários encontrados:', usersData?.length)

      // Calcular estatísticas para cada usuário usando a função atualizada
      // A função get_user_storage_data agora considera se o usuário pertence a uma entidade
      const statsMap: Record<string, UserStats> = {}
      
      if (usersData) {
        for (const user of usersData) {
          try {
            // Usar get_user_storage_data que já considera entidade
            const { data: userStorageData, error: storageError } = await supabase
              .rpc('get_user_storage_data', { p_user_id: user.id })

            if (storageError) {
              console.warn(`⚠️ [loadUserStats] Erro ao calcular uso para usuário ${user.id}:`, storageError)
              continue
            }

            if (userStorageData && userStorageData.length > 0) {
              const data = userStorageData[0]
              statsMap[user.id] = {
                userId: user.id,
                documentsCount: data.documents_count || 0,
                storageUsedGB: parseFloat(data.storage_gb) || 0,
                lastActivity: null // Pode ser adicionado posteriormente se necessário
              }
            } else {
              // Usuário sem documentos
              statsMap[user.id] = {
                userId: user.id,
                documentsCount: 0,
                storageUsedGB: 0,
                lastActivity: null
              }
            }
          } catch (error) {
            console.warn(`⚠️ [loadUserStats] Erro ao processar usuário ${user.id}:`, error)
          }
        }
      }

      console.log('📊 [loadUserStats] Estatísticas calculadas:', {
        totalUsers: Object.keys(statsMap).length,
        sample: Object.values(statsMap).slice(0, 2)
      })

      setUserStats(statsMap)
    } catch (error) {
      console.error('❌ [loadUserStats] Erro ao carregar estatísticas de usuários:', error)
      setUserStats({})
    }
  }

  const loadUserLimits = async () => {
    try {
      console.log('🔄 [loadUserLimits] Iniciando carregamento de dados de usuários...')
      
      // Buscar todos os usuários para calcular seus dados
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id')

      if (usersError) {
        console.warn('⚠️ [loadUserLimits] Erro ao carregar usuários:', usersError)
        setUserLimits({})
        return
      }

      console.log('👥 [loadUserLimits] Usuários encontrados:', usersData?.length)

      // Calcular dados para cada usuário usando a função atualizada
      // A função agora considera se o usuário pertence a uma entidade
      const limitsMap: Record<string, UserLimits> = {}
      
      if (usersData) {
        for (const user of usersData) {
          try {
            const { data: userStorageData, error: storageError } = await supabase
              .rpc('get_user_storage_data', { p_user_id: user.id })

            if (storageError) {
              console.warn(`⚠️ [loadUserLimits] Erro ao calcular dados para usuário ${user.id}:`, storageError)
              continue
            }

            if (userStorageData && userStorageData.length > 0) {
              const data = userStorageData[0]
              
              // A função agora retorna dados da entidade se o usuário pertencer a uma
              // ou dados individuais se for usuário solo
              // NOTA: Não há limite de documentos nos planos, apenas usuários e armazenamento
              limitsMap[user.id] = {
                userId: user.id,
                planName: data.plan_name || 'Sem plano',
                planType: data.plan_name !== 'Sem plano' ? 'active' : 'none',
                maxUsers: data.max_users || 1,
                maxStorageGB: parseFloat(data.max_storage_gb) || 0,
                currentUsers: data.users_count || 1,
                currentStorageGB: parseFloat(data.storage_gb) || 0,
                currentDocuments: data.documents_count || 0, // Apenas para exibição, sem limite
                usersLimitReached: (data.users_percent || 0) >= 100,
                storageLimitReached: (data.storage_percent || 0) >= 100,
                usersUsagePercent: data.users_percent || 0,
                storageUsagePercent: data.storage_percent || 0,
                isEntityData: data.is_entity_data || false
              }
            }
          } catch (error) {
            console.warn(`⚠️ [loadUserLimits] Erro ao processar dados do usuário ${user.id}:`, error)
          }
        }
      }

      console.log('📊 [loadUserLimits] Dados calculados:', {
        totalUsers: Object.keys(limitsMap).length,
        usersWithEntityData: Object.values(limitsMap).filter(l => l.isEntityData).length,
        sample: Object.values(limitsMap).slice(0, 2)
      })

      setUserLimits(limitsMap)
    } catch (error) {
      console.error('❌ [loadUserLimits] Erro ao carregar dados de usuários:', error)
      setUserLimits({})
    }
  }

  const loadEntityData = async () => {
    try {
      console.log('🔄 [loadEntityData] Iniciando carregamento de dados de entidades...')
      
      // Buscar todas as entidades
      const { data: entitiesData, error: entitiesError } = await supabase
        .from('entities')
        .select('id')

      if (entitiesError) {
        console.warn('⚠️ [loadEntityData] Erro ao carregar entidades:', entitiesError)
        setEntityData({})
        return
      }

      console.log('🏢 [loadEntityData] Entidades encontradas:', entitiesData?.length)

      // Calcular dados para cada entidade
      const entityMap: Record<string, EntityData> = {}
      
      if (entitiesData) {
        for (const entity of entitiesData) {
          try {
            const { data: entityStorageData, error: storageError } = await supabase
              .rpc('get_entity_storage_data', { p_entity_id: entity.id })

            if (storageError) {
              console.warn(`⚠️ [loadEntityData] Erro ao calcular dados para entidade ${entity.id}:`, storageError)
              continue
            }

            if (entityStorageData && entityStorageData.length > 0) {
              const data = entityStorageData[0]
              
              // NOTA: Não há limite de documentos nos planos, apenas usuários e armazenamento
              entityMap[entity.id] = {
                entityId: entity.id,
                documentsCount: data.documents_count || 0, // Apenas para exibição, sem limite
                storageGB: parseFloat(data.storage_gb) || 0,
                usersCount: data.users_count || 0,
                planName: data.plan_name || 'Sem plano',
                maxStorageGB: parseFloat(data.max_storage_gb) || 0,
                maxUsers: data.max_users || 0,
                storagePercent: data.storage_percent || 0,
                usersPercent: data.users_percent || 0
              }
            }
          } catch (error) {
            console.warn(`⚠️ [loadEntityData] Erro ao processar dados da entidade ${entity.id}:`, error)
          }
        }
      }

      console.log('📊 [loadEntityData] Dados de entidades calculados:', {
        totalEntities: Object.keys(entityMap).length,
        sample: Object.values(entityMap).slice(0, 2)
      })

      setEntityData(entityMap)
    } catch (error) {
      console.error('❌ [loadEntityData] Erro ao carregar dados de entidades:', error)
      setEntityData({})
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
      console.log('🔄 [loadStats] Iniciando carregamento de estatísticas...')
      
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      console.log('👥 [loadStats] Total de usuários:', totalUsers)

      // Usuários ativos
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      console.log('✅ [loadStats] Usuários ativos:', activeUsers)

      // Total de entidades
      const { count: totalEntities } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })

      console.log('🏢 [loadStats] Total de entidades:', totalEntities)

      // Total de documentos
      const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })

      console.log('📄 [loadStats] Total de documentos:', totalDocuments)

      // Calcular volume total de armazenamento
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('file_size')

      console.log('💾 [loadStats] Dados de documentos:', {
        error: docsError,
        count: documentsData?.length,
        sample: documentsData?.slice(0, 3)
      })

      let totalStorageGB = 0
      if (!docsError && documentsData) {
        const totalBytes = documentsData.reduce((total, doc) => {
          return total + (doc.file_size || 0)
        }, 0)
        totalStorageGB = totalBytes / (1024 * 1024 * 1024) // Converter bytes para GB
        console.log('💾 [loadStats] Total bytes:', totalBytes, '-> GB:', totalStorageGB)
      }

      console.log('📊 [loadStats] Volume total calculado:', totalStorageGB, 'GB')

      const statsData = {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalEntities: totalEntities || 0,
        totalDocuments: totalDocuments || 0,
        storageUsedGB: totalStorageGB,
        usersByPlan: []
      }

      console.log('📈 [loadStats] Estatísticas finais:', statsData)
      setStats(statsData)
    } catch (error) {
      console.error('❌ [loadStats] Erro ao carregar estatísticas:', error)
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
          role: "user",
          cpf: "",
          address_street: "",
          address_number: "",
          address_complement: "",
          address_neighborhood: "",
          address_city: "",
          address_state: "",
          address_zipcode: ""
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
          registration_completed: true,
          force_password_change: true, // Força alteração de senha no primeiro login
          first_login_completed: false,
          cpf: newUser.cpf || null,
          address_street: newUser.address_street || null,
          address_number: newUser.address_number || null,
          address_complement: newUser.address_complement || null,
          address_neighborhood: newUser.address_neighborhood || null,
          address_city: newUser.address_city || null,
          address_state: newUser.address_state || null,
          address_zipcode: newUser.address_zipcode || null
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
            plan_name: selectedPlan.name,
            plan_description: `Plano ${selectedPlan.name} - ${selectedPlan.max_users} usuários, ${selectedPlan.max_storage_gb}GB`,
            plan_price: selectedPlan.price_monthly,
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
        role: "user",
        cpf: "",
        address_street: "",
        address_number: "",
        address_complement: "",
        address_neighborhood: "",
        address_city: "",
        address_state: "",
        address_zipcode: ""
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

        // Buscar informações do plano
        const selectedPlan = plans.find(p => p.id === planId)
        if (!selectedPlan) {
          throw new Error('Plano não encontrado')
        }

        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            plan_name: selectedPlan.name,
            plan_description: `Plano ${selectedPlan.name} - ${selectedPlan.max_users} usuários, ${selectedPlan.max_storage_gb}GB`,
            plan_price: selectedPlan.price_monthly,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo com Logo TrackDoc */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo TrackDoc */}
            <div className="flex items-center space-x-3">
              <img 
                src="/logo-horizontal-preto.png" 
                alt="TrackDoc" 
                className="h-6 w-auto"
              />
            </div>
            
            {/* Informações do Sistema */}
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Painel Administrativo</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span>{stats?.totalUsers || 0} Usuários</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>{stats?.totalDocuments || 0} Docs</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <HardDrive className="h-3 w-3" />
                <span>{stats?.storageUsedGB?.toFixed(2) || '0.00'} GB</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal com padding-top para compensar o header fixo */}
      <div className="pt-16 p-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Usuários</p>
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats?.activeUsers || 0} ativos
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Entidades</p>
                  <p className="text-3xl font-bold">{stats?.totalEntities || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Object.values(entityData).filter(e => e.documentsCount > 0).length} com dados
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    {Object.values(userStats).filter(u => u.documentsCount > 0).length} usuários com docs
                  </p>
                </div>
                <FileText className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Volume Total</p>
                  <p className="text-3xl font-bold">{stats?.storageUsedGB?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-gray-500 mt-1">GB</p>
                </div>
                <HardDrive className="h-10 w-10 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alertas Críticos</p>
                  <p className="text-3xl font-bold text-red-600">
                    {Object.values(userLimits).filter(limits => 
                      limits.storageLimitReached || limits.usersLimitReached
                    ).length + 
                    Object.values(entityData).filter(entity => 
                      entity.storagePercent >= 100 || entity.usersPercent >= 100
                    ).length}
                  </p>
                  <p className="text-xs text-red-500 mt-1">Limites atingidos</p>
                </div>
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avisos</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {Object.values(userLimits).filter(limits => 
                      !limits.storageLimitReached && !limits.usersLimitReached &&
                      (limits.storageUsagePercent >= 80 || limits.usersUsagePercent >= 80)
                    ).length + 
                    Object.values(entityData).filter(entity => 
                      entity.storagePercent < 100 && entity.usersPercent < 100 &&
                      (entity.storagePercent >= 80 || entity.usersPercent >= 80)
                    ).length}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">Próximos do limite</p>
                </div>
                <Shield className="h-10 w-10 text-orange-500" />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Usuários por Plano */}
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

              {/* Alertas de Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Alertas do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Usuários com limites críticos */}
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Limites Críticos</p>
                          <p className="text-xs text-red-600">Usuários com 100% dos limites</p>
                        </div>
                        <Badge variant="destructive">
                          {Object.values(userLimits).filter(limits => 
                            limits.storageLimitReached || limits.usersLimitReached
                          ).length}
                        </Badge>
                      </div>
                    </div>

                    {/* Entidades com limites críticos */}
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Entidades Críticas</p>
                          <p className="text-xs text-red-600">Entidades com limites atingidos</p>
                        </div>
                        <Badge variant="destructive">
                          {Object.values(entityData).filter(entity => 
                            entity.storagePercent >= 100 || entity.usersPercent >= 100
                          ).length}
                        </Badge>
                      </div>
                    </div>

                    {/* Avisos */}
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-800">Avisos</p>
                          <p className="text-xs text-orange-600">Próximos dos limites (80%+)</p>
                        </div>
                        <Badge variant="secondary">
                          {Object.values(userLimits).filter(limits => 
                            !limits.storageLimitReached && !limits.usersLimitReached &&
                            (limits.storageUsagePercent >= 80 || limits.usersUsagePercent >= 80)
                          ).length + 
                          Object.values(entityData).filter(entity => 
                            entity.storagePercent < 100 && entity.usersPercent < 100 &&
                            (entity.storagePercent >= 80 || entity.usersPercent >= 80)
                          ).length}
                        </Badge>
                      </div>
                    </div>

                    {/* Status OK */}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Status OK</p>
                          <p className="text-xs text-green-600">Dentro dos limites normais</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {Object.values(userLimits).filter(limits => 
                            limits.storageUsagePercent < 80 && limits.usersUsagePercent < 80
                          ).length + 
                          Object.values(entityData).filter(entity => 
                            entity.storagePercent < 80 && entity.usersPercent < 80
                          ).length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Armazenamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-indigo-500" />
                    Resumo de Armazenamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Volume total */}
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">
                        {stats?.storageUsedGB?.toFixed(2) || '0.00'} GB
                      </p>
                      <p className="text-sm text-indigo-600">Volume Total Usado</p>
                    </div>

                    {/* Distribuição */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Usuários com dados:</span>
                        <span className="font-medium">
                          {Object.values(userStats).filter(u => u.storageUsedGB > 0).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Entidades com dados:</span>
                        <span className="font-medium">
                          {Object.values(entityData).filter(e => e.storageGB > 0).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Maior usuário:</span>
                        <span className="font-medium">
                          {Math.max(...Object.values(userStats).map(u => u.storageUsedGB), 0).toFixed(2)} GB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Maior entidade:</span>
                        <span className="font-medium">
                          {Math.max(...Object.values(entityData).map(e => e.storageGB), 0).toFixed(2)} GB
                        </span>
                      </div>
                    </div>
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
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                            onChange={(e) => setNewUser({ ...newUser, phone: formatPhone(e.target.value) })}
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
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={newUser.cpf}
                            onChange={(e) => setNewUser({ ...newUser, cpf: formatCPF(e.target.value) })}
                            placeholder="000.000.000-00"
                            maxLength={14}
                          />
                        </div>
                        
                        {/* Seção de Endereço */}
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-sm font-medium text-gray-900">Endereço (opcional)</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="address_street">Rua</Label>
                              <Input
                                id="address_street"
                                value={newUser.address_street}
                                onChange={(e) => setNewUser({ ...newUser, address_street: e.target.value })}
                                placeholder="Nome da rua"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_number">Número</Label>
                              <Input
                                id="address_number"
                                value={newUser.address_number}
                                onChange={(e) => setNewUser({ ...newUser, address_number: e.target.value })}
                                placeholder="123"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address_complement">Complemento</Label>
                            <Input
                              id="address_complement"
                              value={newUser.address_complement}
                              onChange={(e) => setNewUser({ ...newUser, address_complement: e.target.value })}
                              placeholder="Apto, sala, etc."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="address_neighborhood">Bairro</Label>
                              <Input
                                id="address_neighborhood"
                                value={newUser.address_neighborhood}
                                onChange={(e) => setNewUser({ ...newUser, address_neighborhood: e.target.value })}
                                placeholder="Nome do bairro"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_city">Cidade</Label>
                              <Input
                                id="address_city"
                                value={newUser.address_city}
                                onChange={(e) => setNewUser({ ...newUser, address_city: e.target.value })}
                                placeholder="Nome da cidade"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="address_state">Estado</Label>
                              <Select
                                value={newUser.address_state}
                                onValueChange={(value) => setNewUser({ ...newUser, address_state: value })}
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
                            <div className="space-y-2">
                              <Label htmlFor="address_zipcode">CEP</Label>
                              <Input
                                id="address_zipcode"
                                value={newUser.address_zipcode}
                                onChange={(e) => setNewUser({ ...newUser, address_zipcode: formatCEP(e.target.value) })}
                                placeholder="00000-000"
                                maxLength={9}
                              />
                            </div>
                          </div>
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
                                      {plan.max_users} usuários • {plan.max_storage_gb}GB
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
                        const limits = userLimits[user.id]
                        const plan = user.subscription?.plan

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
                              <div className="space-y-2">
                                {/* Documentos - sem limite, apenas contagem */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-gray-400" />
                                    <span>Docs:</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>{limits?.currentDocuments || 0}</span>
                                  </div>
                                </div>
                                
                                {/* Armazenamento */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <HardDrive className="h-3 w-3 text-gray-400" />
                                    <span>Storage:</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>{stats?.storageUsedGB?.toFixed(2) || '0.00'} GB</span>
                                    {limits && limits.maxStorageGB > 0 && (
                                      <>
                                        <span className="text-gray-400">/</span>
                                        <span>{limits.maxStorageGB} GB</span>
                                        <Badge 
                                          variant={limits.storageLimitReached ? "destructive" : 
                                                  limits.storageUsagePercent > 80 ? "secondary" : "outline"}
                                          className="text-xs ml-1"
                                        >
                                          {limits.storageUsagePercent}%
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Usuários (se pertence a uma entidade) */}
                                {limits && limits.isEntityData && (
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3 text-gray-400" />
                                      <span>Users:</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>{limits.currentUsers}</span>
                                      {limits.maxUsers > 0 && (
                                        <>
                                          <span className="text-gray-400">/</span>
                                          <span>{limits.maxUsers}</span>
                                          <Badge 
                                            variant={limits.usersLimitReached ? "destructive" : 
                                                    limits.usersUsagePercent > 80 ? "secondary" : "outline"}
                                            className="text-xs ml-1"
                                          >
                                            {limits.usersUsagePercent}%
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {/* Indicador de dados da entidade */}
                                {limits && limits.isEntityData && (
                                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    <span>Dados da entidade</span>
                                  </div>
                                )}
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
                  Visualize todas as entidades (empresas) do sistema com dados de uso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Razão Social</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entities.map(entity => {
                        const data = entityData[entity.id]
                        
                        return (
                          <TableRow key={entity.id}>
                            <TableCell className="font-medium">{entity.name}</TableCell>
                            <TableCell>{entity.legal_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={data?.planName !== 'Sem plano' ? 'default' : 'outline'}>
                                {data?.planName || 'Sem plano'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                {/* Usuários */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-gray-400" />
                                    <span>Usuários:</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>{data?.usersCount || 0}</span>
                                    {data && data.maxUsers > 0 && (
                                      <>
                                        <span className="text-gray-400">/</span>
                                        <span>{data.maxUsers}</span>
                                        <Badge 
                                          variant={data.usersPercent >= 100 ? "destructive" : 
                                                  data.usersPercent >= 80 ? "secondary" : "outline"}
                                          className="text-xs ml-1"
                                        >
                                          {data.usersPercent}%
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Documentos */}
                                {/* Documentos - sem limite, apenas contagem */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-gray-400" />
                                    <span>Docs:</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>{data?.documentsCount || 0}</span>
                                  </div>
                                </div>
                                
                                {/* Armazenamento */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <HardDrive className="h-3 w-3 text-gray-400" />
                                    <span>Storage:</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>{data?.storageGB?.toFixed(2) || '0.00'} GB</span>
                                    {data && data.maxStorageGB > 0 && (
                                      <>
                                        <span className="text-gray-400">/</span>
                                        <span>{data.maxStorageGB} GB</span>
                                        <Badge 
                                          variant={data.storagePercent >= 100 ? "destructive" : 
                                                  data.storagePercent >= 80 ? "secondary" : "outline"}
                                          className="text-xs ml-1"
                                        >
                                          {data.storagePercent}%
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(entity.status)}</TableCell>
                            <TableCell>{formatDate(entity.created_at)}</TableCell>
                          </TableRow>
                        )
                      })}
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
                            <span>Documentos ilimitados</span>
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
    </div>
  )
}

export const dynamic = 'force-dynamic'
