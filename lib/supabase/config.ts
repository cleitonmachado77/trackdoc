// Supabase Configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  // URL base da aplicação para redirecionamentos
  appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.app.br',
}

// Configurações de timeout e retry
export const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit' as const,
    // Configurar URLs de redirecionamento corretas
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.app.br'}/auth/callback`,
  },
  global: {
    headers: {
      'X-Client-Info': 'trackdoc-app',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}

// Validate configuration
export const validateSupabaseConfig = () => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.warn(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
    return false
  }
  return true
} 