import { createBrowserClient } from "@supabase/ssr"
import { supabaseConfig, supabaseOptions } from "./config"

export const createClientSupabaseClient = () => 
  createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    supabaseOptions
  )
