"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'

interface ProfileContextType {
  profile: any | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedProfile = useRef(false)

  const loadProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      hasLoadedProfile.current = false
      return
    }

    // Evitar recarregamento se já foi carregado
    if (hasLoadedProfile.current && profile) {
      console.log('⏭️ [ProfileContext] Perfil já carregado, pulando...')
      return
    }

    try {
      setLoading(true)
      console.log('📥 [ProfileContext] Carregando perfil...')
      
      // Timeout de 5 segundos para evitar travamento
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar perfil')), 5000)
      )
      
      const fetchPromise = fetch('/api/profile').then(async (response) => {
        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401 && result.code === 'PROFILE_NOT_FOUND') {
            console.log('❌ [ProfileContext] Perfil não encontrado')
            localStorage.clear()
            sessionStorage.clear()
            window.location.replace('/login')
            return null
          }
          throw new Error(result.error || 'Erro ao carregar perfil')
        }

        if (!result.success) {
          throw new Error(result.error || 'Erro na resposta da API')
        }

        return result.profile
      })

      const profileData = await Promise.race([fetchPromise, timeoutPromise])
      
      if (profileData) {
        setProfile(profileData)
        setError(null)
        hasLoadedProfile.current = true
        console.log('✅ [ProfileContext] Perfil carregado')
      }
    } catch (err) {
      console.error('❌ [ProfileContext] Erro:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar perfil'
      setError(errorMessage)
      
      // Se for timeout, continuar com perfil básico do user
      if (errorMessage.includes('Timeout')) {
        console.warn('⚠️ [ProfileContext] Usando perfil básico devido a timeout')
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          role: 'user',
          status: 'active'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Aguardar autenticação terminar antes de carregar perfil
    if (authLoading) {
      console.log('⏳ [ProfileContext] Aguardando autenticação...')
      return
    }
    
    // Só carregar perfil se não tiver sido carregado ainda
    if (user && !profile && !loading) {
      loadProfile()
    } else if (!user) {
      setProfile(null)
      setLoading(false)
    }
  }, [user?.id, authLoading])

  const refreshProfile = async () => {
    await loadProfile()
  }

  // ✅ NÃO BLOQUEAR A RENDERIZAÇÃO
  // Componentes individuais devem verificar loading e mostrar skeleton local
  // Isso evita que toda a aplicação fique travada esperando o perfil

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
