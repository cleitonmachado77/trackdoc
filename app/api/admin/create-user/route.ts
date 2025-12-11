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
    const { 
      email, 
      full_name, 
      phone, 
      company, 
      password, 
      plan_id, 
      role,
      cpf,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      address_zipcode
    } = body

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

    // Buscar informações do plano
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id, name, max_users, max_storage_gb, price_monthly')
      .eq('id', plan_id)
      .single()

    if (planError || !planData) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 400 }
      )
    }

    console.log('🔄 [create-user] Criando usuário com inviteUserByEmail...')

    // Usar inviteUserByEmail para enviar email de confirmação automaticamente
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        data: {
          full_name: full_name.trim(),
          phone: phone?.trim() || null,
          company: company?.trim() || null,
          cpf: cpf?.trim() || null,
          address_street: address_street?.trim() || null,
          address_number: address_number?.trim() || null,
          address_complement: address_complement?.trim() || null,
          address_neighborhood: address_neighborhood?.trim() || null,
          address_city: address_city?.trim() || null,
          address_state: address_state?.trim() || null,
          address_zipcode: address_zipcode?.trim() || null,
          registration_type: 'individual'
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.app.br'}/auth/callback?type=new_user`
      }
    )

    if (inviteError) {
      console.error('❌ [create-user] Erro ao enviar convite:', inviteError)
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      )
    }

    const userId = inviteData.user.id
    console.log('✅ [create-user] Convite enviado, userId:', userId)

    // Criar perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        role: role || 'user',
        status: 'pending_confirmation', // Aguardando confirmação de email
        registration_completed: false,
        registration_type: 'individual',
        force_password_change: true, // Força alteração de senha no primeiro login
        first_login_completed: false,
        cpf: cpf?.trim() || null,
        address_street: address_street?.trim() || null,
        address_number: address_number?.trim() || null,
        address_complement: address_complement?.trim() || null,
        address_neighborhood: address_neighborhood?.trim() || null,
        address_city: address_city?.trim() || null,
        address_state: address_state?.trim() || null,
        address_zipcode: address_zipcode?.trim() || null
      })

    if (profileError) {
      console.error('❌ [create-user] Erro ao criar perfil:', profileError)
      // Tentar deletar o usuário do Auth se o perfil falhar
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ [create-user] Perfil criado com sucesso')

    // Criar subscription
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1) // 1 ano de validade

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id,
        plan_name: planData.name,
        plan_description: `Plano ${planData.name} - ${planData.max_users} usuários, ${planData.max_storage_gb}GB`,
        plan_price: planData.price_monthly,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        current_users: 1,
        current_storage_gb: 0
      })

    if (subError) {
      console.error('⚠️ [create-user] Erro ao criar subscription:', subError)
      // Não falhar completamente, apenas logar
    } else {
      console.log('✅ [create-user] Subscription criada com sucesso')
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        status: 'pending_confirmation'
      },
      message: `Usuário ${full_name} criado com sucesso! Um email de confirmação foi enviado para ${email}.`
    })

  } catch (error: any) {
    console.error('❌ [create-user] Erro interno:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
