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

    // Listener de mudanças de autenticação - SIMPLIFICADO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        
        console.log('🔄 [Auth] Estado mudou:', event)
        
        // Ignorar eventos que não precisamos processar
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
          console.log('⏭️ [Auth] Evento ignorado:', event)
          return
        }
        
        // Apenas processar SIGNED_IN
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ [Auth] SIGNED_IN - Atualizando estado')
          setSession(session)
          setUser(session.user)
          setIsInitialized(true)
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

    try {
      // Limpar completamente qualquer sessão anterior antes de tentar login
      console.log('🧹 [Auth] Limpando sessão anterior...')
      await supabase.auth.signOut({ scope: 'global' })
      
      // Limpar storage e estado
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      setSession(null)
      setUser(null)
      
      // Aguardar um pouco para garantir que a limpeza foi concluída
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error }

      // Verificar se o usuário está ativo
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Erro ao verificar status do usuário:', profileError)
          // Fazer logout em caso de erro
          await supabase.auth.signOut({ scope: 'global' })
          return { error: profileError }
        }

        if (profile?.status === 'inactive') {
          console.log('🚫 [Auth] Usuário inativo detectado, fazendo logout...')
          // Fazer logout completo e limpar storage
          await supabase.auth.signOut({ scope: 'global' })
          
          // Limpar estado local
          setSession(null)
          setUser(null)
          
          // Limpar storage local
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
            
            // Limpar cookies
            document.cookie.split(";").forEach((c) => {
              document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })
          }
          
          return { 
            error: { 
              message: 'Sua conta está inativa. Entre em contato com o administrador.' 
            } 
          }
        }

        if (profile?.status === 'suspended') {
          console.log('🚫 [Auth] Usuário suspenso detectado, fazendo logout...')
          // Fazer logout completo e limpar storage
          await supabase.auth.signOut({ scope: 'global' })
          
          // Limpar estado local
          setSession(null)
          setUser(null)
          
          // Limpar storage local
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
            
            // Limpar cookies
            document.cookie.split(";").forEach((c) => {
              document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })
          }
          
          return { 
            error: { 
              message: 'Sua conta está suspensa. Entre em contato com o administrador.' 
            } 
          }
        }
      }

      return { error }
    } catch (err) {
      console.error('Erro no signIn:', err)
      return { error: { message: 'Erro ao fazer login' } }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: { message: 'Supabase não inicializado' } }

    try {
      // Verificar se o email já existe antes de tentar criar
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .limit(1)

      if (checkError) {
        console.error('Erro ao verificar email:', checkError)
        // Continuar mesmo com erro na verificação
      }

      if (existingUsers && existingUsers.length > 0) {
        return { 
          error: { 
            message: 'Este email já está cadastrado. Faça login ou use outro email.' 
          } 
        }
      }

      // Criar usuário
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      // Tratar erros específicos
      if (error) {
        if (error.message.includes("already registered") || 
            error.message.includes("User already registered") ||
            error.message.includes("duplicate key")) {
          return { 
            error: { 
              message: 'Este email já está cadastrado. Faça login ou use outro email.' 
            } 
          }
        }
      }

      return { error }
    } catch (err) {
      console.error('Erro no signUp:', err)
      return { error: { message: 'Erro ao criar conta. Tente novamente.' } }
    }
  }

  const signOut = async () => {
    if (!supabase) return
    
    console.log('🚪 [Auth] Iniciando logout...')
    
    try {
      // Fazer logout no Supabase
      await supabase.auth.signOut({ scope: 'global' })
      console.log('✅ [Auth] Logout no Supabase concluído')
    } catch (error) {
      console.error('❌ [Auth] Erro ao fazer logout no Supabase:', error)
    }
    
    // Limpar TODO o storage
    if (typeof window !== 'undefined') {
      console.log('🧹 [Auth] Limpando storage...')
      
      // Limpar cookies do Supabase manualmente
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      localStorage.clear()
      sessionStorage.clear()
      
      console.log('✅ [Auth] Storage e cookies limpos')
      console.log('🔄 [Auth] Recarregando página...')
      
      // Forçar reload COMPLETO da página (como se fechasse e abrisse)
      window.location.replace('/login')
      // Fallback caso replace não funcione
      setTimeout(() => {
        window.location.href = '/login'
      }, 50)
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