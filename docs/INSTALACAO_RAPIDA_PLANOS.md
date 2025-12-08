# 🚀 Instalação Rápida - Sistema de Planos

## Passo 1: Instalar Dependências

```bash
npm install stripe @stripe/stripe-js date-fns
```

## Passo 2: Executar Migration

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `migrations/001_create_plans_and_subscriptions.sql`
4. Execute

## Passo 3: Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Stripe (obtenha em https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Passo 4: Criar Produtos no Stripe

### Opção A: Via Dashboard (Recomendado)

1. Acesse https://dashboard.stripe.com/products
2. Clique em "Add product"
3. Crie os 3 produtos:

**Produto 1: Básico**
- Nome: Básico
- Preço: R$ 149,00
- Recorrência: Mensal
- Copie o `price_id` (ex: `price_1ABC...`)

**Produto 2: Profissional**
- Nome: Profissional
- Preço: R$ 349,00
- Recorrência: Mensal
- Copie o `price_id`

**Produto 3: Enterprise**
- Nome: Enterprise
- Preço: R$ 599,00
- Recorrência: Mensal
- Copie o `price_id`

### Opção B: Via Stripe CLI

```bash
# Instalar Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
# Linux: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Criar produtos
stripe products create --name="Básico" --description="Plano Básico"
stripe prices create --product=prod_xxx --unit-amount=14900 --currency=brl --recurring[interval]=month

stripe products create --name="Profissional" --description="Plano Profissional"
stripe prices create --product=prod_yyy --unit-amount=34900 --currency=brl --recurring[interval]=month

stripe products create --name="Enterprise" --description="Plano Enterprise"
stripe prices create --product=prod_zzz --unit-amount=59900 --currency=brl --recurring[interval]=month
```

## Passo 5: Atualizar Planos no Supabase

No SQL Editor do Supabase, execute:

```sql
-- Substitua pelos seus price_ids reais
UPDATE plans SET stripe_price_id = 'price_1ABC...' WHERE type = 'basico';
UPDATE plans SET stripe_price_id = 'price_2DEF...' WHERE type = 'profissional';
UPDATE plans SET stripe_price_id = 'price_3GHI...' WHERE type = 'enterprise';
```

## Passo 6: Configurar Webhook (Desenvolvimento)

### Usando Stripe CLI (Recomendado para dev)

```bash
# Terminal 1: Iniciar aplicação
npm run dev

# Terminal 2: Escutar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copie o webhook secret (whsec_...) e adicione no .env.local
```

### Usando Dashboard (Produção)

1. Acesse https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Eventos:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_failed
   - ✅ invoice.payment_succeeded
5. Copie o webhook secret

## Passo 7: Testar

### Criar Trial Manualmente

No SQL Editor do Supabase:

```sql
-- Substitua pelo ID do seu usuário
SELECT create_trial_subscription('user-id-aqui', 'profissional');
```

### Testar Checkout

1. Acesse `/pricing`
2. Clique em "Começar agora"
3. Use cartão de teste: `4242 4242 4242 4242`
4. Data: qualquer futura
5. CVC: qualquer 3 dígitos
6. CEP: qualquer

## ✅ Verificação

Execute no SQL Editor:

```sql
-- Ver planos criados
SELECT * FROM plans;

-- Ver subscriptions
SELECT * FROM subscriptions;

-- Testar função RPC
SELECT * FROM get_user_active_subscription('user-id-aqui');
```

## 🎯 Próximos Passos

1. Integrar na página "Minha Conta"
2. Adicionar trial automático no registro
3. Proteger rotas com FeatureGate
4. Testar fluxo completo

## 🆘 Problemas Comuns

### "Stripe não carregado"
- Verifique se `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está no `.env.local`
- Reinicie o servidor: `npm run dev`

### "Tabela plans não existe"
- Execute a migration no Supabase SQL Editor

### Webhook não funciona
- Use Stripe CLI para desenvolvimento
- Verifique se o endpoint está acessível
- Confirme que o secret está correto

### "No active subscription"
- Crie um trial manualmente com a função SQL
- Ou complete um checkout de teste

## 📞 Suporte

Consulte a documentação completa em `docs/PLANOS_E_SUBSCRIPTIONS.md`
