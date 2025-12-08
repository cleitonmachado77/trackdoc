# ⚡ Configuração Rápida do Stripe

## ✅ Passo 1: Configurar Variáveis de Ambiente

Adicione no seu `.env.local`:

```env
# Stripe - Chaves de Teste
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui

# Webhook Secret (vamos obter depois)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL da Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ✅ Passo 2: Obter Price IDs

Você precisa dos **Price IDs** (não Product IDs) de cada plano.

### Como Encontrar os Price IDs:

1. Acesse https://dashboard.stripe.com/test/products
2. Clique em cada produto
3. Na seção "Pricing", copie o **Price ID** (começa com `price_`)

**Exemplo**:
- Plano Básico → `price_1ABC...`
- Plano Profissional → `price_2DEF...`
- Plano Enterprise → `price_3GHI...`

### Ou via Stripe CLI:

```bash
# Instalar Stripe CLI (se ainda não tiver)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listar todos os preços
stripe prices list
```

## ✅ Passo 3: Atualizar Banco de Dados

Depois de obter os Price IDs, execute no **SQL Editor do Supabase**:

```sql
-- Substitua pelos seus Price IDs reais
UPDATE plans 
SET stripe_price_id = 'price_SEU_ID_BASICO'
WHERE type = 'basico';

UPDATE plans 
SET stripe_price_id = 'price_SEU_ID_PROFISSIONAL'
WHERE type = 'profissional';

UPDATE plans 
SET stripe_price_id = 'price_SEU_ID_ENTERPRISE'
WHERE type = 'enterprise';

-- Verificar
SELECT name, type, price_monthly, stripe_price_id 
FROM plans 
WHERE type IN ('basico', 'profissional', 'enterprise')
ORDER BY price_monthly;
```

## ✅ Passo 4: Configurar Webhook (Desenvolvimento)

### Terminal 1: Iniciar Aplicação
```bash
npm run dev
```

### Terminal 2: Escutar Webhooks
```bash
# Instalar Stripe CLI (se necessário)
stripe login

# Escutar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copie o webhook secret** que aparece (começa com `whsec_`) e adicione no `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_copiado_aqui
```

**Reinicie a aplicação** após adicionar o webhook secret.

## ✅ Passo 5: Testar

### 5.1 Criar Trial de Teste

No SQL Editor do Supabase:

```sql
-- Substitua pelo seu user_id
SELECT create_trial_subscription('seu-user-id-aqui', 'profissional');

-- Verificar
SELECT * FROM get_user_active_subscription('seu-user-id-aqui');
```

### 5.2 Ver na Página "Minha Conta"

1. Acesse: http://localhost:3000/minha-conta
2. Clique na aba **"Plano"**
3. Deve mostrar: **Plano Profissional (Trial)**

### 5.3 Testar Checkout (Depois de adicionar Price IDs)

1. Crie a página de pricing (código abaixo)
2. Acesse: http://localhost:3000/pricing
3. Clique em "Começar agora"
4. Use cartão de teste: `4242 4242 4242 4242`

## 📝 Código da Página de Pricing

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
      alert('Este plano ainda não está configurado. Por favor, adicione o Price ID no banco de dados.')
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
          includeTrial: !subscription,
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

## 🎯 Checklist Rápido

- [ ] Adicionar chaves do Stripe no `.env.local`
- [ ] Obter Price IDs dos produtos
- [ ] Atualizar Price IDs no banco de dados
- [ ] Configurar webhook (Stripe CLI)
- [ ] Adicionar webhook secret no `.env.local`
- [ ] Reiniciar aplicação
- [ ] Criar trial de teste
- [ ] Ver em "Minha Conta" → aba "Plano"
- [ ] Criar página de pricing
- [ ] Testar checkout

## 📸 Seus Produtos no Stripe

Você tem:
- ✅ Plano Gratuito - R$ 0,00
- ✅ Plano Básico - R$ 149,00
- ✅ Plano Profissional - R$ 349,00
- ✅ Plano Enterprise - R$ 649,00

**Nota**: O preço do Enterprise está R$ 649 no Stripe, mas configuramos R$ 599 no sistema. Você pode:
1. Atualizar o preço no Stripe para R$ 599
2. Ou atualizar no banco para R$ 649

## 🆘 Precisa dos Price IDs?

Me envie os **Price IDs** (não Product IDs) e eu crio o SQL pronto para você executar!

Para encontrar:
1. Dashboard Stripe → Products
2. Clique em cada produto
3. Copie o **Price ID** (começa com `price_`)

---

**Próximo passo**: Me envie os Price IDs e eu configuro tudo para você! 🚀
