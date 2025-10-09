"use client"

import { useState, useEffect } from 'react'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export function useIsolatedAuth() {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    loading: true,
    error: null,
    connectionStatus: { connected: true, method: 'direct' },
    subscription: null,
    entity: null,
    usage: []
  })

  useEffect(() => {
    const supabase = getSupabaseSingleton()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setAuthState({
        user: session?.user || null,
        session: session,
        loading: false,
        error: error,
        connectionStatus: { connected: true, method: 'direct' },
        subscription: null,
        entity: null,
        usage: []
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user || null,
          session: session,
          loading: false,
          error: null,
          connectionStatus: { connected: true, method: 'direct' },
          subscription: null,
          entity: null,
          usage: []
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return authState
}
