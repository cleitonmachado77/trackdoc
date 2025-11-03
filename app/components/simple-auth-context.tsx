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
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.warn('Erro ao obter sessão:', error.message)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        if (!isMounted) return
        console.warn('Erro ao verificar sessão:', error)
        setSession(null)
        setUser(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listener de mudanças de autenticação otimizado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        
        console.log('Auth state changed:', event)
        
        // Otimizar eventos para reduzir re-renderizações
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh falhou, limpando sessão')
          setSession(null)
          setUser(null)
        } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
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
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: { message: 'Supabase não inicializado' } }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.com.br'}/reset-password`
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