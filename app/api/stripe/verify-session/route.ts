import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API para verificar sessão de checkout do Stripe
 * Usada na página de registro para validar pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Pagamento não confirmado' },
        { status: 400 }
      )
    }

    // Buscar informações do plano
    const planType = session.metadata?.plan_type
    
    if (!planType) {
      return NextResponse.json(
        { error: 'Plano não identificado na sessão' },
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

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('type', planType)
      .single()

    if (planError || !plan) {
      console.error('Erro ao buscar plano:', planError)
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      plan_type: planType,
      plan_name: plan.name,
      plan_id: plan.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
    })
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar sessão' },
      { status: 500 }
    )
  }
}
