"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { User, Session } from "@supabase/supabase-js"
import { SupabaseConfigError } from "../../app/components/supabase-config-error"
import { handleAuthError, isRefreshTokenError, clearUserSession } from "@/lib/auth-error-handler"
import { getUserActiveSubscription } from "@/lib/subscription-utils"
import { cleanupAuthData, isAuthDataCorrupted } from "@/lib/auth-cleanup"

interface Subscription {
  id?: string
  subscription_id?: string
  user_id?: string
  plan_id?: string
  plan_name?: string
  plan_description?: string
  plan_price?: number
  status: string
  current_period_start?: string
  current_period_end?: string
  start_date?: string
  end_date?: string
  trial_start?: string
  trial_end?: string
  trial_end_date?: string
  is_trial?: boolean
  days_remaining?: number
  features?: any
  created_at?: string
  updated_at?: string
  plan?: {
    id: string
    name: string
    price: number
    interval: string
    features: string[]
  }
}

interface Entity {
  id: string
  name: string
  legal_name?: string
  email: string
  status: string
  max_users: number
  current_users: number
}

interface Usage {
  metric_name: string
  current_usage: number
  limit_value: number
  usage_percentage: number
}

interface AuthContextType {
  user: User | null
  session: Session | null
  subscription: Subscription | null
  entity: Entity | null
  usage: Usage[]
  loading: boolean
  authError: string | null
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  createSubscription: (planId: string, isTrial: boolean) => Promise<{ error: any, data?: any }>
  createSubscriptionForNewUser: (userId: string, planId: string, isTrial: boolean) => Promise<{ error: any, data?: any }>
  upgradeSubscription: (planId: string) => Promise<{ error: any, data?: any }>
  refreshSubscription: () => Promise<void>
  refreshUsage: () => Promise<void>
  refreshEntity: () => Promise<void>
  clearAuthError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [entity, setEntity] = useState<Entity | null>(null)
  const [usage, setUsage] = useState<Usage[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // Verificar se as variaveis de ambiente estao configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Variaveis de ambiente do Supabase nao configuradas!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Configurado' : 'Nao configurado')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Configurado' : 'Nao configurado')

    // Mostrar componente de erro de configuracao
    return <SupabaseConfigError />
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    let mounted = true

    // Verificar sessao inicial
    const getSession = async () => {
      try {
        // Verificar e limpar dados corrompidos
        if (isAuthDataCorrupted()) {
          console.log('Dados de autenticação corrompidos detectados, limpando...')
          cleanupAuthData()
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (mounted) {
          // Tratar erro de autenticação
          if (error) {
            const errorHandler = handleAuthError(error)
            console.log(errorHandler.logMessage)

            if (errorHandler.shouldLogout || isRefreshTokenError(error)) {
              await clearUserSession(supabase)
              setSession(null)
              setUser(null)
              setSubscription(null)
              setUsage([])
              setEntity(null)
              setAuthError(null) // Não mostrar erro na inicialização
            } else {
              // Para outros erros, ainda tentar usar a sessão se existir
              setSession(session)
              setUser(session?.user ?? null)
              setAuthError(null) // Não mostrar erro na inicialização

              if (session?.user) {
                await refreshSubscription()
                await refreshUsage()
                await refreshEntity()
              }
            }
          } else {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
              await refreshSubscription()
              await refreshUsage()
              await refreshEntity()
            }
          }

          setLoading(false)
        }
      } catch (error) {
        const errorHandler = handleAuthError(error as any)
        console.error(errorHandler.logMessage)

        if (mounted) {
          // Em caso de erro crítico, limpar sessão e fazer logout
          await clearUserSession(supabase)
          setSession(null)
          setUser(null)
          setSubscription(null)
          setUsage([])
          setEntity(null)
          setLoading(false)
        }
      }
    }

    getSession()

    // Escutar mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          console.log('Auth state change:', event, session?.user?.id)

          // Tratar eventos de erro de refresh token
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.log('Refresh token inválido - fazendo logout automático')
            await clearUserSession(supabase)
            setSession(null)
            setUser(null)
            setSubscription(null)
            setUsage([])
            setEntity(null)
            setLoading(false)
            return
          }

          // Tratar outros eventos de erro
          if (event === 'SIGNED_OUT') {
            setSession(null)
            setUser(null)
            setSubscription(null)
            setUsage([])
            setEntity(null)
            setLoading(false)
            return
          }

          // Silenciar erros de refresh token na inicialização
          if (event === 'INITIAL_SESSION' && !session) {
            setSession(null)
            setUser(null)
            setSubscription(null)
            setUsage([])
            setEntity(null)
            setLoading(false)
            return
          }

          setSession(session)
          setUser(session?.user ?? null)

          // Evitar atualizacoes desnecessarias se o usuario nao mudou
          if (session?.user?.id !== user?.id) {
            if (session?.user) {
              await refreshSubscription()
              await refreshUsage()
              await refreshEntity()
            } else {
              setSubscription(null)
              setUsage([])
              setEntity(null)
            }
          }

          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Tentando registrar usuario:', { email, fullName })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error('Erro no signUp:', error)
        return { error }
      }

      if (data?.user) {
        console.log('Usuario criado com sucesso:', data.user.id)
        console.log('Perfil sera criado automaticamente pelo trigger handle_new_user')
        console.log('Email de confirmacao enviado. Aguardando confirmacao do usuario.')

        // NAO verificar o perfil imediatamente - aguardar confirmacao do email
        // O trigger handle_new_user criara o perfil quando o email for confirmado
      }

      return { error }
    } catch (err) {
      console.error('Erro inesperado no signUp:', err)
      return {
        error: {
          message: err instanceof Error ? err.message : 'Erro interno do servidor',
          status: 500
        }
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login:', { email })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Erro no signIn:', error)
        return { error }
      }

      if (data?.user) {
        console.log('Login realizado com sucesso:', data.user.id)
      }

      return { error }
    } catch (err) {
      console.error('Erro inesperado no signIn:', err)
      return {
        error: {
          message: err instanceof Error ? err.message : 'Erro interno do servidor',
          status: 500
        }
      }
    }
  }

  const signOut = async () => {
    try {
      console.log('Tentando fazer logout')
      await supabase.auth.signOut()
      console.log('Logout realizado com sucesso')
    } catch (err) {
      console.error('Erro no logout:', err)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    return { error }
  }

  const refreshSubscription = async () => {
    if (!user) return

    try {
      console.log('🔄 [refreshSubscription] Buscando subscription para usuário:', user.id)

      const result = await getUserActiveSubscription(user.id)

      if (result.error) {
        console.error('❌ [refreshSubscription] Erro:', result.error)
        console.log('📊 [refreshSubscription] Método usado:', result.method)
        setSubscription(null)
      } else {
        console.log('✅ [refreshSubscription] Subscription encontrada:', result.subscription?.id)
        console.log('📊 [refreshSubscription] Método usado:', result.method)
        setSubscription(result.subscription)
      }
    } catch (err) {
      console.error('❌ [refreshSubscription] Erro geral:', err)
      setSubscription(null)
    }
  }

  const refreshUsage = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('get_user_usage', {
        p_user_id: user.id
      })

      if (!error && data) {
        setUsage(data)
      } else {
        setUsage([])
      }
    } catch (err) {
      console.error('Erro ao buscar usage:', err)
      setUsage([])
    }
  }

  const createSubscription = async (planId: string, isTrial: boolean) => {
    if (!user) {
      return { error: { message: 'Usuario nao autenticado' } }
    }

    try {
      // Aguardar ate que o perfil seja criado (maximo 10 segundos)
      let profileExists = false
      let attempts = 0
      const maxAttempts = 10

      while (!profileExists && attempts < maxAttempts) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (profileData && !profileError) {
          profileExists = true
          console.log('Perfil encontrado, criando assinatura...')
          break
        }

        console.log(`Tentativa ${attempts + 1}/${maxAttempts}: Aguardando criacao do perfil...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }

      if (!profileExists) {
        console.error('Perfil nao foi criado apos 10 segundos')
        return {
          error: {
            message: 'Erro: Perfil do usuario nao foi criado automaticamente. Tente novamente.',
            status: 500
          }
        }
      }

      // Agora criar a assinatura
      console.log('Tentando criar assinatura com:', {
        user_id: user.id,
        plan_id: planId,
        is_trial: isTrial
      })

      const { data, error } = await supabase.rpc('create_user_subscription_with_plan', {
        p_user_id: user.id,
        p_plan_id: planId,
        p_is_trial: isTrial
      })

      console.log('Resposta da funcao RPC:', { data, error })

      if (error) {
        console.error('Erro ao criar assinatura:', error)
        return { error }
      }

      // Atualizar dados locais
      await refreshSubscription()
      await refreshUsage()

      return { error: null, data }
    } catch (err) {
      console.error('Erro inesperado ao criar assinatura:', err)
      return {
        error: {
          message: err instanceof Error ? err.message : 'Erro interno do servidor',
          status: 500
        }
      }
    }
  }

  const createSubscriptionForNewUser = async (userId: string, planId: string, isTrial: boolean) => {
    try {
      console.log('Criando assinatura para novo usuario:', {
        userId,
        planId,
        isTrial
      })

      // Tentar chamar a funcao RPC com retry primeiro
      console.log('Chamando funcao RPC com retry...')

      let { data, error } = await supabase.rpc('create_simple_trial_subscription', {
        p_user_id: userId,
        p_plan_id: planId,
        p_is_trial: isTrial
      })

      // Se a funcao com retry nao existir, usar a funcao original
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('Funcao com retry nao encontrada, usando funcao original...')

        const { data: originalData, error: originalError } = await supabase.rpc('create_user_trial_subscription', {
          user_id: userId,
          plan_id: planId,
          is_trial: isTrial
        })

        data = originalData
        error = originalError
      }

      console.log('Resposta da funcao RPC para novo usuario:', { data, error })

      if (error) {
        console.error('Erro detalhado da funcao RPC:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return { error }
      }

      return { error: null, data }
    } catch (error) {
      console.error('Erro inesperado ao criar assinatura para novo usuario:', error)
      return { error: { message: 'Erro interno do servidor' } }
    }
  }

  const upgradeSubscription = async (planId: string) => {
    if (!user) {
      return { error: { message: 'Usuario nao autenticado' } }
    }

    try {
      const { data, error } = await supabase.rpc('upgrade_subscription', {
        p_user_id: user.id,
        p_new_plan_id: planId
      })

      if (error) {
        console.error('Erro ao atualizar assinatura:', error)
        return { error }
      }

      // Atualizar dados locais
      await refreshSubscription()
      await refreshUsage()

      return { error: null, data }
    } catch (err) {
      console.error('Erro inesperado ao atualizar assinatura:', err)
      return {
        error: {
          message: err instanceof Error ? err.message : 'Erro interno do servidor',
          status: 500
        }
      }
    }
  }

  const refreshEntity = async () => {
    if (!user) {
      return
    }

    console.log('🔄 [REFRESH_ENTITY] Iniciando busca de entidade para usuário:', user.id)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ [REFRESH_ENTITY] Erro ao buscar entity_id do perfil:', profileError)
        setEntity(null)
        return
      }

      console.log('✅ [REFRESH_ENTITY] Profile data:', profileData)

      if (profileData?.entity_id) {
        console.log('🔄 [REFRESH_ENTITY] Buscando dados da entidade:', profileData.entity_id)

        const { data: entityData, error: entityError } = await supabase
          .from('entities')
          .select('*')
          .eq('id', profileData.entity_id)
          .single()

        if (entityError) {
          console.error('❌ [REFRESH_ENTITY] Erro ao buscar dados da entidade:', entityError)
          setEntity(null)
          return
        }

        console.log('✅ [REFRESH_ENTITY] Entity data encontrada:', entityData)
        setEntity(entityData)
      } else {
        console.log('⚠️ [REFRESH_ENTITY] Usuário não possui entity_id')
        setEntity(null)
      }
    } catch (err) {
      console.error('❌ [REFRESH_ENTITY] Erro ao atualizar dados da entidade:', err)
      setEntity(null)
    }
  }

  const clearAuthError = () => {
    setAuthError(null)
  }

  const value = {
    user,
    session,
    subscription,
    entity,
    usage,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    createSubscription,
    createSubscriptionForNewUser,
    upgradeSubscription,
    refreshSubscription,
    refreshUsage,
    refreshEntity,
    clearAuthError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 