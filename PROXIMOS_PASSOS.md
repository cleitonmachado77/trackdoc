# 🚀 Próximos Passos - Configuração Final

## ✅ O Que Você Tem

- ✅ Chaves do Stripe (Publishable e Secret)
- ✅ 4 Produtos criados no Stripe:
  - Plano Gratuito (R$ 0)
  - Plano Básico (R$ 149)
  - Plano Profissional (R$ 349)
  - Plano Enterprise (R$ 649)

## 🎯 O Que Falta (15 minutos)

### 1️⃣ Configurar Variáveis de Ambiente (2 min)

**Opção A: Automático**
```bash
node scripts/configure-stripe.js
```

**Opção B: Manual**

Adicione no `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2️⃣ Obter Price IDs (3 min)

**Você precisa dos Price IDs (não Product IDs)!**

#### Como Encontrar:

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique em **"Plano Básico"**
3. Na seção "Pricing", copie o **Price ID** (começa com `price_`)
4. Repita para Profissional e Enterprise

**Ou via CLI:**
```bash
stripe login
stripe prices list
```

**Me envie os 3 Price IDs** e eu crio o SQL pronto para você!

### 3️⃣ Atualizar Banco de Dados (2 min)

Depois de obter os Price IDs, execute no **Supabase SQL Editor**:

```sql
-- SUBSTITUA pelos seus Price IDs reais!
UPDATE plans SET stripe_price_id = 'price_SEU_ID_BASICO' WHERE type = 'basico';
UPDATE plans SET stripe_price_id = 'price_SEU_ID_PROFISSIONAL' WHERE type = 'profissional';
UPDATE plans SET stripe_price_id = 'price_SEU_ID_ENTERPRISE' WHERE type = 'enterprise';

-- Verificar
SELECT name, type, price_monthly, stripe_price_id FROM plans 
WHERE type IN ('basico', 'profissional', 'enterprise')
ORDER BY price_monthly;
```

### 4️⃣ Configurar Webhook (5 min)

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
# Instalar Stripe CLI (se necessário)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copie o webhook secret** (whsec_...) e adicione no `.env.local`

**Reinicie a aplicação!**

### 5️⃣ Testar (3 min)

#### A. Criar Trial de Teste

No Supabase SQL Editor:
```sql
-- Substitua pelo seu user_id
SELECT create_trial_subscription('seu-user-id', 'profissional');
```

#### B. Ver em "Minha Conta"

1. Acesse: http://localhost:3000/minha-conta
2. Clique na aba **"Plano"**
3. Deve mostrar: **Plano Profissional (Trial) - 14 dias restantes**

#### C. Testar Checkout (depois de adicionar Price IDs)

1. Crie `app/pricing/page.tsx` (código em CONFIGURACAO_STRIPE_RAPIDA.md)
2. Acesse: http://localhost:3000/pricing
3. Clique em "Começar agora"
4. Use cartão: `4242 4242 4242 4242`

---

## 📋 Checklist Rápido

- [ ] ✅ Executar `node scripts/configure-stripe.js`
- [ ] ⏳ Obter 3 Price IDs do Stripe Dashboard
- [ ] ⏳ Atualizar Price IDs no banco (SQL acima)
- [ ] ⏳ Configurar webhook (Stripe CLI)
- [ ] ⏳ Adicionar webhook secret no .env.local
- [ ] ⏳ Reiniciar aplicação
- [ ] ⏳ Criar trial de teste
- [ ] ⏳ Verificar em "Minha Conta"
- [ ] ⏳ Criar página de pricing
- [ ] ⏳ Testar checkout completo

---

## 🎯 Ação Imediata

**AGORA:**

1. Execute:
```bash
node scripts/configure-stripe.js
```

2. **Me envie os 3 Price IDs** dos produtos:
   - Plano Básico → price_???
   - Plano Profissional → price_???
   - Plano Enterprise → price_???

3. Eu crio o SQL pronto para você executar!

---

## 📸 Como Encontrar Price IDs

### No Dashboard:

1. https://dashboard.stripe.com/test/products
2. Clique no produto
3. Veja a seção "Pricing"
4. Copie o ID que começa com `price_`

### Exemplo:
```
Plano Básico
  └─ Pricing
      └─ R$ 149,00 por mês
          └─ price_1ABC123... ← COPIE ESTE
```

---

## 🆘 Precisa de Ajuda?

**Me envie:**
1. Os 3 Price IDs
2. Qualquer erro que aparecer

**Eu vou:**
1. Criar o SQL pronto
2. Ajudar a resolver qualquer problema

---

**Tempo total estimado**: 15 minutos ⏱️

**Próximo passo**: Execute `node scripts/configure-stripe.js` e me envie os Price IDs! 🚀
