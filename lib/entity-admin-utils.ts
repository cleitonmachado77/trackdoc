import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface EntityAdminStatus {
  isEntityAdmin: boolean
  entityId: string | null
  entityRole: string | null
  globalRole: string | null
  profileData: any
  errors: string[]
}

/**
 * Verifica se um usuário é administrador de uma entidade
 */
export async function checkEntityAdminStatus(userId: string): Promise<EntityAdminStatus> {
  const result: EntityAdminStatus = {
    isEntityAdmin: false,
    entityId: null,
    entityRole: null,
    globalRole: null,
    profileData: null,
    errors: []
  }

  try {
    console.log('🔍 [checkEntityAdminStatus] Verificando status de admin para usuário:', userId)

    // Buscar dados do perfil primeiro
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      result.errors.push(`Erro ao buscar perfil: ${profileError.message}`)
      console.error('❌ [checkEntityAdminStatus] Erro ao buscar perfil:', profileError)
      return result
    }

    result.profileData = profileData
    result.entityId = profileData.entity_id
    result.entityRole = profileData.entity_role
    result.globalRole = profileData.role

    console.log('📊 [checkEntityAdminStatus] Dados do perfil:', {
      userId,
      entityId: profileData.entity_id,
      entityRole: profileData.entity_role,
      globalRole: profileData.role
    })

    // Se o usuário tem entity_id, buscar dados da entidade separadamente
    if (profileData.entity_id) {
      try {
        const { data: entityData, error: entityError } = await supabase
          .from('entities')
          .select('id, name, created_at')
          .eq('id', profileData.entity_id)
          .single()

        if (!entityError && entityData) {
          result.profileData.entity = entityData
          console.log('📊 [checkEntityAdminStatus] Dados da entidade:', entityData)
        } else if (entityError) {
          result.errors.push(`Erro ao buscar dados da entidade: ${entityError.message}`)
        }
      } catch (err) {
        result.errors.push(`Erro ao buscar entidade: ${err}`)
      }
    }

    // Verificar se é admin de entidade
    const isEntityAdmin = profileData.entity_role === 'admin' && !!profileData.entity_id
    result.isEntityAdmin = isEntityAdmin

    // Verificações adicionais
    if (!profileData.entity_id) {
      result.errors.push('Usuário não está associado a nenhuma entidade')
    }

    if (profileData.entity_role !== 'admin') {
      result.errors.push(`Role da entidade é '${profileData.entity_role}', esperado 'admin'`)
    }

    if (isEntityAdmin && profileData.entity) {
      console.log('✅ [checkEntityAdminStatus] Usuário é admin da entidade:', profileData.entity.name)
    }

    return result

  } catch (error) {
    result.errors.push(`Erro geral: ${error}`)
    console.error('❌ [checkEntityAdminStatus] Erro geral:', error)
    return result
  }
}

/**
 * Corrige o status de admin de entidade para um usuário
 */
export async function fixEntityAdminStatus(userId: string, entityId: string): Promise<{
  success: boolean
  error: string | null
  updatedData?: any
}> {
  try {
    console.log('🔧 [fixEntityAdminStatus] Corrigindo status de admin para usuário:', userId, 'entidade:', entityId)

    // Verificar se a entidade existe
    const { data: entityData, error: entityError } = await supabase
      .from('entities')
      .select('id, name')
      .eq('id', entityId)
      .single()

    if (entityError) {
      return {
        success: false,
        error: `Entidade não encontrada: ${entityError.message}`
      }
    }

    // Atualizar o perfil do usuário
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        entity_id: entityId,
        entity_role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single()

    if (updateError) {
      return {
        success: false,
        error: `Erro ao atualizar perfil: ${updateError.message}`
      }
    }

    console.log('✅ [fixEntityAdminStatus] Status corrigido com sucesso:', updatedProfile)

    return {
      success: true,
      error: null,
      updatedData: updatedProfile
    }

  } catch (error) {
    return {
      success: false,
      error: `Erro geral: ${error}`
    }
  }
}

/**
 * Lista todas as entidades disponíveis
 */
export async function listAvailableEntities(): Promise<{
  entities: Array<{ id: string; name: string; created_at: string }>
  error: string | null
}> {
  try {
    const { data: entities, error } = await supabase
      .from('entities')
      .select('id, name, created_at')
      .order('name')

    if (error) {
      return {
        entities: [],
        error: `Erro ao buscar entidades: ${error.message}`
      }
    }

    return {
      entities: entities || [],
      error: null
    }

  } catch (error) {
    return {
      entities: [],
      error: `Erro geral: ${error}`
    }
  }
}

/**
 * Verifica se um usuário tem permissões de admin global
 */
export async function checkGlobalAdminStatus(userId: string): Promise<{
  isGlobalAdmin: boolean
  role: string | null
  error: string | null
}> {
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      return {
        isGlobalAdmin: false,
        role: null,
        error: `Erro ao buscar perfil: ${error.message}`
      }
    }

    const isGlobalAdmin = profileData.role === 'admin'
    
    return {
      isGlobalAdmin,
      role: profileData.role,
      error: null
    }

  } catch (error) {
    return {
      isGlobalAdmin: false,
      role: null,
      error: `Erro geral: ${error}`
    }
  }
}
