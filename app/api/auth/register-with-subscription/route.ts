import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe/server'

/**
 * API para registrar usuário com subscription já paga
 * Fluxo: Pagamento → Registro → Subscription vinculada
 */
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, sessionId } = await request.json()

    // Validações básicas
    if (!fullName || !email || !password || !sessionId) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value
          },
        },
      }
    )

    // 1. Verificar sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Pagamento não confirmado' },
        { status: 400 }
      )
    }

    // 2. Verificar se email já existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // 3. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authData.user) {
      console.error('Erro ao criar usuário:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    // 4. Criar perfil
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      email: email.toLowerCase(),
      status: 'active',
      registration_type: 'individual',
      registration_completed: true,
    })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      // Tentar deletar usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Erro ao criar perfil' },
        { status: 500 }
      )
    }

    // 5. Buscar plano
    const planType = session.metadata?.plan_type
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, type')
      .eq('type', planType)
      .single()

    if (planError || !plan) {
      console.error('Erro ao buscar plano:', planError)
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // 6. Criar subscription com trial de 14 dias
    const now = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14) // 14 dias

    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      user_id: authData.user.id,
      plan_id: plan.id,
      status: 'trial',
      start_date: now.toISOString(),
      trial_start_date: now.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      current_users: 1,
      current_storage_gb: 0,
      is_trial: true,
    })

    if (subscriptionError) {
      console.error('Erro ao criar subscription:', subscriptionError)
      // Não falhar o registro, mas logar o erro
      // A subscription pode ser criada depois via webhook
    }

    // 7. Atualizar metadata do Stripe com user_id
    try {
      if (session.subscription) {
        await stripe.subscriptions.update(session.subscription as string, {
          metadata: {
            user_id: authData.user.id,
            plan_type: planType,
          },
        })
      }
    } catch (stripeError) {
      console.error('Erro ao atualizar metadata do Stripe:', stripeError)
      // Não crítico, continuar
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
      },
      subscription: {
        plan_name: plan.name,
        plan_type: plan.type,
        trial_end_date: trialEnd.toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao registrar com subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    )
  }
}
