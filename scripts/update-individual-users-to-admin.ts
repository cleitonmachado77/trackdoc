/**
 * Script para atualizar usuários individuais existentes para papel de administrador
 * 
 * Este script identifica usuários com registration_type = 'individual' que ainda
 * têm role = 'user' e os atualiza para role = 'admin' com permissões administrativas.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function updateIndividualUsersToAdmin() {
  try {
    console.log('🔍 Buscando usuários individuais com papel "user"...')

    // Buscar usuários individuais que ainda têm papel "user"
    const { data: individualUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, entity_role, permissions, registration_type, entity_id')
      .eq('registration_type', 'individual')
      .eq('role', 'user')
      .is('entity_id', null) // Garantir que não têm entidade

    if (fetchError) {
      console.error('❌ Erro ao buscar usuários:', fetchError)
      return
    }

    if (!individualUsers || individualUsers.length === 0) {
      console.log('✅ Nenhum usuário individual com papel "user" encontrado.')
      return
    }

    console.log(`📊 Encontrados ${individualUsers.length} usuários individuais para atualizar:`)
    individualUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.email}) - Role: ${user.role}`)
    })

    console.log('\n🔧 Atualizando usuários para papel "admin"...')

    // Atualizar cada usuário
    const updatePromises = individualUsers.map(async (user) => {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          entity_role: 'admin',
          permissions: JSON.stringify(['read', 'write', 'admin']),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error(`❌ Erro ao atualizar ${user.email}:`, updateError)
        return { success: false, user: user.email, error: updateError.message }
      } else {
        console.log(`✅ ${user.email} atualizado com sucesso`)
        return { success: true, user: user.email }
      }
    })

    const results = await Promise.all(updatePromises)
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log('\n📊 Resumo da atualização:')
    console.log(`✅ Sucessos: ${successful}`)
    console.log(`❌ Falhas: ${failed}`)

    if (failed > 0) {
      console.log('\n❌ Usuários com falha:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.user}: ${r.error}`)
      })
    }

    console.log('\n🎉 Script concluído!')

  } catch (error) {
    console.error('❌ Erro geral no script:', error)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  updateIndividualUsersToAdmin()
}

export { updateIndividualUsersToAdmin }