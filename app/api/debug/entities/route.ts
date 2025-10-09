import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }
    
    // 1. Testar acesso à tabela entities
    try {
      const { data: entities, error: entitiesError } = await supabase
        .from('entities')
        .select('*')
        .limit(1)
      
      results.tests.push({
        test: 'entities_access',
        success: !entitiesError,
        error: entitiesError?.message,
        data: entities?.length || 0,
        fields: entities?.[0] ? Object.keys(entities[0]) : []
      })
    } catch (err) {
      results.tests.push({
        test: 'entities_access',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
    
    // 2. Testar acesso à tabela entity_invitations
    try {
      const { data: invitations, error: invitationsError } = await supabase
        .from('entity_invitations')
        .select('*')
        .limit(1)
      
      results.tests.push({
        test: 'entity_invitations_access',
        success: !invitationsError,
        error: invitationsError?.message,
        data: invitations?.length || 0,
        fields: invitations?.[0] ? Object.keys(invitations[0]) : []
      })
    } catch (err) {
      results.tests.push({
        test: 'entity_invitations_access',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
    
    // 3. Testar acesso à tabela profiles
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, entity_id, entity_role, registration_type')
        .limit(1)
      
      results.tests.push({
        test: 'profiles_access',
        success: !profilesError,
        error: profilesError?.message,
        data: profiles?.length || 0,
        fields: profiles?.[0] ? Object.keys(profiles[0]) : [],
        hasEntityFields: profiles?.[0] ? ('entity_id' in profiles[0] && 'entity_role' in profiles[0]) : false
      })
    } catch (err) {
      results.tests.push({
        test: 'profiles_access',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
    
    // 4. Testar se existe tabela entity_users
    try {
      const { data: entityUsers, error: entityUsersError } = await supabase
        .from('entity_users')
        .select('*')
        .limit(1)
      
      results.tests.push({
        test: 'entity_users_access',
        success: !entityUsersError,
        error: entityUsersError?.message,
        data: entityUsers?.length || 0
      })
    } catch (err) {
      results.tests.push({
        test: 'entity_users_access',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
    
    // 5. Testar criação de entidade
    try {
      const testName = `Test Entity ${Date.now()}`
      const { data: newEntity, error: createError } = await supabase
        .from('entities')
        .insert({
          name: testName,
          email: `test${Date.now()}@example.com`,
          legal_name: testName
        })
        .select()
        .single()
      
      if (createError) {
        results.tests.push({
          test: 'entity_creation',
          success: false,
          error: createError.message
        })
      } else {
        // Limpar o teste
        await supabase.from('entities').delete().eq('id', newEntity.id)
        
        results.tests.push({
          test: 'entity_creation',
          success: true,
          message: 'Entity created and deleted successfully'
        })
      }
    } catch (err) {
      results.tests.push({
        test: 'entity_creation',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
    
    // 6. Resumo
    const successCount = results.tests.filter(t => t.success).length
    const totalTests = results.tests.length
    
    results.summary = {
      total: totalTests,
      success: successCount,
      failed: totalTests - successCount,
      allPassed: successCount === totalTests
    }
    
    return NextResponse.json(results, { status: 200 })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to run diagnostics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}