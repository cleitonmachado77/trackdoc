'use client'

// Cliente Stripe para o frontend
// Instalar: npm install @stripe/stripe-js

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { stripeConfig } from './config'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripeConfig.publishableKey)
  }
  return stripePromise
}

/**
 * Redireciona para o checkout do Stripe
 */
export async function redirectToCheckout(sessionId: string) {
  const stripe = await getStripe()
  
  if (!stripe) {
    throw new Error('Stripe não foi carregado')
  }

  const { error } = await stripe.redirectToCheckout({ sessionId })
  
  if (error) {
    throw error
  }
}

/**
 * Redireciona para o portal de gerenciamento do cliente
 */
export async function redirectToCustomerPortal() {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const { url } = await response.json()
    
    if (url) {
      window.location.href = url
    }
  } catch (error) {
    console.error('Erro ao redirecionar para portal:', error)
    throw error
  }
}
