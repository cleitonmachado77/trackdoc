import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [profile-api] GET - Buscando perfil do usuário...')

    const supabase = createSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ [profile-api] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ [profile-api] Usuário autenticado:', user.id)

    // Usar service role para bypass RLS
    const serviceRoleSupabase = createSupabaseServiceClient()

    // Buscar perfil (otimizado - apenas campos necessários)
    const { data: profile, error: profileError } = await serviceRoleSupabase
      .from('profiles')
      .select('id, full_name, email, phone, role, status, entity_id, entity_role, department_id, position, avatar_url, registration_completed, registration_type, permissions, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [profile-api] Erro ao buscar perfil:', profileError)
      
      // Se perfil não existe, retornar erro 401 para forçar logout/login
      if (profileError.code === 'PGRST116') {
        console.log('⚠️ [profile-api] Perfil não encontrado - usuário deve fazer login novamente')
        return NextResponse.json(
          { 
            error: 'Perfil não encontrado',
            code: 'PROFILE_NOT_FOUND',
            message: 'Usuário deve fazer login novamente'
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao buscar perfil' },
        { status: 500 }
      )
    }

    console.log('✅ [profile-api] Perfil encontrado:', profile?.id)

    return NextResponse.json({
      success: true,
      profile,
      isBasic: false
    })

  } catch (error) {
    console.error('❌ [profile-api] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 [profile-api] PUT - Atualizando perfil do usuário...')

    const supabase = createSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ [profile-api] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ [profile-api] Usuário autenticado:', user.id)

    // Obter dados do corpo da requisição
    const body = await request.json()
    const { full_name, phone, role, department_id, position } = body

    // Normalizar o role para lowercase e validar valores permitidos
    const validRoles = ['user', 'admin', 'manager']
    const normalizedRole = role ? role.toLowerCase() : 'user'
    const finalRole = validRoles.includes(normalizedRole) ? normalizedRole : 'user'

    console.log('📝 [profile-api] Dados recebidos:', { full_name, phone, role: finalRole, department_id, position })

    // Usar service role para bypass RLS
    const serviceRoleSupabase = createSupabaseServiceClient()

    // Usar upsert para criar ou atualizar perfil
    const profileData = {
      id: user.id,
      full_name,
      email: user.email || '',
      phone,
      role: finalRole,
      status: 'active',
      permissions: ['read', 'write'],
      registration_completed: true,
      registration_type: 'individual',
      entity_role: 'user',
      department_id,
      position,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await serviceRoleSupabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [profile-api] Erro ao salvar perfil:', error)
      return NextResponse.json(
        { error: `Erro ao salvar perfil: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [profile-api] Perfil salvo com sucesso:', data)

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    console.error('❌ [profile-api] Erro interno:', error)
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}
