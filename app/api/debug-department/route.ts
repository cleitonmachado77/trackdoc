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
    const departmentId = searchParams.get('departmentId')
    const stepId = searchParams.get('stepId')

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      departmentId,
      stepId
    }

    // 1. Verificar departamentos
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, entity_id')
      .order('name')

    debugInfo.departments = {
      data: departments,
      error: deptError,
      count: departments?.length
    }

    // 2. Se departmentId fornecido, verificar usuários
    if (departmentId) {
      // Query com relacionamento
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
        .eq('department_id', departmentId)

      debugInfo.departmentUsers = {
        data: userDepartments,
        error: usersError,
        count: userDepartments?.length
      }

      // Query manual
      const { data: udData, error: udError } = await supabase
        .from('user_departments')
        .select('user_id')
        .eq('department_id', departmentId)

      if (udData && udData.length > 0) {
        const userIds = udData.map(ud => ud.user_id)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('id', userIds)

        debugInfo.departmentUsersManual = {
          userDepartments: udData,
          profiles: profilesData,
          error: profilesError,
          count: profilesData?.length
        }
      }
    }

    // 3. Se stepId fornecido, verificar passo
    if (stepId) {
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

      debugInfo.step = {
        data: step,
        error: stepError
      }
    }

    // 4. Verificar estrutura da tabela user_departments
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'user_departments' })
      .catch(() => ({ data: null, error: 'RPC não disponível' }))

    debugInfo.tableInfo = {
      data: tableInfo,
      error: tableError
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Erro no debug:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
