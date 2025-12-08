// Servidor Stripe para o backend
// Instalar: npm install stripe

import Stripe from 'stripe'
import { stripeConfig, getStripeUrls } from './config'
import type { PlanType } from '@/types/subscription'

// Inicializar Stripe de forma lazy (apenas quando necessário)
let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!stripeConfig.secretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }
    stripeInstance = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

// Manter compatibilidade com código existente
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeClient = getStripe()
    return stripeClient[prop as keyof Stripe]
  }
})

/**
 * Cria sessão de checkout PÚBLICA (sem usuário autenticado)
 * Para uso no site institucional
 */
export async function createCheckoutSessionPublic(params: {
  planType: PlanType
  planName: string
  priceId: string
  trialPeriodDays?: number
}): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: params.trialPeriodDays,
      metadata: {
        plan_type: params.planType,
        plan_name: params.planName,
      },
    },
    // URLs de redirecionamento
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://www.trackdoc.com.br/#precos`,
    // Metadata para rastreamento
    metadata: {
      plan_type: params.planType,
      plan_name: params.planName,
      source: 'institutional_site',
    },
    // Configurações adicionais
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'pt-BR',
  })

  return {
    sessionId: session.id,
    url: session.url || '',
  }
}

/**
 * Cria uma sessão de checkout para assinatura (usuário autenticado)
 */
export async function createCheckoutSession(params: {
  userId: string
  userEmail: string
  planType: PlanType
  priceId: string
  trialPeriodDays?: number
}): Promise<{ sessionId: string; url: string }> {
  const urls = getStripeUrls()

  const session = await stripe.checkout.sessions.create({
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: params.trialPeriodDays,
      metadata: {
        user_id: params.userId,
        plan_type: params.planType,
      },
    },
    success_url: urls.success,
    cancel_url: urls.cancel,
    metadata: {
      user_id: params.userId,
      plan_type: params.planType,
    },
  })

  return {
    sessionId: session.id,
    url: session.url || '',
  }
}

/**
 * Cria uma sessão do portal do cliente
 */
export async function createCustomerPortalSession(
  customerId: string
): Promise<{ url: string }> {
  const urls = getStripeUrls()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: urls.return,
  })

  return {
    url: session.url,
  }
}

/**
 * Busca informações de uma subscription do Stripe
 */
export async function getStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancela uma subscription no Stripe
 */
export async function cancelStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Cria ou atualiza um cliente no Stripe
 */
export async function createOrUpdateStripeCustomer(params: {
  email: string
  name?: string
  userId: string
}): Promise<Stripe.Customer> {
  // Buscar cliente existente
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0]
    
    // Atualizar metadata se necessário
    if (customer.metadata.user_id !== params.userId) {
      return await stripe.customers.update(customer.id, {
        metadata: {
          user_id: params.userId,
        },
      })
    }
    
    return customer
  }

  // Criar novo cliente
  return await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      user_id: params.userId,
    },
  })
}

/**
 * Verifica assinatura do Stripe
 */
export async function verifyStripeSubscription(
  subscriptionId: string
): Promise<{
  isActive: boolean
  status: string
  currentPeriodEnd: Date
}> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  return {
    isActive: subscription.status === 'active' || subscription.status === 'trialing',
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  }
}
