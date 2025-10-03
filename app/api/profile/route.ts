import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [profile-api] GET - Buscando perfil do usuário...')

    const cookieStore = cookies()
    const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    })

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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Configuração de service role não encontrada' },
        { status: 500 }
      )
    }

    const serviceRoleSupabase = createClient(
      supabaseConfig.url,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // A tabela profiles já existe, vamos usar a estrutura correta
    console.log('📋 [profile-api] Usando tabela profiles existente...')

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
          role: 'user', // Já está em lowercase
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

    const cookieStore = cookies()
    const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    })

    console.log('🔐 [profile-api] Verificando autenticação...')
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
    console.log('📋 [profile-api] Lendo corpo da requisição...')
    const body = await request.json()
    const { full_name, phone, role, department, position } = body

    // Normalizar o role para lowercase e validar valores permitidos (constraint da tabela)
    const validRoles = ['user', 'admin', 'manager']
    const normalizedRole = role ? role.toLowerCase() : 'user'
    const finalRole = validRoles.includes(normalizedRole) ? normalizedRole : 'user'

    console.log('📝 [profile-api] Dados recebidos:', { full_name, phone, role: finalRole, department, position })

    // Usar service role para bypass RLS
    console.log('🔑 [profile-api] Verificando service role key...')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ [profile-api] Service role key não encontrada')
      return NextResponse.json(
        { error: 'Configuração de service role não encontrada' },
        { status: 500 }
      )
    }

    console.log('🔑 [profile-api] Criando cliente service role...')
    const serviceRoleSupabase = createClient(
      supabaseConfig.url,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Usar upsert para criar ou atualizar perfil na tabela existente
    console.log('🔄 [profile-api] Usando upsert para criar/atualizar perfil...')
    
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

    console.log('📝 [profile-api] Dados do perfil (upsert):', profileData)

    const { data, error } = await serviceRoleSupabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single()

    const result = { data, error }
    console.log('✅ [profile-api] Resultado do upsert:', { data, error })

    if (result.error) {
      console.error('❌ [profile-api] Erro detalhado na operação:', {
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
        code: result.error.code
      })
      return NextResponse.json(
        { error: `Erro ao salvar perfil: ${result.error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [profile-api] Operação concluída com sucesso:', result.data)

    return NextResponse.json({
      success: true,
      profile: result.data
    })

  } catch (error) {
    console.error('❌ [profile-api] Erro interno detalhado:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}
