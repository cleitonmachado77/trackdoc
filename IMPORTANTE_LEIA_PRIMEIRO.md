# ⚠️ IMPORTANTE - LEIA PRIMEIRO!

## 🎯 Situação Detectada

Você **já possui tabelas de planos** no banco de dados:
- ✅ `plans` (com 4 planos: Trial, Starter, Professional, Enterprise)
- ✅ `subscriptions`
- ✅ `profiles` (com `selected_plan_id`)
- ✅ `usage`

## 🔄 Solução: Adaptação ao Invés de Criação

Ao invés de criar novas tabelas (que causaria conflito), vamos **adaptar as existentes** para funcionar com o novo sistema.

## 📋 O Que Fazer

### ❌ NÃO Execute
```
migrations/001_create_plans_and_subscriptions.sql  ← NÃO USAR
```
Esta migration cria tabelas do zero e causaria conflito.

### ✅ Execute Isto
```
migrations/002_adapt_existing_plans_safe.sql  ← USAR ESTA (RECOMENDADO)
```
Esta migration adapta suas tabelas existentes sem perder dados.
É a versão **segura** que pode ser executada múltiplas vezes.

**Alternativa** (se a safe não funcionar):
```
migrations/002_adapt_existing_plans.sql
```

## 🚀 Início Rápido Correto

### 1. Instalar Dependências
```bash
npm install stripe @stripe/stripe-js date-fns
```

### 2. Configurar Ambiente
Adicione no `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Fazer Backup (Importante!)
No SQL Editor do Supabase:
```sql
CREATE TABLE plans_backup AS SELECT * FROM plans;
CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;
```

### 4. Executar Migration de Adaptação
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `migrations/002_adapt_existing_plans.sql`
4. Clique em **Run**

### 5. Verificar
```bash
node scripts/setup-subscriptions.js
```

## 📊 O Que a Migration Faz

### Adiciona Colunas
- `plans.type` - Tipo do plano (basico, profissional, enterprise)
- `plans.stripe_price_id` - ID do preço no Stripe
- `subscriptions.stripe_customer_id` - ID do cliente no Stripe
- `subscriptions.current_users` - Usuários atuais
- E outras...

### Atualiza Planos Existentes
- Trial → Mantém como trial
- Starter → **Básico** (R$ 149)
- Professional → **Profissional** (R$ 349)
- Enterprise → **Enterprise** (R$ 599)

### Cria Funções RPC
- `get_user_active_subscription()` - Busca subscription ativa
- `create_trial_subscription()` - Cria trial de 14 dias

### Configura Segurança
- Políticas de RLS (Row Level Security)
- Triggers de expiração de trial

## ⚠️ Impacto

### ✅ Sem Perda de Dados
- Todas as subscriptions existentes são mantidas
- Todos os planos existentes são mantidos
- Apenas adiciona colunas e atualiza valores

### ✅ Compatibilidade
- Código antigo continua funcionando
- Pode migrar gradualmente para o novo código
- Reversível (pode fazer rollback)

### ⚠️ Ajuste de Preços
Os preços dos planos serão atualizados:
- Starter: R$ 29,90 → **Básico: R$ 149,00**
- Professional: R$ 79,90 → **Profissional: R$ 349,00**
- Enterprise: R$ 199,90 → **Enterprise: R$ 599,00**

**Subscriptions ativas não são afetadas** - apenas novos clientes pagam os novos preços.

## 📚 Documentação Específica

Leia a documentação completa sobre a migração:
- **[Migração de Tabelas Existentes](docs/MIGRACAO_TABELAS_EXISTENTES.md)** - Guia completo
- **[Início Rápido](INICIO_RAPIDO.md)** - Atualizado para usar migration correta
- **[README Principal](SISTEMA_PLANOS_README.md)** - Visão geral

## 🔍 Verificação Pós-Migration

Após executar a migration, verifique:

```sql
-- Ver planos atualizados
SELECT id, name, type, price_monthly, max_users, max_storage_gb 
FROM plans 
ORDER BY price_monthly;

-- Ver novas colunas
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'plans' 
  AND column_name IN ('type', 'stripe_price_id');

-- Testar função RPC
SELECT * FROM get_user_active_subscription('user-id-aqui');
```

## ✅ Checklist

- [ ] Li este documento completamente
- [ ] Entendi que devo usar `002_adapt_existing_plans.sql`
- [ ] Fiz backup das tabelas
- [ ] Instalei dependências
- [ ] Configurei variáveis de ambiente
- [ ] Executei migration de adaptação
- [ ] Verifiquei que funcionou
- [ ] Li documentação de migração

## 🆘 Problemas?

Se algo der errado:

1. **Restaurar backup**:
```sql
DROP TABLE plans;
ALTER TABLE plans_backup RENAME TO plans;
```

2. **Consultar documentação**:
- [Migração de Tabelas Existentes](docs/MIGRACAO_TABELAS_EXISTENTES.md)
- [FAQ](docs/FAQ.md)

3. **Verificar logs** do Supabase

## 🎉 Próximos Passos

Após a migration bem-sucedida:

1. ✅ Configurar produtos no Stripe
2. ✅ Atualizar `stripe_price_id` nos planos
3. ✅ Testar criação de trial
4. ✅ Integrar componentes React
5. ✅ Testar fluxo completo

---

**RESUMO**: Use `migrations/002_adapt_existing_plans.sql` ao invés de `001_create_plans_and_subscriptions.sql`

**Motivo**: Você já tem tabelas de planos, vamos adaptá-las!

**Segurança**: Faça backup antes de executar qualquer migration!
