// Configuração do Stripe
// Instalar: npm install stripe @stripe/stripe-js

// Função helper para obter variáveis de ambiente de forma segura
const getEnvVar = (key: string, defaultValue = ''): string => {
  if (typeof process === 'undefined') return defaultValue
  return process.env[key] || defaultValue
}

export const stripeConfig = {
  // Chaves públicas (frontend)
  publishableKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  
  // Chaves secretas (backend only)
  secretKey: getEnvVar('STRIPE_SECRET_KEY'),
  webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),
  
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
  const baseUrl = getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
  
  return {
    success: `${baseUrl}/minha-conta?tab=plano&payment=success`,
    cancel: `${baseUrl}/pricing?payment=canceled`,
    return: `${baseUrl}/minha-conta?tab=plano`,
  }
}
