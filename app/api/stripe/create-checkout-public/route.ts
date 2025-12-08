import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSessionPublic } from '@/lib/stripe/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API Pública para criar checkout do Stripe
 * Usada pelo site institucional (trackdoc.com.br)
 * NÃO requer autenticação
 */
export async function POST(request: NextRequest) {
  try {
    const { planType, includeTrial } = await request.json()

    if (!planType) {
      return NextResponse.json(
        { error: 'Tipo de plano é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar plano no banco usando Service Role Key
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
      .eq('is_active', true)
      .single()

    if (planError || !plan || !plan.stripe_price_id) {
      console.error('Erro ao buscar plano:', planError)
      return NextResponse.json(
        { error: 'Plano não encontrado ou não configurado' },
        { status: 404 }
      )
    }

    // Criar sessão de checkout
    const session = await createCheckoutSessionPublic({
      planType: plan.type,
      planName: plan.name,
      priceId: plan.stripe_price_id,
      trialPeriodDays: includeTrial ? 14 : undefined,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.sessionId,
    })
  } catch (error) {
    console.error('Erro ao criar checkout público:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}

// Permitir CORS para o site institucional
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.trackdoc.com.br',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
