/**
 * Interceptador de API para redirecionar chamadas para dados mock quando necessário
 */

import { MockAPI } from './mock-data'

export class APIInterceptor {
  private static instance: APIInterceptor
  private mockAPI: MockAPI
  private originalFetch: typeof fetch
  private isLocalMode: boolean = false

  static getInstance(): APIInterceptor {
    if (!APIInterceptor.instance) {
      APIInterceptor.instance = new APIInterceptor()
    }
    return APIInterceptor.instance
  }

  constructor() {
    this.mockAPI = MockAPI.getInstance()
    this.originalFetch = window.fetch
  }

  enableLocalMode() {
    if (this.isLocalMode) return
    
    this.isLocalMode = true
    console.log('🔄 API Interceptor ativado - usando dados mock locais')
    
    // Interceptar fetch
    window.fetch = this.interceptedFetch.bind(this)
  }

  disableLocalMode() {
    if (!this.isLocalMode) return
    
    this.isLocalMode = false
    console.log('🔄 API Interceptor desativado - usando APIs reais')
    
    // Restaurar fetch original
    window.fetch = this.originalFetch
  }

  private async interceptedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString()
    
    // Verificar se é uma chamada para API local
    if (url.includes('/api/')) {
      return this.handleAPICall(url, init)
    }
    
    // Para outras URLs, usar fetch original
    return this.originalFetch(input, init)
  }

  private async handleAPICall(url: string, init?: RequestInit): Promise<Response> {
    const method = init?.method || 'GET'
    
    try {
      let result: any = { data: null, error: null }
      
      // Roteamento das APIs
      if (url.includes('/api/profile')) {
        result = await this.mockAPI.getProfile()
      } else if (url.includes('/api/documents')) {
        result = await this.mockAPI.getDocuments()
      } else if (url.includes('/api/plans')) {
        result = await this.mockAPI.getPlans()
      } else {
        // API não mapeada, retornar erro 404
        return new Response(
          JSON.stringify({ error: 'API não encontrada no modo local' }),
          {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Simular resposta HTTP
      if (result.error) {
        return new Response(
          JSON.stringify(result.error),
          {
            status: 400,
            statusText: 'Bad Request',
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      return new Response(
        JSON.stringify(result.data),
        {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
    } catch (error) {
      console.error('Erro no interceptador de API:', error)
      
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  private extractIdFromUrl(url: string): string {
    const parts = url.split('/')
    return parts[parts.length - 1] || '1'
  }
}

// Função para inicializar o interceptador
export function setupAPIInterceptor() {
  if (typeof window === 'undefined') return
  
  const interceptor = APIInterceptor.getInstance()
  
  // Detectar se deve usar modo local (sem Supabase ou com problemas de rede)
  const shouldUseLocalMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (shouldUseLocalMode) {
    interceptor.enableLocalMode()
  }
  
  return interceptor
}