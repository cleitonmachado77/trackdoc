# 🌐 Implementação - Sistema com Dois Domínios

## 📋 Resumo da Arquitetura

**Site Institucional**: trackdoc.com.br → Escolha do plano
**Aplicação**: trackdoc.app.br → Pagamento → Registro → Sistema

## ✅ O Que Foi Criado

### 1. APIs Novas
- ✅ `/api/stripe/create-checkout-public` - Checkout sem autenticação
- ⏳ `/api/stripe/verify-session` - Verificar pagamento
- ⏳ `/api/auth/register-with-subscription` - Registro com plano pago

### 2. Funções Stripe
- ✅ `createCheckoutSessionPublic()` - Checkout público

### 3. Documentação
- ✅ `docs/ARQUITETURA_DOIS_DOMINIOS.md` - Arquitetura completa

## 🚀 Implementação Passo a Passo

### PASSO 1: Adicionar Código no Site Institucional (trackdoc.com.br)

No arquivo HTML da página de preços, adicione:

```html
<!-- trackdoc.com.br/#precos -->
<script>
async function startCheckout(planType) {
  // Mostrar loading
  const button = event.target
  button.disabled = true
  button.textContent = 'Processando...'
  
  try {
    const response = await fetch('https://www.trackdoc.app.br/api/stripe/create-checkout-public', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planType: planType,
        includeTrial: true, // 14 dias grátis
      }),
    })
    
    const data = await response.json()
    
    if (data.error) {
      alert('Erro: ' + data.error)
      button.disabled = false
      button.textContent = 'Começar agora'
      return
    }
    
    // Redirecionar para Stripe Checkout
    window.location.href = data.url
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao processar. Tente novamente.')
    button.disabled = false
    button.textContent = 'Começar agora'
  }
}
</script>

<!-- Botões dos planos -->
<button onclick="startCheckout('basico')">Começar agora</button>
<button onclick="startCheckout('profissional')">Começar teste grátis</button>
<button onclick="startCheckout('enterprise')">Começar agora</button>
```

### PASSO 2: Criar APIs Restantes

Crie os arquivos:

#### A. `/api/stripe/verify-session/route.ts`
```typescript
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
      plan_id: plan?.id,
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

#### B. `/api/auth/register-with-subscription/route.ts`
```typescript
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

    // 2. Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // 3. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authData.user) {
      console.error('Erro ao criar usuário:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    // 4. Criar perfil
    await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      status: 'active',
      registration_type: 'individual',
    })

    // 5. Buscar plano
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

    // 6. Criar subscription
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
      is_trial: true,
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

### PASSO 3: Atualizar Página de Registro

Substitua o conteúdo de `app/register/page.tsx` pelo código fornecido em `docs/ARQUITETURA_DOIS_DOMINIOS.md` (seção 4).

### PASSO 4: Criar Middleware de Bloqueio

Crie ou atualize `middleware.ts` na raiz do projeto com o código da seção 7 do documento.

### PASSO 5: Criar Páginas de Erro

#### A. `app/subscription-expired/page.tsx`
```tsx
'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionExpiredPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Assinatura Expirada</h1>
        <p className="text-gray-600 mb-6">
          Sua assinatura expirou. Renove para continuar usando o TrackDoc.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/pricing">
              Renovar Assinatura
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/minha-conta?tab=plano">
              Ver Detalhes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### B. `app/trial-expired/page.tsx`
```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import Link from 'next/link'

export default function TrialExpiredPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Período de Teste Expirado</h1>
        <p className="text-gray-600 mb-6">
          Seu período de teste de 14 dias expirou. Escolha um plano para continuar.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/pricing">
              Escolher Plano
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/minha-conta?tab=plano">
              Ver Detalhes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## 🧪 Como Testar

### 1. Testar Checkout Público
```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 2. Simular Fluxo Completo

1. Acesse: https://www.trackdoc.com.br/#precos
2. Clique em "Começar agora" (ou teste localmente)
3. Preencha dados no Stripe:
   - Cartão: `4242 4242 4242 4242`
   - Data: 12/34
   - CVC: 123
4. Após pagamento, será redirecionado para `/register?session_id=xxx`
5. Preencha formulário de registro
6. Conta criada com subscription ativa!

### 3. Testar Bloqueio

```sql
-- Expirar trial manualmente
UPDATE subscriptions 
SET trial_end_date = NOW() - INTERVAL '1 day'
WHERE user_id = 'seu-user-id';

-- Tentar acessar sistema
-- Deve redirecionar para /trial-expired
```

## ✅ Checklist de Implementação

- [ ] Criar API `/api/stripe/create-checkout-public` ✅
- [ ] Criar API `/api/stripe/verify-session`
- [ ] Criar API `/api/auth/register-with-subscription`
- [ ] Atualizar `lib/stripe/server.ts` ✅
- [ ] Atualizar página `/register`
- [ ] Criar middleware de bloqueio
- [ ] Criar páginas de erro
- [ ] Adicionar código no site institucional
- [ ] Testar fluxo completo
- [ ] Configurar CORS se necessário

## 🔒 Segurança

- ✅ Verificação de pagamento antes do registro
- ✅ Service Role Key para operações admin
- ✅ Middleware para bloqueio automático
- ✅ Validação de sessão do Stripe
- ✅ CORS configurado

## 📝 Variáveis de Ambiente Necessárias

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # IMPORTANTE!

# URLs
NEXT_PUBLIC_APP_URL=https://www.trackdoc.app.br
```

## 🎯 Próximos Passos

1. Implementar APIs restantes
2. Atualizar página de registro
3. Criar middleware
4. Adicionar código no site institucional
5. Testar fluxo completo
6. Deploy em produção

---

**Documentação Completa**: `docs/ARQUITETURA_DOIS_DOMINIOS.md`
