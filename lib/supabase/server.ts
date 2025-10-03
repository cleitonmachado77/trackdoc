import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseConfig, supabaseOptions } from "./config"

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  
  return createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      ...supabaseOptions,
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
