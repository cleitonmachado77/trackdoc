/**
 * Utilitário para limpar dados de autenticação corrompidos
 */

export function cleanupAuthData() {
  if (typeof window === 'undefined') return

  try {
    // Limpar dados do Supabase no localStorage
    const keysToRemove = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Limpar sessionStorage também
    const sessionKeysToRemove = []
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('sb-')) {
        sessionKeysToRemove.push(key)
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key)
    })
    
    console.log('Dados de autenticação limpos:', {
      localStorage: keysToRemove.length,
      sessionStorage: sessionKeysToRemove.length
    })
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error)
  }
}

export function isAuthDataCorrupted(): boolean {
  if (typeof window === 'undefined') return false

  try {
    // Verificar se há tokens corrompidos no localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)
            // Verificar se há refresh_token inválido
            if (parsed.refresh_token && typeof parsed.refresh_token !== 'string') {
              return true
            }
          } catch {
            return true
          }
        }
      }
    }
    
    return false
  } catch {
    return true
  }
}