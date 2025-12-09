import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, full_name, phone, company, password, plan_id, role } = body

    // Validações
    if (!email || !full_name || !password || !plan_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, full_name, password, plan_id' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 2. Criar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name,
        phone: phone || null,
        company: company || null,
        role: role || 'user',
        status: 'active',
        registration_completed: true,
        registration_type: 'individual'
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      // Tentar deletar o usuário do Auth se o perfil falhar
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    // 3. Criar subscription
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1) // 1 ano de validade

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        current_users: 1,
        current_storage_gb: 0
      })

    if (subError) {
      console.error('Erro ao criar subscription:', subError)
      // Não falhar completamente, apenas logar
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name
      },
      message: 'Usuário criado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
