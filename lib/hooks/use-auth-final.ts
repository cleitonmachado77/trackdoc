"use client"

import { useSimpleAuth } from '@/app/components/simple-auth-context'

// Hook final e definitivo para autenticação
export function useAuth() {
  return useSimpleAuth()
}

export function useAuthProvider() {
  return {
    provider: 'simple',
    isProduction: process.env.NODE_ENV === 'production'
  }
}