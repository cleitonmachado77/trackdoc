"use client"

// Re-exportar o hook final como useAuth para compatibilidade
export { useAuth } from '@/lib/hooks/use-auth-final'
export { useAuthProvider } from '@/lib/hooks/use-auth-final'

// Também re-exportar os providers para facilitar importação
export { SimpleAuthProvider, useSimpleAuth } from '@/app/components/simple-auth-context'