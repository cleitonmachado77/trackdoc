# 💳 Integração Completa com Stripe

## 📋 Pré-requisitos

- ✅ Migration executada (`002_adapt_existing_plans_safe.sql`)
- ✅ Planos atualizados no banco
- ✅ Dependências instaladas (`stripe`, `@stripe/stripe-js`)
- ✅ Conta no Stripe criada

## 🎯 Passo 1: Configurar Conta Stripe

### 1.1 Criar Conta
1. Acesse https://dashboard.stripe.com/register
2. Complete o cadastro
3. Ative o modo de teste

### 1.2 Obter Chaves de API
1. Acesse https://dashboard.stripe.com/apikeys
2. Copie:
   - **Publishable key** (começa com `pk_test_`)
   - **Secret key** (começa com `sk_test_`)

### 1.3 Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Stripe - Chaves de Teste
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_...  # Vamos obter depois

# URL da Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Passo 2: Criar Produtos no Stripe

### Opção A: Via Dashboard (Recomendado)

#### 2.1 Criar Produto Básico

1. Acesse https://dashboard.stripe.com/products
2. Clique em **"+ Add product"**
3. Preencha:
   - **Name**: Básico
   - **Description**: Ideal para pequenas equipes começando com gestão documental
   - **Pricing**: 
     - Model: **Standard pricing**
     - Price: **R$ 149,00**
     - Billing period: **Monthly**
     - Currency: **BRL**
4. Clique em **"Save product"**
5. **Copie o Price ID** (ex: `price_1ABC...`)

#### 2.2 Criar Produto Profissional

1. Clique em **"+ Add product"**
2. Preencha:
   - **Name**: Profissional
   - **Description**: Para empresas que precisam de recursos avançados de gestão
   - **Pricing**: 
     - Price: **R$ 349,00**
     - Billing period: **Monthly**
     - Currency: **BRL**
3. Clique em **"Save product"**
4. **Copie o Price ID**

#### 2.3 Criar Produto Enterprise

1. Clique em **"+ Add product"**
2. Preencha:
   - **Name**: Enterprise
   - **Description**: Solução completa para grandes empresas
   - **Pricing**: 
     - Price: **R$ 599,00**
     - Billing period: **Monthly**
     - Currency: **BRL**
3. Clique em **"Save product"**
4. **Copie o Price ID**

### Opção B: Via Stripe CLI

```bash
# Instalar Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Criar produtos
stripe products create --name="Básico" --description="Plano Básico"
# Copie o product_id retornado (prod_xxx)

stripe prices create \
  --product=prod_xxx \
  --unit-amount=14900 \
  --currency=brl \
  --recurring[interval]=month

# Repetir para Profissional e Enterprise
```

## 🎯 Passo 3: Atualizar Planos no Banco

No SQL Editor do Supabase:

```sql
-- Atualizar com os Price IDs do Stripe
UPDATE plans 
SET stripe_price_id = 'price_1ABC...',  -- Substitua pelo ID real
    stripe_product_id = 'prod_ABC...'   -- Opcional
WHERE type = 'basico';

UPDATE plans 
SET stripe_price_id = 'price_2DEF...',
    stripe_product_id = 'prod_DEF...'
WHERE type = 'profissional';

UPDATE plans 
SET stripe_price_id = 'price_3GHI...',
    stripe_product_id = 'prod_GHI...'
WHERE type = 'enterprise';

-- Verificar
SELECT name, type, price_monthly, stripe_price_id 
FROM plans 
WHERE type IN ('basico', 'profissional', 'enterprise')
ORDER BY price_monthly;
```

## 🎯 Passo 4: Configurar Webhook

### 4.1 Desenvolvimento (Stripe CLI)

```bash
# Terminal 1: Iniciar aplicação
npm run dev

# Terminal 2: Escutar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copie o webhook secret (whsec_...) e adicione no .env.local
```

### 4.2 Produção (Dashboard)

1. Acesse https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. Preencha:
   - **Endpoint URL**: `https://seu-dominio.com/api/stripe/webhook`
   - **Description**: TrackDoc Webhook
   - **Events to send**: Selecione:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_failed`
     - ✅ `invoice.payment_succeeded`
4. Clique em **"Add endpoint"**
5. **Copie o Signing secret** (whsec_...)
6. Adicione no `.env.local` de produção

## 🎯 Passo 5: Criar Página de Pricing

Crie o arquivo `app/pricing/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { PlanCard } from '@/components/subscription/PlanCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { createClientSupabaseClient } from '@/lib/supabase/client'

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { subscription } = useSubscription(user?.id)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .in('type', ['basico', 'profissional', 'enterprise'])
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (plan: any) => {
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    if (!plan.stripe_price_id) {
      alert('Este plano ainda não está configurado. Entre em contato com o suporte.')
      return
    }

    setCheckoutLoading(plan.id)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: plan.type,
          priceId: plan.stripe_price_id,
          includeTrial: !subscription, // Trial apenas para novos usuários
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-xl text-muted-foreground">
          Comece com 14 dias grátis. Cancele quando quiser.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={subscription?.plan_id === plan.id}
            isPopular={plan.type === 'profissional'}
            onSelect={() => handleSelectPlan(plan)}
            loading={checkoutLoading === plan.id}
          />
        ))}
      </div>

      {!user && (
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Já tem uma conta?
          </p>
          <Button variant="outline" onClick={() => router.push('/login')}>
            Fazer Login
          </Button>
        </div>
      )}
    </div>
  )
}
```

## 🎯 Passo 6: Testar Fluxo Completo

### 6.1 Testar Criação de Trial

No SQL Editor:

```sql
-- Criar trial para seu usuário
SELECT create_trial_subscription('seu-user-id', 'profissional');

-- Verificar
SELECT * FROM get_user_active_subscription('seu-user-id');
```

### 6.2 Testar Página "Minha Conta"

1. Acesse http://localhost:3000/minha-conta
2. Clique na aba **"Plano"**
3. Verifique se mostra:
   - ✅ Nome do plano
   - ✅ Status (Trial/Ativo)
   - ✅ Dias restantes do trial
   - ✅ Uso de recursos
   - ✅ Funcionalidades incluídas

### 6.3 Testar Checkout

1. Acesse http://localhost:3000/pricing
2. Clique em **"Começar agora"** em um plano
3. Deve redirecionar para Stripe Checkout
4. Use cartão de teste:
   - **Número**: `4242 4242 4242 4242`
   - **Data**: Qualquer futura (ex: 12/34)
   - **CVC**: Qualquer 3 dígitos (ex: 123)
   - **CEP**: Qualquer (ex: 12345-678)
5. Complete o pagamento
6. Deve redirecionar para `/minha-conta?tab=plano&payment=success`

### 6.4 Verificar Webhook

No terminal onde está rodando `stripe listen`, você deve ver:

```
✔ Received event: checkout.session.completed
✔ Forwarded to http://localhost:3000/api/stripe/webhook
```

No banco, verifique:

```sql
-- Ver subscription atualizada
SELECT 
  s.id,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  p.name as plan_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'seu-user-id';
```

### 6.5 Testar Portal do Cliente

1. Em "Minha Conta" > aba "Plano"
2. Clique em **"Gerenciar Pagamento"**
3. Deve abrir o Stripe Customer Portal
4. Teste:
   - ✅ Atualizar método de pagamento
   - ✅ Ver histórico de faturas
   - ✅ Cancelar assinatura

## 🎯 Passo 7: Proteger Funcionalidades

### 7.1 Bloquear Página Inteira

```tsx
// app/biblioteca-publica/page.tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'
import { useAuth } from '@/lib/hooks/use-auth-final'

export default function BibliotecaPublicaPage() {
  const { user } = useAuth()
  
  return (
    <FeatureGate userId={user?.id} feature="biblioteca_publica">
      <div>
        <h1>Biblioteca Pública</h1>
        {/* Conteúdo protegido */}
      </div>
    </FeatureGate>
  )
}
```

### 7.2 Bloquear Funcionalidade Específica

```tsx
// app/documentos/page.tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'
import { useAuth } from '@/lib/hooks/use-auth-final'

export default function DocumentosPage() {
  const { user } = useAuth()
  
  return (
    <div>
      <h1>Documentos</h1>
      
      {/* Funcionalidade básica - sempre disponível */}
      <UploadDocumento />
      
      {/* Funcionalidade premium - bloqueada */}
      <FeatureGate userId={user?.id} feature="assinatura_eletronica_simples">
        <AssinaturaEletronica />
      </FeatureGate>
    </div>
  )
}
```

### 7.3 Verificar Programaticamente

```tsx
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'
import { useAuth } from '@/lib/hooks/use-auth-final'

export function DocumentActions() {
  const { user } = useAuth()
  const { hasAccess, showUpgradePrompt } = useFeatureAccess(
    user?.id, 
    'assinatura_eletronica_multipla'
  )
  
  return (
    <div>
      <Button 
        onClick={() => hasAccess ? signDocument() : null}
        disabled={!hasAccess}
      >
        {!hasAccess && <Lock className="mr-2" />}
        Assinar Documento
      </Button>
      
      {showUpgradePrompt && (
        <p className="text-sm text-muted-foreground mt-2">
          Faça upgrade para o plano Enterprise para assinar múltiplos documentos
        </p>
      )}
    </div>
  )
}
```

## 🎯 Passo 8: Trial Automático no Registro

Adicione no seu fluxo de registro:

```typescript
// app/api/auth/register/route.ts (ou onde você cria usuários)
import { createTrialSubscription } from '@/lib/subscription-utils'

export async function POST(request: Request) {
  // ... código de criação de usuário
  
  // Após criar usuário com sucesso
  const { success, subscriptionId, error } = await createTrialSubscription(
    newUser.id,
    'profissional' // Plano do trial
  )
  
  if (success) {
    console.log('✅ Trial criado:', subscriptionId)
  } else {
    console.error('❌ Erro ao criar trial:', error)
  }
  
  return Response.json({ user: newUser })
}
```

## 📊 Passo 9: Monitoramento

### 9.1 Dashboard de Métricas

```sql
-- Ver subscriptions ativas
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'trial') as trial,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled
FROM subscriptions;

-- Calcular MRR (Monthly Recurring Revenue)
SELECT 
  SUM(p.price_monthly) as mrr
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active';

-- Ver trials expirando nos próximos 3 dias
SELECT 
  s.user_id,
  s.trial_end_date,
  DATE_PART('day', s.trial_end_date - NOW()) as days_remaining
FROM subscriptions s
WHERE s.status = 'trial'
  AND s.trial_end_date <= NOW() + INTERVAL '3 days'
  AND s.trial_end_date > NOW()
ORDER BY s.trial_end_date;
```

### 9.2 Logs do Stripe

```bash
# Ver logs em tempo real
stripe logs tail

# Ver logs de webhooks
stripe logs tail --filter-event-type=checkout.session.completed
```

## ✅ Checklist Final

- [ ] Conta Stripe criada
- [ ] Chaves de API copiadas
- [ ] Variáveis de ambiente configuradas
- [ ] 3 produtos criados no Stripe
- [ ] Price IDs atualizados no banco
- [ ] Webhook configurado (dev ou prod)
- [ ] Página de pricing criada
- [ ] Trial testado
- [ ] Checkout testado
- [ ] Webhook funcionando
- [ ] Portal do cliente testado
- [ ] Funcionalidades protegidas
- [ ] Trial automático implementado

## 🎉 Pronto!

Seu sistema de planos está completamente integrado com Stripe! 🚀

## 📚 Próximos Passos

1. **Adicionar notificações de trial expirando**
2. **Criar emails transacionais**
3. **Implementar planos anuais**
4. **Adicionar cupons de desconto**
5. **Configurar Stripe em produção**

## 🆘 Problemas Comuns

### Webhook não funciona
```bash
# Verificar se está escutando
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Testar manualmente
stripe trigger checkout.session.completed
```

### Checkout não redireciona
- Verifique se `NEXT_PUBLIC_APP_URL` está correto
- Verifique se `stripe_price_id` está preenchido
- Veja logs do console

### Subscription não atualiza
- Verifique logs do webhook
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto
- Teste com `stripe trigger`

---

**Documentação Completa**: Consulte `docs/` para mais detalhes
