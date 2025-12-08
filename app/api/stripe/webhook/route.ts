import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { stripeConfig } from '@/lib/stripe/config'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Assinatura ausente' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeConfig.webhookSecret
    )
  } catch (error) {
    console.error('Erro ao verificar webhook:', error)
    return NextResponse.json(
      { error: 'Webhook inválido' },
      { status: 400 }
    )
  }

  const supabase = createServerSupabaseClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Atualizar subscription com dados do Stripe
        if (session.subscription && session.client_reference_id) {
          await supabase
            .from('subscriptions')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              status: 'active',
            })
            .eq('user_id', session.client_reference_id)
            .eq('status', 'trial')
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Atualizar status da subscription
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 
                   subscription.status === 'canceled' ? 'canceled' : 
                   subscription.status === 'past_due' ? 'past_due' : 'expired',
            end_date: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Marcar subscription como cancelada
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Marcar subscription como past_due
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Reativar subscription se estava past_due
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
            })
            .eq('stripe_subscription_id', invoice.subscription as string)
            .eq('status', 'past_due')
        }
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
