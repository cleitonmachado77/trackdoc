// Configuração do Stripe
// Instalar: npm install stripe @stripe/stripe-js

export const stripeConfig = {
  // Chaves públicas (frontend)
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // Chaves secretas (backend only)
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Configurações
  currency: 'brl',
  locale: 'pt-BR',
}

// Validar configuração
export const validateStripeConfig = () => {
  if (!stripeConfig.publishableKey) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurada')
    return false
  }
  return true
}

// URLs de redirecionamento
export const getStripeUrls = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return {
    success: `${baseUrl}/minha-conta?tab=plano&payment=success`,
    cancel: `${baseUrl}/pricing?payment=canceled`,
    return: `${baseUrl}/minha-conta?tab=plano`,
  }
}
