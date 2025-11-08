import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useSupabase } from '@/lib/hooks/use-supabase'

export interface Plan {
  id: string
  name: string
  description: string
  price_monthly: string
  price_yearly: string
  max_users: number
  max_storage_gb: number
  max_documents: number
  trial_days: number
  is_trial: boolean
  features: string[]
  is_active: boolean
}

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  permissions: string[]
  avatar_url?: string
  phone?: string
  department?: string
  position?: string
  entity_id?: string
  selected_plan_id?: string
  registration_completed: boolean
  registration_type: string
  entity_role: string
  last_login?: string
  created_at: string
  updated_at: string
}

export interface UserUsage {
  id: string
  user_id: string
  metric_name: string
  current_usage: number
  limit_value: number
  period_start: string
  period_end: string
}

export interface Department {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface DocumentType {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, isConnected } = useSupabase()

  useEffect(() => {
    if (!isConnected || !supabase) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly')

        if (error) throw error
        
        if (isMounted) {
          setPlans(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar planos')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPlans()

    return () => {
      isMounted = false
    }
  }, [supabase, isConnected])

  return { plans, loading, error }
}

// Cache global para perfil do usuário
let profileCache: { profile: UserProfile | null; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function fetchProfile() {
      try {
        // Verificar cache primeiro
        const now = Date.now()
        if (profileCache && (now - profileCache.timestamp) < CACHE_DURATION) {
          console.log('✅ [useUserProfile] Usando perfil do cache')
          if (isMounted) {
            setProfile(profileCache.profile)
            setLoading(false)
          }
          return
        }

        console.log('🔍 [useUserProfile] Buscando perfil para usuário:', user.id)
        
        // Usar API personalizada para buscar perfil
        const response = await fetch('/api/profile')
        const result = await response.json()

        if (!response.ok) {
          // Se for erro 401 com código PROFILE_NOT_FOUND, forçar logout
          if (response.status === 401 && result.code === 'PROFILE_NOT_FOUND') {
            console.log('⚠️ [useUserProfile] Perfil não encontrado - forçando logout completo')
            
            // Limpar autenticação e redirecionar para login
            if (typeof window !== 'undefined') {
              // Limpar todos os dados de autenticação
              localStorage.clear()
              sessionStorage.clear()
              
              // Limpar cookies do Supabase
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              
              // Forçar reload completo da página para limpar estado
              console.log('🔄 [useUserProfile] Redirecionando para login...')
              window.location.replace('/login')
            }
            return
          }
          throw new Error(result.error || 'Erro ao buscar perfil')
        }

        if (!result.success) {
          throw new Error(result.error || 'Erro na resposta da API')
        }

        // Atualizar cache
        profileCache = {
          profile: result.profile,
          timestamp: Date.now()
        }

        if (isMounted) {
          setProfile(result.profile)
          console.log('✅ [useUserProfile] Perfil carregado via API e armazenado em cache')
        }
      } catch (err) {
        console.error('❌ [useUserProfile] Erro geral:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Usuário não autenticado')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [user])

  return { profile, loading, error }
}

// Função para limpar o cache do perfil (útil após atualizações)
export function clearProfileCache() {
  profileCache = null
}

export function useUserUsage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UserUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setUsage([])
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchUsage = async () => {
      try {
        // Por enquanto, retornar array vazio até a tabela usage ser criada
        if (isMounted) {
          setUsage([])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar uso')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUsage()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  return { usage, loading, error }
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, isConnected } = useSupabase()

  useEffect(() => {
    if (!isConnected || !supabase) {
      setLoading(false)
      return
    }

    async function fetchDepartments() {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .order('name')

        if (error) throw error
        setDepartments(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar departamentos')
      } finally {
        setLoading(false)
      }
    }

    fetchDepartments()
  }, [supabase, isConnected])

  return { departments, loading, error }
}

export function useDocumentTypes() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, isConnected } = useSupabase()

  useEffect(() => {
    if (!isConnected || !supabase) {
      setLoading(false)
      return
    }

    async function fetchDocumentTypes() {
      try {
        const { data, error } = await supabase
          .from('document_types')
          .select('*')
          .order('name')

        if (error) throw error
        setDocumentTypes(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar tipos de documento')
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentTypes()
  }, [supabase, isConnected])

  return { documentTypes, loading, error }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, isConnected } = useSupabase()

  useEffect(() => {
    if (!isConnected || !supabase) {
      setLoading(false)
      return
    }

    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (error) throw error
        setCategories(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar categorias')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [supabase, isConnected])

  return { categories, loading, error }
} 