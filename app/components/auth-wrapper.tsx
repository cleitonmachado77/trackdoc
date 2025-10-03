"use client"

import { useAuth } from '@/lib/contexts/auth-context'
import { AuthErrorToast } from './auth-error-toast'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { authError, clearAuthError } = useAuth()

  return (
    <>
      {children}
      <AuthErrorToast 
        error={authError} 
        onDismiss={clearAuthError}
      />
    </>
  )
}
