"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

interface SimpleAuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  authError: string | null
  connectionStatus: { connected: boolean; method: string } | null
  subscription: any | null
  entity: any | null
  usage: any[] | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  clearAuthError: () => void
  clearAuthData: () => Promise<void>
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [connectionStatus] = useState({ connected: true, method: 'direct' })
  const [subscription] = useState(null)
  const [entity] = useState(null)
  const [usage] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const supabase = getSupabaseSingleton()

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase singleton não disponível')
      setLoading(false)
      return
    }

    let isMounted = true

    // Verificar sessão atual com tratamento de erro otimizado
    const initializeAuth = async () => {
      // Evitar reinicialização se já foi inicializado
      if (isInitialized) {
        console.log('⏭️ [Auth] Já inicializado, pulando...')
        return
      }

      try {
        console.log('🔐 [Auth] Iniciando verificação de sessão...')
        
        // ✅ Timeout de 3 segundos para evitar travamento
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (!isMounted) return
        
        if (error) {
          console.warn('⚠️ [Auth] Erro ao obter sessão:', error.message)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          console.log('✅ [Auth] Sessão carregada:', session?.user?.id ? 'Autenticado' : 'Não autenticado')
        }
        
        setIsInitialized(true)
      } catch (error) {
        if (!isMounted) return
        console.warn('❌ [Auth] Erro ao verificar sessão:', error)
        // Em caso de timeout, continuar sem sessão
        setSession(null)
        setUser(null)
        setIsInitialized(true)
      } finally {
        if (isMounted) {
          setLoading(false)
          console.log('✅ [Auth] Carregamento finalizado')
        }
      }
    }

    initializeAuth()

    // Listener de mudanças de autenticação otimizado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        
        console.log('🔄 [Auth] Estado mudou:', event)
        
        // Ignorar TOKEN_REFRESHED para evitar recarregamentos desnecessários
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 [Auth] Token atualizado silenciosamente')
          return
        }
        
        // Ignorar SIGNED_OUT se já estamos sem usuário (evita loop)
        if (event === 'SIGNED_OUT' && !user) {
          console.log('⏭️ [Auth] SIGNED_OUT ignorado - já sem usuário')
          return
        }
        
        // Apenas reagir a mudanças significativas de autenticação
        if (event === 'SIGNED_IN') {
          setSession(session)
          setUser(session?.user ?? null)
        } else if (event === 'SIGNED_OUT') {
          // Não atualizar estado aqui, deixar o signOut fazer isso
          console.log('🚪 [Auth] SIGNED_OUT detectado')
        }
        
        if (loading) {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase não inicializado' } }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: { message: 'Supabase não inicializado' } }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    return { error }
  }

  const signOut = async () => {
    if (!supabase) return
    
    try {
      console.log('🚪 [Auth] Iniciando logout...')
      
      // Fazer logout no Supabase PRIMEIRO
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error('❌ [Auth] Erro ao fazer logout no Supabase:', error)
      } else {
        console.log('✅ [Auth] Logout no Supabase concluído')
      }
      
      // Limpar TODOS os dados do localStorage/sessionStorage ANTES de limpar estado
      if (typeof window !== 'undefined') {
        console.log('🧹 [Auth] Limpando storage...')
        
        // Limpar todos os itens do Supabase
        const keysToRemove: string[] = []
        
        // localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          console.log(`🗑️ [Auth] Removendo localStorage: ${key}`)
          localStorage.removeItem(key)
        })
        
        // sessionStorage
        const sessionKeysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            sessionKeysToRemove.push(key)
          }
        }
        sessionKeysToRemove.forEach(key => {
          console.log(`🗑️ [Auth] Removendo sessionStorage: ${key}`)
          sessionStorage.removeItem(key)
        })
        
        console.log('✅ [Auth] Storage limpo')
      }
      
      // Limpar estado local DEPOIS
      setSession(null)
      setUser(null)
      setAuthError(null)
      setIsInitialized(false)
      
      // Aguardar para garantir que tudo foi processado
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Redirecionar para login interno com reload forçado
      if (typeof window !== 'undefined') {
        console.log('🔄 [Auth] Redirecionando para /login')
        // Usar replace e adicionar timestamp para forçar reload
        window.location.replace('/login?t=' + Date.now())
      }
    } catch (error) {
      console.error('❌ [Auth] Erro ao fazer logout:', error)
      // Mesmo com erro, limpar e redirecionar
      setSession(null)
      setUser(null)
      setAuthError(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: { message: 'Supabase não inicializado' } }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.app.br'}/reset-password`
    })
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    if (!supabase) return { error: { message: 'Supabase não inicializado' } }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  }

  const clearAuthError = () => {
    setAuthError(null)
  }

  const clearAuthData = async () => {
    if (!supabase) return
    
    // Fazer logout completo
    await supabase.auth.signOut()
    
    // Limpar estado local
    setSession(null)
    setUser(null)
    setAuthError(null)
    
    // Limpar localStorage/sessionStorage (se estiver no browser)
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key)
        }
      })
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          sessionStorage.removeItem(key)
        }
      })
    }
  }

  const value = {
    user,
    session,
    loading,
    authError,
    connectionStatus,
    subscription,
    entity,
    usage,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updatePassword,
    clearAuthError,
    clearAuthData,
  }

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  )
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext)
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider')
  }
  return context
}