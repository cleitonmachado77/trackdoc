import { AuthError } from '@supabase/supabase-js'

/**
 * Trata erros de autenticação do Supabase de forma centralizada
 */
export function handleAuthError(error: AuthError | Error | null): {
  shouldLogout: boolean
  userMessage: string
  logMessage: string
} {
  if (!error) {
    return {
      shouldLogout: false,
      userMessage: '',
      logMessage: ''
    }
  }

  const errorMessage = error.message.toLowerCase()

  // Erros que requerem logout automático
  if (
    errorMessage.includes('invalid refresh token') ||
    errorMessage.includes('refresh token not found') ||
    errorMessage.includes('jwt expired') ||
    errorMessage.includes('invalid jwt')
  ) {
    return {
      shouldLogout: true,
      userMessage: 'Sessão expirada. Faça login novamente.',
      logMessage: `Erro de autenticação (logout automático): ${error.message}`
    }
  }

  // Erros de credenciais
  if (
    errorMessage.includes('invalid login credentials') ||
    errorMessage.includes('email not confirmed') ||
    errorMessage.includes('user not found')
  ) {
    return {
      shouldLogout: false,
      userMessage: errorMessage.includes('invalid login credentials') 
        ? 'Email ou senha incorretos'
        : errorMessage.includes('email not confirmed')
        ? 'Email não confirmado. Verifique sua caixa de entrada.'
        : 'Usuário não encontrado',
      logMessage: `Erro de credenciais: ${error.message}`
    }
  }

  // Erros de rede/conexão
  if (
    errorMessage.includes('network error') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout')
  ) {
    return {
      shouldLogout: false,
      userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
      logMessage: `Erro de rede: ${error.message}`
    }
  }

  // Erros gerais
  return {
    shouldLogout: false,
    userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
    logMessage: `Erro não tratado: ${error.message}`
  }
}

/**
 * Verifica se um erro é relacionado a refresh token inválido
 */
export function isRefreshTokenError(error: any): boolean {
  if (!error?.message) return false
  
  const message = error.message.toLowerCase()
  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found')
  )
}

/**
 * Limpa completamente a sessão do usuário
 */
export async function clearUserSession(supabase: any) {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}
