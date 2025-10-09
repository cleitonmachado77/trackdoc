"use client"

import { createBrowserClient } from "@supabase/ssr"

// Singleton para evitar múltiplas instâncias do Supabase client
let supabaseInstance: any = null

export function getSupabaseSingleton() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}