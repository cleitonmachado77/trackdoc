/**
 * Cliente Supabase inteligente que detecta problemas de rede e usa proxy quando necessário
 */

import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: any = null
let isUsingProxy = false

export async function getSupabaseClient() {
  if (supabaseClient) {
    return { client: supabaseClient, isUsingProxy }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas')
  }

  // Primeiro, tentar conexão direta
  try {
    const directClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    
    // Testar conexão com timeout
    const testPromise = directClient.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
    
    await Promise.race([testPromise, timeoutPromise])
    
    supabaseClient = directClient
    isUsingProxy = false
    
    return { client: supabaseClient, isUsingProxy }
    
  } catch (error) {
    
    // Usar proxy local (apenas em desenvolvimento ou quando necessário)
    try {
      // Verificar se o proxy deve ser usado
      const enableProxy = process.env.NEXT_PUBLIC_ENABLE_PROXY
      const isLocalDevelopment = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      
      // Só usar proxy se:
      // 1. Estiver em desenvolvimento local E
      // 2. A variável ENABLE_PROXY for 'auto' ou 'true'
      const shouldUseProxy = isLocalDevelopment && (enableProxy === 'auto' || enableProxy === 'true')
      
      if (!shouldUseProxy) {
        // Em produção ou quando proxy está desabilitado, não tentar proxy
        throw new Error('Conexão direta falhou e proxy não está habilitado para este ambiente')
      }
      
      const proxyClient = createBrowserClient(
        `${window.location.origin}/api/supabase-proxy`,
        supabaseAnonKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          },
          global: {
            fetch: async (url: string, options: any = {}) => {
              // Redirecionar todas as chamadas para o proxy
              let proxyUrl = url
              
              if (url.includes('/api/supabase-proxy')) {
                // Já é uma URL de proxy, usar diretamente
                proxyUrl = url
              } else if (url.includes('supabase.co')) {
                // Converter URL do Supabase para proxy
                const path = url.replace(/https:\/\/[^.]+\.supabase\.co\//, '')
                proxyUrl = `${window.location.origin}/api/supabase-proxy/${path}`
              }
              

              
              return fetch(proxyUrl, {
                ...options,
                headers: {
                  ...options.headers,
                  'X-Original-URL': url,
                }
              })
            }
          }
        }
      )
      
      // Testar proxy
      await proxyClient.auth.getSession()
      
      supabaseClient = proxyClient
      isUsingProxy = true
      
      return { client: supabaseClient, isUsingProxy }
      
    } catch (proxyError) {
      throw new Error('Não foi possível conectar ao Supabase nem diretamente nem via proxy')
    }
  }
}

export async function createSupabaseClient() {
  const { client } = await getSupabaseClient()
  return client
}

// Alias para compatibilidade
export const getSupabase = createSupabaseClient

export async function checkConnection() {
  try {
    const { client, isUsingProxy } = await getSupabaseClient()
    await client.auth.getSession()
    
    return {
      connected: true,
      usingProxy: isUsingProxy,
      method: isUsingProxy ? 'proxy' : 'direct'
    }
  } catch (error) {
    return {
      connected: false,
      usingProxy: false,
      method: 'none',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}