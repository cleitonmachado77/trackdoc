import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const stepId = searchParams.get('stepId')

    if (!stepId) {
      return NextResponse.json(
        { error: 'stepId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 [DEBUG] Testando detecção de assinatura múltipla para stepId:', stepId)

    // 1. Buscar informações do step
    const { data: step, error: stepError } = await supabase
      .from('workflow_steps')
      .select(`
        id,
        step_name,
        step_type,
        department_id,
        action_type,
        action_data,
        department:departments(
          id,
          name
        )
      `)
      .eq('id', stepId)
      .single()

    if (stepError || !step) {
      return NextResponse.json(
        { error: 'Step não encontrado', details: stepError },
        { status: 404 }
      )
    }

    console.log('📋 [DEBUG] Step encontrado:', step)

    // 2. Verificar se é departamento
    if (step.step_type !== 'department') {
      return NextResponse.json({
        success: false,
        reason: 'Step não é de departamento',
        step: step
      })
    }

    // 3. Verificar usuários do departamento
    const { data: userDepartments, error: usersError } = await supabase
      .from('user_departments')
      .select(`
        user:profiles!user_departments_user_id_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('department_id', step.department_id)

    if (usersError) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuários do departamento', details: usersError },
        { status: 500 }
      )
    }

    const users = userDepartments
      ?.map(ud => ud.user)
      .filter(Boolean)
      .map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      })) || []

    const hasMultipleUsers = users.length > 1
    const isSignAction = step.action_type === 'sign'

    // 4. Simular a lógica de detecção
    const shouldUseMultiSignature = hasMultipleUsers && isSignAction

    console.log('🔍 [DEBUG] Análise:', {
      hasMultipleUsers,
      isSignAction,
      shouldUseMultiSignature,
      usersCount: users.length
    })

    return NextResponse.json({
      success: true,
      analysis: {
        step: {
          id: step.id,
          name: step.step_name,
          type: step.step_type,
          department_id: step.department_id,
          action_type: step.action_type,
          department_name: step.department?.name
        },
        department: {
          id: step.department_id,
          name: step.department?.name,
          usersCount: users.length,
          hasMultipleUsers,
          users: users.map(u => ({
            id: u.id,
            name: u.full_name,
            email: u.email
          }))
        },
        detection: {
          isSignAction,
          hasMultipleUsers,
          shouldUseMultiSignature
        },
        action_data: step.action_data
      }
    })

  } catch (error) {
    console.error('❌ [DEBUG] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
