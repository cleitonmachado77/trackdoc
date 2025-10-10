import { createBrowserClient } from '@supabase/ssr'

/**
 * Função para ativar usuário virtual quando ele faz registro real
 */
export async function activateVirtualUser(email: string, authUserId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    console.log('🔍 [activateVirtualUser] Verificando usuário virtual para:', email)

    // Buscar perfil virtual pendente
    const { data: virtualProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .eq('registration_type', 'entity_user')
      .single()

    if (fetchError || !virtualProfile) {
      console.log('ℹ️ [activateVirtualUser] Nenhum usuário virtual encontrado para:', email)
      return { success: false, reason: 'no_virtual_user' }
    }

    // Verificar se tem dados temporários
    if (!virtualProfile.company?.startsWith('TEMP_PWD:')) {
      console.log('⚠️ [activateVirtualUser] Usuário virtual sem dados temporários')
      return { success: false, reason: 'no_temp_data' }
    }

    console.log('🚀 [activateVirtualUser] Ativando usuário virtual...')

    // Extrair dados temporários
    const tempData = extractTempData(virtualProfile.company)
    
    // Atualizar perfil virtual para ativo
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        id: authUserId, // Usar ID real do auth.users
        status: 'active',
        registration_completed: true,
        company: null, // Limpar dados temporários
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')

    if (updateError) {
      console.error('❌ [activateVirtualUser] Erro ao ativar:', updateError)
      return { success: false, reason: 'update_failed', error: updateError }
    }

    console.log('✅ [activateVirtualUser] Usuário virtual ativado com sucesso!')
    
    return { 
      success: true, 
      profile: virtualProfile,
      tempData,
      message: 'Usuário virtual ativado e vinculado à entidade'
    }

  } catch (error) {
    console.error('❌ [activateVirtualUser] Erro geral:', error)
    return { success: false, reason: 'general_error', error }
  }
}

/**
 * Extrair dados temporários do campo company
 */
function extractTempData(companyField: string) {
  if (!companyField?.startsWith('TEMP_PWD:')) return null
  
  try {
    const parts = companyField.split(':')
    return {
      password: parts[1],
      invitedBy: parts[3],
      createdAt: parts[4]
    }
  } catch (error) {
    console.error('❌ [extractTempData] Erro ao extrair dados:', error)
    return null
  }
}

/**
 * Verificar se um email tem usuário virtual pendente
 */
export async function checkVirtualUser(email: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, entity_id, entity_role, company')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .eq('registration_type', 'entity_user')
      .single()

    if (error || !data) {
      return { hasVirtualUser: false }
    }

    const hasValidTempData = data.company?.startsWith('TEMP_PWD:')
    
    return {
      hasVirtualUser: true,
      profile: data,
      hasValidTempData
    }

  } catch (error) {
    console.error('❌ [checkVirtualUser] Erro:', error)
    return { hasVirtualUser: false, error }
  }
}