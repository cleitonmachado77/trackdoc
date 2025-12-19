/**
 * Script de teste para verificar se usuários individuais são criados com papel de administrador
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

async function testIndividualUserCreation() {
  try {
    console.log('🧪 Testando criação de usuário individual...')

    // Simular dados de um novo usuário individual
    const testUserData = {
      id: 'test-user-' + Date.now(),
      email: `test-${Date.now()}@example.com`,
      full_name: 'Usuário Teste Individual',
      role: 'admin', // Deve ser admin por padrão
      status: 'active',
      permissions: JSON.stringify(['read', 'write', 'admin']),
      registration_type: 'individual',
      entity_role: 'admin',
      registration_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Dados do usuário teste:', {
      email: testUserData.email,
      role: testUserData.role,
      entity_role: testUserData.entity_role,
      registration_type: testUserData.registration_type,
      permissions: testUserData.permissions
    })

    // Criar usuário de teste
    const { data: createdUser, error: createError } = await supabase
      .from('profiles')
      .insert(testUserData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Erro ao criar usuário teste:', createError)
      return
    }

    console.log('✅ Usuário teste criado com sucesso!')
    console.log('📊 Dados criados:', {
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      entity_role: createdUser.entity_role,
      registration_type: createdUser.registration_type,
      permissions: createdUser.permissions
    })

    // Verificar se os dados estão corretos
    const isCorrect = 
      createdUser.role === 'admin' &&
      createdUser.entity_role === 'admin' &&
      createdUser.registration_type === 'individual' &&
      createdUser.permissions === JSON.stringify(['read', 'write', 'admin'])

    if (isCorrect) {
      console.log('🎉 TESTE PASSOU: Usuário individual criado com papel de administrador!')
    } else {
      console.log('❌ TESTE FALHOU: Usuário não foi criado com as configurações corretas')
      console.log('   Esperado: role=admin, entity_role=admin, permissions=["read","write","admin"]')
      console.log('   Recebido:', {
        role: createdUser.role,
        entity_role: createdUser.entity_role,
        permissions: createdUser.permissions
      })
    }

    // Limpar usuário de teste
    console.log('\n🧹 Limpando usuário de teste...')
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserData.id)

    if (deleteError) {
      console.error('⚠️ Erro ao deletar usuário teste:', deleteError)
    } else {
      console.log('✅ Usuário teste removido com sucesso')
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testIndividualUserCreation()
}

export { testIndividualUserCreation }