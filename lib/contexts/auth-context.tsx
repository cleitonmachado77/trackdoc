"use client"

// NOVO SISTEMA ISOLADO - SEM DEPENDÊNCIAS ANTIGAS
import { useIsolatedAuth } from '@/lib/hooks/use-isolated-auth'

export function useAuth() {
    const auth = useIsolatedAuth()
    
    if (!auth.user && !auth.loading) {
        // Retornar um objeto vazio em vez de erro para evitar crashes
        return {
            user: null,
            session: null,
            loading: false,
            error: 'Not authenticated'
        }
    }
    
    return auth
}

// Re-export para compatibilidade
export { useIsolatedAuth }
