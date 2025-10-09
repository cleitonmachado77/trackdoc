"use client"

// Re-exportar o hook unificado como useAuth para compatibilidade
export { useAuth } from '@/lib/hooks/use-unified-auth'
export { useAuthProvider } from '@/lib/hooks/use-unified-auth'

// Também re-exportar os providers para facilitar importação
export { SimpleAuthProvider, useSimpleAuth } from '@/app/components/simple-auth-context'

// Tentar re-exportar o HybridAuthProvider se disponível
let HybridAuthProvider: any = null
let useHybridAuth: any = null

try {
  const hybridModule = require('./hybrid-auth-context')
  HybridAuthProvider = hybridModule.HybridAuthProvider
  useHybridAuth = hybridModule.useAuth
} catch (error) {
  console.warn('HybridAuthProvider não disponível')
}

export { HybridAuthProvider, useHybridAuth }