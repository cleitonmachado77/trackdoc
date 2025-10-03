import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SimpleEntityAdminStatus {
  isEntityAdmin: boolean
  entityId: string | null
  entityRole: string | null
  globalRole: string | null
  profileData: any
  errors: string[]
}

/**
 * Verificação simples de admin de entidade sem relacionamentos complexos
 */
export async function checkSimpleEntityAdminStatus(userId: string): Promise<SimpleEntityAdminStatus> {
  const result: SimpleEntityAdminStatus = {
    isEntityAdmin: false,
    entityId: null,
    entityRole: null,
    globalRole: null,
    profileData: null,
    errors: []
  }

  try {
    console.log('🔍 [checkSimpleEntityAdminStatus] Verificando status de admin para usuário:', userId)

    // Buscar apenas dados básicos do perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, entity_id, entity_role, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      result.errors.push(`Erro ao buscar perfil: ${profileError.message}`)
      console.error('❌ [checkSimpleEntityAdminStatus] Erro ao buscar perfil:', profileError)
      return result
    }

    result.profileData = profileData
    result.entityId = profileData.entity_id
    result.entityRole = profileData.entity_role
    result.globalRole = profileData.role

    console.log('📊 [checkSimpleEntityAdminStatus] Dados do perfil:', {
      userId,
      entityId: profileData.entity_id,
      entityRole: profileData.entity_role,
      globalRole: profileData.role,
      fullName: profileData.full_name
    })

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

    if (isEntityAdmin) {
      console.log('✅ [checkSimpleEntityAdminStatus] Usuário é admin de entidade')
    } else {
      console.log('⚠️ [checkSimpleEntityAdminStatus] Usuário não é admin de entidade')
    }

    return result

  } catch (error) {
    result.errors.push(`Erro geral: ${error}`)
    console.error('❌ [checkSimpleEntityAdminStatus] Erro geral:', error)
    return result
  }
}

/**
 * Lista entidades disponíveis de forma simples
 */
export async function listSimpleEntities(): Promise<{
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
 * Corrige status de admin de forma simples
 */
export async function fixSimpleEntityAdminStatus(userId: string, entityId: string): Promise<{
  success: boolean
  error: string | null
  updatedData?: any
}> {
  try {
    console.log('🔧 [fixSimpleEntityAdminStatus] Corrigindo status de admin para usuário:', userId, 'entidade:', entityId)

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

    console.log('📋 [fixSimpleEntityAdminStatus] Entidade encontrada:', entityData.name)

    // Atualizar o perfil do usuário
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        entity_id: entityId,
        entity_role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, full_name, email, role, entity_id, entity_role')
      .single()

    if (updateError) {
      return {
        success: false,
        error: `Erro ao atualizar perfil: ${updateError.message}`
      }
    }

    console.log('✅ [fixSimpleEntityAdminStatus] Status corrigido com sucesso:', {
      userId: updatedProfile.id,
      fullName: updatedProfile.full_name,
      entityId: updatedProfile.entity_id,
      entityRole: updatedProfile.entity_role
    })

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
