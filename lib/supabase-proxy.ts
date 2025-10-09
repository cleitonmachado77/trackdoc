/**
 * Cliente Supabase que usa proxy local para contornar problemas de rede
 */

import { createClient } from '@supabase/supabase-js'

// Configuração do proxy local

export class SupabaseProxy {
  private static instance: SupabaseProxy
  private client: any

  static getInstance(): SupabaseProxy {
    if (!SupabaseProxy.instance) {
      SupabaseProxy.instance = new SupabaseProxy()
    }
    return SupabaseProxy.instance
  }

  constructor() {
    // Usar URL do proxy local em vez da URL direta do Supabase
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000/api/supabase-proxy',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'proxy-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        global: {
          // Usar fetch customizado que passa pelo proxy
          fetch: this.proxyFetch.bind(this)
        }
      }
    )
  }

  private async proxyFetch(url: string, options: any = {}) {
    try {
      // Se a URL é do Supabase, redirecionar para o proxy
      if (url.includes('supabase.co')) {
        const proxyUrl = url.replace(
          /https:\/\/[^.]+\.supabase\.co/,
          `${window.location.origin}/api/supabase-proxy`
        )

        console.log('🔄 Redirecionando via proxy:', url, '->', proxyUrl)

        return fetch(proxyUrl, {
          ...options,
          headers: {
            ...options.headers,
            'X-Original-URL': url, // Enviar URL original para o proxy
          }
        })
      }

      // Para outras URLs, usar fetch normal
      return fetch(url, options)
    } catch (error) {
      console.error('Erro no proxy fetch:', error)
      throw error
    }
  }

  getClient() {
    return this.client
  }

  // Métodos de conveniência
  get auth() {
    return this.client.auth
  }

  from(table: string) {
    return this.client.from(table)
  }

  rpc(fn: string, args?: any) {
    return this.client.rpc(fn, args)
  }
}