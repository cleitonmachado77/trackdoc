"use client"

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface AuthErrorToastProps {
  error: string | null
  onDismiss: () => void
  onRetry?: () => void
}

export function AuthErrorToast({ error, onDismiss, onRetry }: AuthErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      
      // Auto-dismiss após 10 segundos
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onDismiss, 300) // Aguardar animação
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [error, onDismiss])

  if (!error || !isVisible) return null

  const isRefreshTokenError = error.toLowerCase().includes('refresh token') || 
                             error.toLowerCase().includes('sessão expirada')

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <Alert className={`w-80 shadow-lg ${isRefreshTokenError ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
            
            {onRetry && !isRefreshTokenError && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 h-7 text-xs"
                onClick={() => {
                  onRetry()
                  setIsVisible(false)
                  setTimeout(onDismiss, 300)
                }}
              >
                Tentar novamente
              </Button>
            )}
            
            {isRefreshTokenError && (
              <div className="mt-2 text-xs text-orange-700">
                Você será redirecionado para o login automaticamente.
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-2"
            onClick={() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Alert>
    </div>
  )
}
