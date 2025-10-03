// Configuração de rede para resolver problemas de timeout
export const networkConfig = {
  // Timeout padrão para requisições (30 segundos)
  defaultTimeout: 30000,
  
  // Configurações de retry
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000, // 1 segundo
    backoffMultiplier: 2,
  },
  
  // Configurações de fetch personalizadas
  fetchConfig: {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'TrackDoc-App/1.0',
    },
  },
}

// Função para fazer requisições com timeout e retry
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout: number = networkConfig.defaultTimeout
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Função para fazer requisições com retry automático
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = networkConfig.retryConfig.maxRetries
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)
      
      // Se a resposta for bem-sucedida, retornar
      if (response.ok) {
        return response
      }
      
      // Se for erro 4xx (exceto 401), não tentar novamente
      if (response.status >= 400 && response.status < 500 && response.status !== 401) {
        return response
      }
      
      // Para outros erros, tentar novamente
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido')
      
      // Se for o último tentativa, lançar o erro
      if (attempt === maxRetries) {
        break
      }
      
      // Aguardar antes da próxima tentativa
      const delay = networkConfig.retryConfig.retryDelay * 
        Math.pow(networkConfig.retryConfig.backoffMultiplier, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Erro desconhecido após todas as tentativas')
}

// Função para verificar conectividade
export async function checkConnectivity(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout('https://www.google.com', {
      method: 'HEAD',
    }, 5000)
    return response.ok
  } catch {
    return false
  }
}
