"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
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

  const loadProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('📥 [ProfileContext] Carregando perfil...')
      
      const response = await fetch('/api/profile')
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401 && result.code === 'PROFILE_NOT_FOUND') {
          console.log('❌ [ProfileContext] Perfil não encontrado')
          localStorage.clear()
          sessionStorage.clear()
          window.location.replace('/login')
          return
        }
        throw new Error(result.error || 'Erro ao carregar perfil')
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro na resposta da API')
      }

      setProfile(result.profile)
      setError(null)
      console.log('✅ [ProfileContext] Perfil carregado')
    } catch (err) {
      console.error('❌ [ProfileContext] Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
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
    
    loadProfile()
  }, [user, authLoading])

  const refreshProfile = async () => {
    await loadProfile()
  }

  // Mostrar loading enquanto autentica ou carrega perfil
  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Verificando autenticação...' : 'Carregando perfil...'}
          </p>
        </div>
      </div>
    )
  }

  // Se houve erro, mostrar mensagem
  if (error && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

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
