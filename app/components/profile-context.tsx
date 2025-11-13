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

  const loadProfile = async (forceRefresh = false) => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      hasLoadedProfile.current = false
      return
    }

    // Evitar recarregamento se já foi carregado (exceto quando forçado)
    if (!forceRefresh && hasLoadedProfile.current && profile) {
      console.log('⏭️ [ProfileContext] Perfil já carregado, pulando...')
      return
    }

    try {
      setLoading(true)
      console.log('📡 [ProfileContext] Buscando perfil da API...')
      
      // Adicionar timestamp para evitar cache do navegador
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/profile?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ [ProfileContext] Perfil carregado com sucesso:', {
          id: result.profile.id,
          full_name: result.profile.full_name,
          avatar_url: result.profile.avatar_url ? 'Presente' : 'Ausente'
        })
        setProfile(result.profile)
        setError(null)
        hasLoadedProfile.current = true
      } else {
        throw new Error(result.error || 'Erro ao carregar perfil')
      }
    } catch (err) {
      console.error('❌ [ProfileContext] Erro ao carregar perfil:', err)
      
      // Usar perfil básico em caso de erro (sem avatar)
      const fallbackProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'user',
        status: 'active'
      }
      console.log('⚠️ [ProfileContext] Usando perfil fallback:', fallbackProfile)
      setProfile(fallbackProfile)
      hasLoadedProfile.current = true
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
    
    // Carregar perfil quando o usuário mudar (novo login)
    if (user && !profile) {
      console.log('🔄 [ProfileContext] Novo usuário detectado, carregando perfil...')
      hasLoadedProfile.current = false // Reset para permitir novo carregamento
      loadProfile()
    } else if (!user) {
      console.log('👋 [ProfileContext] Usuário deslogado, limpando perfil...')
      setProfile(null)
      setLoading(false)
      hasLoadedProfile.current = false
    }
  }, [user?.id, authLoading])

  const refreshProfile = async () => {
    console.log('🔄 [ProfileContext] Forçando refresh do perfil...')
    await loadProfile(true) // Forçar refresh
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
