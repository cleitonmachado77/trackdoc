"use client"

import React from 'react'
import { useProfile } from '@/app/components/profile-context'
import { useAuth } from '@/lib/hooks/use-auth-final'

/**
 * Hook seguro para usar perfil com fallback
 * Retorna perfil básico se o carregamento falhar ou demorar
 */
export function useProfileSafe() {
  const { profile, loading, error } = useProfile()
  const { user } = useAuth()

  // Se está carregando há muito tempo (>5s), usar fallback
  const [useFallback, setUseFallback] = React.useState(false)

  React.useEffect(() => {
    if (loading && user) {
      const timer = setTimeout(() => {
        console.warn('⚠️ [useProfileSafe] Timeout no carregamento, usando fallback')
        setUseFallback(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [loading, user])

  // Perfil básico de fallback
  const fallbackProfile = user ? {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
    role: 'user',
    status: 'active',
    isFallback: true
  } : null

  return {
    profile: (error || useFallback) ? fallbackProfile : profile,
    loading: loading && !useFallback,
    error,
    isFallback: error || useFallback
  }
}
