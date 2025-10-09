"use client"

import { useSimpleAuth } from '@/app/components/simple-auth-context'

export function useAuth() {
  // Sempre usar SimpleAuth para máxima compatibilidade
  return useSimpleAuth()
}

// Hook específico para casos onde precisamos saber qual provider está sendo usado
export function useAuthProvider() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return {
      provider: 'simple',
      auth: useSimpleAuth()
    }
  }

  if (useHybridAuth) {
    try {
      return {
        provider: 'hybrid',
        auth: useHybridAuth()
      }
    } catch (error) {
      return {
        provider: 'simple-fallback',
        auth: useSimpleAuth()
      }
    }
  }

  return {
    provider: 'simple',
    auth: useSimpleAuth()
  }
}