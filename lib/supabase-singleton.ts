"use client"

import { createBrowserClient } from "@supabase/ssr"

// Singleton para evitar múltiplas instâncias do Supabase client
let supabaseInstance: any = null

export function getSupabaseSingleton() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Configuração de storage customizada para garantir limpeza
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'sb-auth-token',
        },
        global: {
          headers: {
            'x-client-info': 'trackdoc-web',
          },
        },
        realtime: {
          params: {
            eventsPerSecond: 2,
          },
        },
      }
    )
  }
  return supabaseInstance
}

// Função para resetar o singleton (útil para logout)
export function resetSupabaseSingleton() {
  if (supabaseInstance) {
    console.log('🔄 [Supabase] Resetando singleton...')
    supabaseInstance = null
  }
}