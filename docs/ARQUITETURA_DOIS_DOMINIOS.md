# 🌐 Arquitetura - Dois Domínios com Pagamento Antes do Registro

## 📋 Cenário

- **Site Institucional**: https://www.trackdoc.com.br (Landing page + Preços)
- **Aplicação**: https://www.trackdoc.app.br (Sistema + Registro + Login)

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DO USUÁRIO                              │
└─────────────────────────────────────────────────────────────────┘

1. trackdoc.com.br/#precos
   └─ Usuário escolhe plano
   └─ Clica em "Começar agora"
   
2. Stripe Checkout
   └─ Usuário preenche dados de pagamento
   └─ Pagamento processado
   
3. trackdoc.app.br/register?session_id=xxx
   └─ Página de registro com plano já pago
   └─ Usuário cria conta
   └─ Subscription vinculada automaticamente
   
4. trackdoc.app.br/login
   └─ Login com verificação de subscription
   └─ Bloqueio automático se:
      • Trial expirado
      • Pagamento falhou
      • Subscription cancelada
```

## 🎯 Implementação

### 1. Site Institucional (trackdoc.com.br)

#### Página de Preços com Botões de Checkout

```html
<!-- trackdoc.com.br/#precos -->
<div class="pricing-cards">
  <!-- Plano Básico -->
  <div class="plan-card">
    <h3>Básico</h3>
    <p class="price">R$ 149/mês</p>
    <button onclick="startCheckout('basico')">Começar agora</button>
  </div>
  
  <!-- Plano Profissional -->
  <div class="plan-card popular">
    <h3>Profissional</h3>
    <p class="price">R$ 349/mês</p>
    <button onclick="startCheckout('profissional')">Começar teste grátis</button>
  </div>
  
  <!-- Plano Enterprise -->
  <div class="plan-card">
    <h3>Enterprise</h3>
    <p class="price">R$ 599/mês</p>
    <button onclick="startCheckout('enterprise')">Começar agora</button>
  </div>
</div>

<script>
async function startCheckout(planType) {
  try {
    // Chamar API no domínio da aplicação
    const response = await fetch('https://www.trackdoc.app.br/api/stripe/create-checkout-public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planType: planType,
        includeTrial: true, // Sempre incluir trial de 14 dias
      }),
    })
    
    const { url, error } = await response.json()
    
    if (error) {
      alert('Erro ao processar. Tente novamente.')
      return
    }
    
    // Redirecionar para Stripe Checkout
    window.location.href = url
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao processar. Tente novamente.')
  }
}
</script>
```

### 2. API de Checkout Público (trackdoc.app.br)

#### Criar nova API que não requer autenticação

```typescript
// app/api/stripe/create-checkout-public/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSessionPublic } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const { planType, includeTrial } = await request.json()

    if (!planType) {
      return NextResponse.json(
        { error: 'Tipo de plano é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar plano no banco
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usar service role
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
      return NextResponse.json(
        { error: 'Plano não encontrado ou não configurado' },
        { status: 404 }
      )
    }

    // Criar sessão de checkout
    const session = await createCheckoutSessionPublic({
      planType: plan.type,
      priceId: plan.stripe_price_id,
      trialPeriodDays: includeTrial ? 14 : undefined,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.sessionId,
    })
  } catch (error) {
    console.error('Erro ao criar checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}
```

### 3. Função Stripe para Checkout Público

```typescript
// lib/stripe/server.ts (adicionar esta função)

/**
 * Cria sessão de checkout SEM usuário autenticado
 * Para uso no site institucional
 */
export async function createCheckoutSessionPublic(params: {
  planType: PlanType
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
      },
    },
    // URLs de redirecionamento
    success_url: `https://www.trackdoc.app.br/register?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://www.trackdoc.com.br/#precos`,
    // Permitir coleta de email
    customer_email: undefined, // Stripe vai pedir o email
    // Metadata para rastreamento
    metadata: {
      plan_type: params.planType,
      source: 'institutional_site',
    },
  })

  return {
    sessionId: session.id,
    url: session.url || '',
  }
}
```

### 4. Página de Registro com Plano Pago

```typescript
// app/register/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const session = searchParams.get('session_id')
    if (session) {
      setSessionId(session)
      verifySession(session)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (data.error) {
        toast({
          title: 'Erro',
          description: 'Sessão de pagamento inválida',
          variant: 'destructive',
        })
        return
      }

      setSessionData(data)
      
      // Preencher email automaticamente
      if (data.customer_email) {
        setFormData(prev => ({ ...prev, email: data.customer_email }))
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/auth/register-with-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          sessionId: sessionId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast({
          title: 'Erro no registro',
          description: data.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso. Redirecionando...',
      })

      // Redirecionar para login ou dashboard
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      console.error('Erro ao registrar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar conta. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Criar Conta</h1>
        {sessionData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              ✓ Pagamento confirmado!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Plano: {sessionData.plan_name} - 14 dias grátis
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nome Completo
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            disabled={!!sessionData?.customer_email}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Senha
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Confirmar Senha
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>

      {!sessionId && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ainda não escolheu um plano?
          </p>
          <a
            href="https://www.trackdoc.com.br/#precos"
            className="text-primary hover:underline"
          >
            Ver planos disponíveis
          </a>
        </div>
      )}
    </div>
  )
}
```

### 5. API para Verificar Sessão do Stripe

```typescript
// app/api/stripe/verify-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Pagamento não confirmado' },
        { status: 400 }
      )
    }

    // Buscar informações do plano
    const planType = session.metadata?.plan_type
    
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

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('type', planType)
      .single()

    return NextResponse.json({
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      plan_type: planType,
      plan_name: plan?.name,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      amount_total: session.amount_total,
    })
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar sessão' },
      { status: 500 }
    )
  }
}
```

### 6. API para Registro com Subscription

```typescript
// app/api/auth/register-with-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, sessionId } = await request.json()

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

    // 2. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    // 3. Criar perfil
    await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      status: 'active',
    })

    // 4. Buscar plano
    const planType = session.metadata?.plan_type
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('type', planType)
      .single()

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // 5. Criar subscription
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14) // 14 dias

    await supabase.from('subscriptions').insert({
      user_id: authData.user.id,
      plan_id: plan.id,
      status: 'trial',
      start_date: new Date().toISOString(),
      trial_start_date: new Date().toISOString(),
      trial_end_date: trialEnd.toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      current_users: 1,
      current_storage_gb: 0,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error('Erro ao registrar com subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
```

### 7. Middleware para Bloquear Login

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Se não estiver autenticado, permitir acesso
  if (!user) {
    return response
  }

  // Verificar subscription
  const { data: subscription } = await supabase
    .rpc('get_user_active_subscription', { p_user_id: user.id })
    .single()

  // Bloquear se não tiver subscription ativa ou trial
  if (!subscription || !['active', 'trial'].includes(subscription.status)) {
    // Redirecionar para página de renovação
    return NextResponse.redirect(new URL('/subscription-expired', request.url))
  }

  // Bloquear se trial expirou
  if (subscription.status === 'trial' && subscription.trial_end_date) {
    const trialEnd = new Date(subscription.trial_end_date)
    if (trialEnd < new Date()) {
      return NextResponse.redirect(new URL('/trial-expired', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/documentos/:path*',
    '/biblioteca-publica/:path*',
    // Adicione todas as rotas protegidas
  ],
}
```

## 📊 Resumo do Fluxo

| Etapa | Onde | O Que Acontece |
|-------|------|----------------|
| 1 | trackdoc.com.br | Usuário escolhe plano |
| 2 | Stripe | Pagamento processado |
| 3 | trackdoc.app.br/register | Registro com plano pago |
| 4 | Banco de Dados | Subscription criada |
| 5 | trackdoc.app.br/login | Login com verificação |
| 6 | Middleware | Bloqueio automático se necessário |

## ✅ Vantagens desta Arquitetura

1. ✅ **Pagamento antes do registro** - Reduz fraude
2. ✅ **Trial automático** - 14 dias após pagamento
3. ✅ **Bloqueio automático** - Via middleware
4. ✅ **Dois domínios** - Separação clara
5. ✅ **Rastreamento completo** - Via Stripe metadata

## 🔒 Segurança

- ✅ Verificação de sessão do Stripe
- ✅ Service Role Key para operações admin
- ✅ Middleware para bloqueio de acesso
- ✅ RLS no Supabase
- ✅ Validação de pagamento

## 📝 Próximos Passos

1. Implementar APIs no trackdoc.app.br
2. Adicionar botões no trackdoc.com.br
3. Atualizar página de registro
4. Configurar middleware
5. Testar fluxo completo

---

**Documentação completa**: Continue lendo para implementação detalhada
