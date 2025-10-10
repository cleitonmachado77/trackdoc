import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    console.log('🔧 [create-entity-user] Recebido:', body)
    
    const {
      userId,
      fullName,
      email,
      entityName,
      entityLegalName,
      entityCnpj,
      entityPhone,
      selectedPlanId
    } = body
    
    // Validar dados obrigatórios
    if (!userId || !email || !entityName) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }
    
    console.log('🏢 [create-entity-user] Criando entidade:', entityName)
    
    // 1. Buscar plano padrão se não especificado
    let planId = selectedPlanId
    if (!planId) {
      const { data: plans } = await supabase
        .from('plans')
        .select('id')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })
        .limit(1)
      
      if (plans && plans.length > 0) {
        planId = plans[0].id
      }
    }
    
    // 2. Criar entidade
    const { data: entityData, error: entityError } = await supabase
      .from('entities')
      .insert([{
        name: entityName,
        legal_name: entityLegalName || `${entityName} ME`,
        cnpj: entityCnpj || null,
        email: email,
        phone: entityPhone || null,
        subscription_plan_id: planId,
        max_users: 10,
        admin_user_id: userId,
        status: 'active',
        type: 'company'
      }])
      .select()
      .single()
    
    if (entityError) {
      console.error('❌ [create-entity-user] Erro ao criar entidade:', entityError)
      return NextResponse.json(
        { error: 'Erro ao criar entidade', details: entityError.message },
        { status: 500 }
      )
    }
    
    console.log('✅ [create-entity-user] Entidade criada:', entityData.id)
    
    // 3. Atualizar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        registration_type: 'entity_admin',
        entity_role: 'admin',
        role: 'admin',
        entity_id: entityData.id,
        registration_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (profileError) {
      console.error('❌ [create-entity-user] Erro ao atualizar perfil:', profileError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil', details: profileError.message },
        { status: 500 }
      )
    }
    
    console.log('✅ [create-entity-user] Perfil atualizado')
    
    // 4. Criar assinatura da entidade
    if (planId) {
      const { error: subscriptionError } = await supabase
        .from('entity_subscriptions')
        .insert([{
          entity_id: entityData.id,
          plan_id: planId,
          status: 'active',
          is_trial: true,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }])
      
      if (subscriptionError) {
        console.warn('⚠️ [create-entity-user] Erro ao criar assinatura:', subscriptionError.message)
      } else {
        console.log('✅ [create-entity-user] Assinatura criada')
      }
    }
    
    console.log('🎉 [create-entity-user] Processo concluído com sucesso!')
    
    return NextResponse.json({
      success: true,
      entity: entityData,
      message: 'Entidade e perfil criados com sucesso'
    })
    
  } catch (error) {
    console.error('❌ [create-entity-user] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}