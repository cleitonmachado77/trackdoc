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

    // Buscar perfil
    const { data: profile, error: profileError } = await serviceRoleSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [profile-api] Erro ao buscar perfil:', profileError)
      
      // Se perfil não existe, criar um perfil básico automaticamente
      if (profileError.code === 'PGRST116') {
        console.log('⚠️ [profile-api] Perfil não encontrado, criando perfil básico...')
        
        const basicProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          role: 'user',
          status: 'active',
          permissions: ['read', 'write'],
          registration_completed: true,
          registration_type: 'individual',
          entity_role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Tentar criar o perfil básico
        const { data: createdProfile, error: createError } = await serviceRoleSupabase
          .from('profiles')
          .insert([basicProfile])
          .select()
          .single()
        
        if (createError) {
          console.error('❌ [profile-api] Erro ao criar perfil básico:', createError)
          // Se não conseguir criar, retornar perfil básico sem salvar
          return NextResponse.json({
            success: true,
            profile: basicProfile,
            isBasic: true
          })
        }
        
        console.log('✅ [profile-api] Perfil básico criado:', createdProfile)
        return NextResponse.json({
          success: true,
          profile: createdProfile,
          isBasic: false
        })
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
    const { full_name, phone, role, department, position } = body

    // Normalizar o role para lowercase e validar valores permitidos
    const validRoles = ['user', 'admin', 'manager']
    const normalizedRole = role ? role.toLowerCase() : 'user'
    const finalRole = validRoles.includes(normalizedRole) ? normalizedRole : 'user'

    console.log('📝 [profile-api] Dados recebidos:', { full_name, phone, role: finalRole, department, position })

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
      department,
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
