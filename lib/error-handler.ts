/**
 * Manipulador global de erros para interceptar e filtrar erros desnecessários
 */

export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return

  // Interceptar erros não tratados
  window.addEventListener('error', (event) => {
    const error = event.error || event.message

    // Filtrar erros de extensões do Chrome
    if (
      error?.message?.includes('Extension context invalidated') ||
      error?.message?.includes('message channel closed') ||
      error?.message?.includes('runtime.lastError') ||
      error?.message?.includes('Unchecked runtime.lastError') ||
      event.filename?.includes('extension')
    ) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }

    // Filtrar erros de sintaxe relacionados a extensões
    if (
      error?.message?.includes('Unexpected token') &&
      (event.filename?.includes('chrome-extension') || !event.filename)
    ) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }

    // Log apenas erros relevantes
    console.error('Erro capturado:', {
      message: error?.message || event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: error?.stack
    })
  })

  // Interceptar promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason

    // Filtrar erros de extensões do Chrome
    if (
      reason?.message?.includes('Extension context invalidated') ||
      reason?.message?.includes('message channel closed') ||
      reason?.message?.includes('runtime.lastError')
    ) {
      event.preventDefault()
      return
    }

    // Filtrar erros de refresh token (já tratados pelo contexto de auth)
    if (
      reason?.message?.includes('Invalid Refresh Token') ||
      reason?.message?.includes('refresh token not found')
    ) {
      event.preventDefault()
      return
    }

    console.error('Promise rejeitada:', reason)
  })

  // Interceptar erros do console
  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args.join(' ')

    // Filtrar mensagens de erro de extensões
    if (
      message.includes('Unchecked runtime.lastError') ||
      message.includes('Extension context invalidated') ||
      message.includes('message channel closed')
    ) {
      return
    }

    // Chamar o console.error original para outros erros
    originalConsoleError.apply(console, args)
  }
}

// Função para limpar listeners (se necessário)
export function cleanupGlobalErrorHandler() {
  if (typeof window === 'undefined') return
  
  // Restaurar console.error original se necessário
  // (implementar se precisar remover os listeners)
}