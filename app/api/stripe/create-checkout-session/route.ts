import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TRIAL_PERIOD_DAYS } from '@/types/subscription'

export async function POST(request: NextRequest) {
  try {
    const { planType, priceId, includeTrial } = await request.json()

    // Verificar autenticação
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Criar sessão de checkout
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      planType,
      priceId,
      trialPeriodDays: includeTrial ? TRIAL_PERIOD_DAYS : undefined,
    })

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url,
    })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}
