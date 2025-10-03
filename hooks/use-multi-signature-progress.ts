import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface MultiSignatureProgress {
  totalUsers: number
  signedUsers: number
  pendingUsers: number
  users: {
    id: string
    full_name: string
    email: string
    signed: boolean
    signed_at?: string
  }[]
}

export function useMultiSignatureProgress() {
  const [loading, setLoading] = useState(false)

  // Buscar progresso das assinaturas múltiplas para um processo
  const getMultiSignatureProgress = useCallback(async (
    processId: string,
    documentId: string
  ): Promise<MultiSignatureProgress | null> => {
    try {
      setLoading(true)

      console.log('🔍 [getMultiSignatureProgress] Buscando progresso para:', { processId, documentId })

      // ✅ CORREÇÃO: Buscar execuções de workflow para assinatura múltipla
      // Primeiro, identificar o step de assinatura múltipla atual
      const { data: processData, error: processError } = await supabase
        .from('workflow_processes')
        .select('current_step_id')
        .eq('id', processId)
        .single()

      if (processError || !processData) {
        console.error('❌ [getMultiSignatureProgress] Erro ao buscar processo:', processError)
        return null
      }

      console.log('📋 [getMultiSignatureProgress] Step atual do processo:', processData.current_step_id)

      // Buscar execuções pendentes para o step atual (assinatura múltipla)
      const { data: executions, error: executionsError } = await supabase
        .from('workflow_executions')
        .select(`
          id,
          step_id,
          assigned_to,
          status,
          created_at,
          updated_at,
          step:workflow_steps(
            id,
            step_name,
            step_type,
            action_type
          ),
          assigned_user:profiles!workflow_executions_assigned_to_fkey(
            id,
            full_name,
            email
          )
        `)
      .eq('process_id', processId)
      .eq('step_id', processData.current_step_id)
      .in('status', ['pending', 'completed'])

      if (executionsError) {
        console.error('❌ [getMultiSignatureProgress] Erro ao buscar execuções:', executionsError)
        return null
      }

      if (!executions || executions.length === 0) {
        console.log('ℹ️ [getMultiSignatureProgress] Nenhuma execução pendente encontrada')
        return null
      }

      console.log('📋 [getMultiSignatureProgress] Execuções encontradas:', executions.length)

      // ✅ CORREÇÃO: Processar execuções considerando status correto
      const uniqueUsers = new Map()
      executions.forEach(execution => {
        const userId = execution.assigned_to
        const isSigned = execution.status === 'completed'
        
        // Se já existe o usuário, manter o status mais recente (completed > pending)
        if (!uniqueUsers.has(userId) || (isSigned && !uniqueUsers.get(userId).signed)) {
          uniqueUsers.set(userId, {
            id: execution.assigned_to,
            full_name: execution.assigned_user?.full_name || 'Usuário não encontrado',
            email: execution.assigned_user?.email || '',
            signed: isSigned,
            signed_at: isSigned ? execution.updated_at : undefined
          })
        }
      })

      const usersWithStatus = Array.from(uniqueUsers.values())
      const signedUsers = usersWithStatus.filter(user => user.signed).length
      const pendingUsers = usersWithStatus.filter(user => !user.signed).length

      console.log('✅ [getMultiSignatureProgress] Usuários únicos encontrados:', usersWithStatus.length)
      console.log('📊 [getMultiSignatureProgress] Status dos usuários:', usersWithStatus.map(u => ({
        name: u.full_name,
        signed: u.signed,
        signed_at: u.signed_at
      })))
      console.log('📈 [getMultiSignatureProgress] Estatísticas:', { signedUsers, pendingUsers, totalUsers: usersWithStatus.length })

      return {
        totalUsers: usersWithStatus.length,
        signedUsers,
        pendingUsers,
        users: usersWithStatus
      }

    } catch (error) {
      console.error('❌ [getMultiSignatureProgress] Erro ao buscar progresso de assinatura múltipla:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    getMultiSignatureProgress
  }
}
