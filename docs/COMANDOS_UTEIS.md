# 🛠️ Comandos Úteis - Sistema de Planos

Referência rápida de comandos para gerenciar o sistema de planos.

## 📦 Instalação

```bash
# Instalar dependências
npm install stripe @stripe/stripe-js date-fns

# Verificar instalação
node scripts/setup-subscriptions.js
```

## 🗄️ Banco de Dados (Supabase)

### Executar Migration
```sql
-- Copie e cole no SQL Editor do Supabase
-- Arquivo: migrations/001_create_plans_and_subscriptions.sql
```

### Verificar Tabelas
```sql
-- Ver planos
SELECT * FROM plans;

-- Ver subscriptions
SELECT * FROM subscriptions;

-- Ver subscription de um usuário
SELECT * FROM get_user_active_subscription('user-id-aqui');
```

### Criar Trial Manualmente
```sql
-- Criar trial de 14 dias no plano Profissional
SELECT create_trial_subscription('user-id-aqui', 'profissional');

-- Criar trial no plano Básico
SELECT create_trial_subscription('user-id-aqui', 'basico');

-- Criar trial no plano Enterprise
SELECT create_trial_subscription('user-id-aqui', 'enterprise');
```

### Atualizar Price IDs do Stripe
```sql
-- Atualizar após criar produtos no Stripe
UPDATE plans SET stripe_price_id = 'price_1ABC...' WHERE type = 'basico';
UPDATE plans SET stripe_price_id = 'price_2DEF...' WHERE type = 'profissional';
UPDATE plans SET stripe_price_id = 'price_3GHI...' WHERE type = 'enterprise';

-- Verificar
SELECT name, type, price, stripe_price_id FROM plans;
```

### Consultas Úteis
```sql
-- Ver todas as subscriptions ativas
SELECT 
  s.id,
  s.user_id,
  s.status,
  s.trial_end_date,
  p.name as plan_name,
  p.price
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status IN ('active', 'trial')
ORDER BY s.created_at DESC;

-- Ver subscriptions expirando nos próximos 3 dias
SELECT 
  s.id,
  s.user_id,
  s.trial_end_date,
  p.name as plan_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'trial'
  AND s.trial_end_date <= NOW() + INTERVAL '3 days'
  AND s.trial_end_date > NOW()
ORDER BY s.trial_end_date ASC;

-- Ver uso de recursos por plano
SELECT 
  p.name as plan_name,
  COUNT(s.id) as total_subscriptions,
  AVG(s.current_users) as avg_users,
  AVG(s.current_storage_gb) as avg_storage_gb
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status IN ('active', 'trial')
GROUP BY p.name;

-- Cancelar subscription manualmente
UPDATE subscriptions 
SET status = 'canceled', canceled_at = NOW()
WHERE id = 'subscription-id-aqui';
```

## 💳 Stripe

### Stripe CLI

```bash
# Instalar Stripe CLI
# Windows (Scoop): scoop install stripe
# Mac (Homebrew): brew install stripe/stripe-cli/stripe
# Linux: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Escutar webhooks (desenvolvimento)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Testar webhook específico
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### Criar Produtos via CLI

```bash
# Criar produto Básico
stripe products create \
  --name="Básico" \
  --description="Plano Básico - Ideal para pequenas equipes"

# Criar preço para o produto (substitua prod_xxx pelo ID retornado)
stripe prices create \
  --product=prod_xxx \
  --unit-amount=14900 \
  --currency=brl \
  --recurring[interval]=month

# Repetir para Profissional e Enterprise
```

### Consultar Dados

```bash
# Listar produtos
stripe products list

# Listar preços
stripe prices list

# Ver detalhes de uma subscription
stripe subscriptions retrieve sub_xxx

# Ver detalhes de um cliente
stripe customers retrieve cus_xxx

# Listar webhooks
stripe webhook-endpoints list
```

## 🧪 Testes

### Cartões de Teste

```bash
# Sucesso
4242 4242 4242 4242

# Falha (cartão recusado)
4000 0000 0000 0002

# Requer autenticação (3D Secure)
4000 0027 6000 3184

# Insuficiente fundos
4000 0000 0000 9995

# Expirado
4000 0000 0000 0069
```

### Testar APIs Localmente

```bash
# Criar sessão de checkout
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "profissional",
    "priceId": "price_xxx",
    "includeTrial": true
  }'

# Criar sessão do portal
curl -X POST http://localhost:3000/api/stripe/create-portal-session \
  -H "Content-Type: application/json"
```

## 🔍 Debug

### Logs do Stripe

```bash
# Ver logs em tempo real
stripe logs tail

# Ver logs de webhooks
stripe logs tail --filter-event-type=checkout.session.completed
```

### Verificar Variáveis de Ambiente

```bash
# Windows (PowerShell)
Get-Content .env.local

# Linux/Mac
cat .env.local

# Verificar se variáveis estão carregadas
node -e "console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"
```

### Testar Conexão com Supabase

```javascript
// Criar arquivo test-supabase.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function test() {
  const { data, error } = await supabase.from('plans').select('*')
  console.log('Plans:', data)
  console.log('Error:', error)
}

test()
```

```bash
# Executar teste
node test-supabase.js
```

## 📊 Monitoramento

### Ver Logs da Aplicação

```bash
# Desenvolvimento
npm run dev

# Ver logs do Vercel (produção)
vercel logs

# Ver logs específicos
vercel logs --follow
```

### Verificar Status do Sistema

```sql
-- Dashboard de métricas
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'trial') as trial_subscriptions,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_subscriptions,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_subscriptions
FROM subscriptions;

-- Receita mensal recorrente (MRR)
SELECT 
  SUM(p.price) as mrr
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active';

-- Taxa de conversão de trial
SELECT 
  COUNT(*) FILTER (WHERE status = 'active' AND trial_start_date IS NOT NULL) * 100.0 / 
  COUNT(*) FILTER (WHERE trial_start_date IS NOT NULL) as conversion_rate
FROM subscriptions;
```

## 🔧 Manutenção

### Limpar Subscriptions Expiradas

```sql
-- Marcar trials expirados
UPDATE subscriptions
SET status = 'expired'
WHERE status = 'trial'
  AND trial_end_date < NOW();

-- Ver subscriptions que serão limpas
SELECT * FROM subscriptions
WHERE status = 'expired'
  AND updated_at < NOW() - INTERVAL '90 days';

-- Deletar subscriptions antigas (cuidado!)
DELETE FROM subscriptions
WHERE status = 'expired'
  AND updated_at < NOW() - INTERVAL '90 days';
```

### Backup

```bash
# Backup do banco (Supabase)
# Via Dashboard: Settings > Database > Backups

# Backup local dos dados
pg_dump -h db.xxx.supabase.co -U postgres -d postgres -t plans -t subscriptions > backup.sql
```

## 🚀 Deploy

### Vercel

```bash
# Deploy
vercel

# Deploy em produção
vercel --prod

# Ver variáveis de ambiente
vercel env ls

# Adicionar variável de ambiente
vercel env add STRIPE_SECRET_KEY
```

### Variáveis de Ambiente (Produção)

```bash
# Adicionar no Vercel Dashboard ou via CLI
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 📝 Scripts Personalizados

### Adicionar no package.json

```json
{
  "scripts": {
    "setup:subscriptions": "node scripts/setup-subscriptions.js",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/stripe/webhook",
    "test:subscription": "node scripts/test-subscription.js"
  }
}
```

### Executar

```bash
npm run setup:subscriptions
npm run stripe:listen
```

## 🆘 Troubleshooting

### Erro: "Stripe não carregado"

```bash
# Verificar variável
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Reiniciar servidor
npm run dev
```

### Erro: "Tabela não existe"

```bash
# Executar migration novamente no Supabase SQL Editor
```

### Webhook não funciona

```bash
# Verificar se está escutando
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Testar manualmente
stripe trigger checkout.session.completed

# Ver logs
stripe logs tail
```

---

**Dica**: Salve este arquivo como referência rápida! 📌
