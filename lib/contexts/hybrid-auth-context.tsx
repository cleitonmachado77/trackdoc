"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient, checkConnection } from "@/lib/supabase-client"
import { SupabaseConfigError } from "../../app/components/supabase-config-error"

interface ConnectionStatus {
    connected: boolean
    usingProxy: boolean
    method: 'direct' | 'proxy' | 'none'
    error?: string
}

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    authError: string | null
    connectionStatus: ConnectionStatus
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<{ error: any }>
    updatePassword: (newPassword: string) => Promise<{ error: any }>
    clearAuthError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function HybridAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState<string | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        connected: false,
        usingProxy: false,
        method: 'none'
    })
    const [supabaseClient, setSupabaseClient] = useState<any>(null)

    // Verificar se as variáveis de ambiente estão configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        return <SupabaseConfigError />
    }

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                console.log('🔄 Inicializando conexão com Supabase...')

                // Verificar conexão e obter cliente
                const status = await checkConnection()
                const { client, isUsingProxy } = await getSupabaseClient()

                if (mounted) {
                    setConnectionStatus({
                        connected: status.connected,
                        usingProxy: isUsingProxy,
                        method: status.method as 'direct' | 'proxy' | 'none',
                        error: status.error
                    })

                    setSupabaseClient(client)

                    if (status.connected) {
                        console.log(`✅ Conectado via ${status.method} ${isUsingProxy ? '(proxy)' : '(direto)'}`)

                        // Obter sessão atual
                        const { data: { session }, error } = await client.auth.getSession()

                        if (session && !error) {
                            setSession(session)
                            setUser(session.user)
                        }

                        // Escutar mudanças de autenticação
                        const { data: { subscription } } = client.auth.onAuthStateChange(
                            async (event: string, session: Session | null) => {
                                console.log('Auth state change:', event)
                                setSession(session)
                                setUser(session?.user ?? null)
                                // Garantir que o loading seja false após qualquer mudança de estado
                                setLoading(false)
                            }
                        )

                        // Definir loading como false após configurar tudo
                        setLoading(false)

                        // Cleanup
                        return () => {
                            subscription.unsubscribe()
                        }
                    } else {
                        console.error('❌ Não foi possível conectar:', status.error)
                        setAuthError('Não foi possível conectar ao servidor de autenticação')
                        setLoading(false)
                    }
                }
            } catch (error) {
                console.error('Erro na inicialização:', error)
                if (mounted) {
                    setAuthError('Erro ao inicializar sistema de autenticação')
                    setLoading(false)
                }
            }
        }

        initializeAuth()

        return () => {
            mounted = false
        }
    }, [])

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            if (!supabaseClient) {
                return { error: { message: 'Cliente não inicializado' } }
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (error) {
                setAuthError(error.message)
                return { error }
            }

            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro interno do servidor'
            setAuthError(errorMessage)
            return { error: { message: errorMessage } }
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            if (!supabaseClient) {
                return { error: { message: 'Cliente não inicializado' } }
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setAuthError(error.message)
                return { error }
            }

            if (data.session) {
                setSession(data.session)
                setUser(data.session.user)
            }

            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro interno do servidor'
            setAuthError(errorMessage)
            return { error: { message: errorMessage } }
        }
    }

    const signOut = async () => {
        try {
            if (supabaseClient) {
                await supabaseClient.auth.signOut()
            }

            setSession(null)
            setUser(null)
            setAuthError(null)
        } catch (err) {
            console.error('Erro no logout:', err)
        }
    }

    const resetPassword = async (email: string) => {
        try {
            if (!supabaseClient) {
                return { error: { message: 'Cliente não inicializado' } }
            }

            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            return { error }
        } catch (err) {
            return { error: { message: 'Erro ao resetar senha' } }
        }
    }

    const updatePassword = async (newPassword: string) => {
        try {
            if (!supabaseClient) {
                return { error: { message: 'Cliente não inicializado' } }
            }

            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            })

            return { error }
        } catch (err) {
            return { error: { message: 'Erro ao atualizar senha' } }
        }
    }

    const clearAuthError = () => {
        setAuthError(null)
    }

    const value = {
        user,
        session,
        loading,
        authError,
        connectionStatus,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        clearAuthError,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within a HybridAuthProvider")
    }
    return context
}