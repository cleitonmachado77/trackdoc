"use client"

import { useContext } from 'react'

export function useAuth() {
  // Sempre tentar usar SimpleAuth primeiro em produção
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      const { useSimpleAuth } = require('@/app/components/simple-auth-context')
      return useSimpleAuth()
    } catch (error) {
      console.error('Erro ao usar SimpleAuth:', error)
      return null
    }
  }

  // Em desenvolvimento, tentar HybridAuth primeiro, depois SimpleAuth
  try {
    const { useAuth: useHybridAuth } = require('@/lib/contexts/hybrid-auth-context')
    return useHybridAuth()
  } catch (hybridError) {
    console.warn('HybridAuth não disponível, tentando SimpleAuth')
    
    try {
      const { useSimpleAuth } = require('@/app/components/simple-auth-context')
      return useSimpleAuth()
    } catch (simpleError) {
      console.error('Nenhum provider de auth disponível:', simpleError)
      return null
    }
  }
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