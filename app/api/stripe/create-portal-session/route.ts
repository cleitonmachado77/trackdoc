import { NextRequest, NextResponse } from 'next/server'
import { createCustomerPortalSession } from '@/lib/stripe/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar subscription do usuário
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 404 }
      )
    }

    // Criar sessão do portal
    const session = await createCustomerPortalSession(subscription.stripe_customer_id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão do portal' },
      { status: 500 }
    )
  }
}
