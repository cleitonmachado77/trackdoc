"use client"

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { User, Session } from '@supabase/supabase-js'

interface ProductionAuthWrapperProps {
  children: React.ReactNode
}

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export default function ProductionAuthWrapper({ children }: ProductionAuthWrapperProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true
    let supabase: any = null

    async function initializeAuth() {
      try {
        // Verificar variáveis de ambiente
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Variáveis de ambiente do Supabase não configuradas')
        }

        // Criar cliente Supabase simples para produção
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        })

        // Verificar sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError)
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: sessionError.message
            })
          }
          return
        }

        if (mounted) {
          setAuthState({
            user: session?.user || null,
            session: session,
            loading: false,
            error: null
          })
        }

        // Configurar listener de mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email)
            
            if (mounted) {
              setAuthState({
                user: session?.user || null,
                session: session,
                loading: false,
                error: null
              })
            }
          }
        )

        return () => {
          subscription?.unsubscribe()
        }

      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error)
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  // Mostrar loading
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando autenticação...</p>
        </div>
      </div>
    )
  }

  // Mostrar erro se houver
  if (authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-red-800 font-semibold mb-2">Erro de Autenticação</h2>
            <p className="text-red-600 text-sm">{authState.error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}