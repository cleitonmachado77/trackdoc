import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Ativa um usuário admin que está inativo
 * Útil para casos onde o admin único da conta não consegue ser selecionado como gerente
 */
export async function activateAdminUser(userId: string): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    // Verificar se o usuário existe e é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, entity_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        message: 'Usuário não encontrado',
        error: profileError?.message
      }
    }

    // Verificar se é admin
    if (profile.role !== 'admin') {
      return {
        success: false,
        message: 'Apenas usuários admin podem ser ativados por esta função',
        error: 'Usuário não é admin'
      }
    }

    // Se já está ativo, retornar sucesso
    if (profile.status === 'active') {
      return {
        success: true,
        message: 'Usuário já está ativo'
      }
    }

    // Ativar o usuário
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        registration_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      return {
        success: false,
        message: 'Erro ao ativar usuário',
        error: updateError.message
      }
    }

    return {
      success: true,
      message: `Usuário ${profile.full_name} ativado com sucesso`
    }

  } catch (error) {
    return {
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Busca usuários admin inativos na entidade atual
 */
export async function getInactiveAdminUsers(entityId?: string): Promise<{
  success: boolean
  users: Array<{
    id: string
    full_name: string
    email: string
    status: string
  }>
  error?: string
}> {
  try {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, status, entity_id')
      .eq('role', 'admin')
      .eq('status', 'inactive')

    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        users: [],
        error: error.message
      }
    }

    return {
      success: true,
      users: data || []
    }

  } catch (error) {
    return {
      success: false,
      users: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}