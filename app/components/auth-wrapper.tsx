"use client"

import { useAuth } from '@/lib/hooks/use-auth-final'
import { AuthErrorToast } from './auth-error-toast'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const auth = useAuth()
  
  // Verificar se o hook retornou dados válidos
  if (!auth) {
    return <>{children}</>
  }

  const { authError, clearAuthError } = auth
  
  // connectionStatus pode não existir no SimpleAuth
  const connectionStatus = 'connectionStatus' in auth ? auth.connectionStatus : null

  return (
    <>
      {children}
      {authError && clearAuthError && (
        <AuthErrorToast 
          error={authError} 
          onDismiss={clearAuthError}
        />
      )}
    </>
  )
}
