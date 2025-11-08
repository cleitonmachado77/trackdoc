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
          // Prevenir refresh automático ao trocar de aba
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Aumentar o intervalo de verificação de sessão
          flowType: 'pkce',
        },
        global: {
          headers: {
            'x-client-info': 'trackdoc-web',
          },
        },
        // Configurações de realtime para evitar reconexões
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