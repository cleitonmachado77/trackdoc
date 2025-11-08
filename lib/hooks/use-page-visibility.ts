"use client"

import { useEffect, useState } from 'react'

/**
 * Hook para detectar quando a página fica visível/invisível
 * Útil para prevenir recarregamentos desnecessários ao trocar de aba
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    // Adicionar listener apenas se estiver no browser
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  return isVisible
}
