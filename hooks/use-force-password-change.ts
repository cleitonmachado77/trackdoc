"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ForcePasswordChangeState {
  needsPasswordChange: boolean
  loading: boolean
  error: string | null
  checkPasswordChangeStatus: () => Promise<void>
  markPasswordChanged: () => void
}

export function useForcePasswordChange(): ForcePasswordChangeState {
  const { user } = useAuth()
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkPasswordChangeStatus = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      console.log('🔍 [useForcePasswordChange] Verificando status de alteração de senha para:', user.id)
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('force_password_change, first_login_completed, status')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ [useForcePasswordChange] Erro ao buscar perfil:', profileError)
        throw profileError
      }

      console.log('👤 [useForcePasswordChange] Perfil encontrado:', {
        force_password_change: profile.force_password_change,
        first_login_completed: profile.first_login_completed,
        status: profile.status
      })

      // Usuário precisa alterar senha se:
      // 1. force_password_change = true OU
      // 2. first_login_completed = false (para usuários criados antes desta funcionalidade)
      const needsChange = profile.force_password_change === true || profile.first_login_completed === false

      setNeedsPasswordChange(needsChange)
      setError(null)
      
      console.log('🔐 [useForcePasswordChange] Resultado:', { needsChange })
      
    } catch (err: any) {
      console.error('❌ [useForcePasswordChange] Erro:', err)
      setError(err.message || 'Erro ao verificar status de senha')
      setNeedsPasswordChange(false)
    } finally {
      setLoading(false)
    }
  }

  const markPasswordChanged = () => {
    console.log('✅ [useForcePasswordChange] Marcando senha como alterada')
    setNeedsPasswordChange(false)
  }

  useEffect(() => {
    checkPasswordChangeStatus()
  }, [user?.id])

  return {
    needsPasswordChange,
    loading,
    error,
    checkPasswordChangeStatus,
    markPasswordChanged
  }
}