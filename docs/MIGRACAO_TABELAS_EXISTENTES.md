# 🔄 Migração - Adaptando Tabelas Existentes

## 📋 Situação Atual

Você já possui as seguintes tabelas no banco:
- ✅ `plans` - Com 4 planos (Trial, Starter, Professional, Enterprise)
- ✅ `subscriptions` - Com estrutura básica
- ✅ `profiles` - Com campo `selected_plan_id`
- ✅ `usage` - Para métricas de uso

## 🎯 O Que Vamos Fazer

Ao invés de criar novas tabelas, vamos **adaptar as existentes** para funcionar com o novo sistema de planos.

## 🔧 Migration de Adaptação

### Arquivo: `migrations/002_adapt_existing_plans.sql`

Esta migration faz:

1. **Adiciona colunas necessárias** nas tabelas existentes
2. **Atualiza os planos** com a nova estrutura
3. **Cria funções RPC** compatíveis
4. **Configura RLS** (Row Level Security)
5. **Mantém dados existentes** intactos

### O Que Será Adicionado

#### Tabela `plans`
```sql
-- Novas colunas
+ type VARCHAR(50)                    -- 'basico', 'profissional', 'enterprise'
+ interval VARCHAR(20)                -- 'monthly', 'yearly'
+ stripe_price_id VARCHAR(255)        -- ID do preço no Stripe
+ stripe_product_id VARCHAR(255)      -- ID do produto no Stripe
+ usuario_adicional_preco DECIMAL     -- Preço por usuário extra
+ armazenamento_extra_preco DECIMAL   -- Preço por GB extra
```

#### Tabela `subscriptions`
```sql
-- Novas colunas
+ entity_id UUID                      -- Referência à entidade
+ stripe_customer_id VARCHAR(255)     -- ID do cliente no Stripe
+ stripe_subscription_id VARCHAR(255) -- ID da subscription no Stripe
+ current_users INTEGER               -- Usuários atuais
+ current_storage_gb DECIMAL          -- Armazenamento atual
+ canceled_at TIMESTAMP               -- Data de cancelamento
+ start_date TIMESTAMP                -- Data de início
+ end_date TIMESTAMP                  -- Data de fim

-- Renomeadas (se necessário)
trial_start → trial_start_date
trial_end → trial_end_date
```

## 📊 Mapeamento de Planos

### Planos Antigos → Novos

| Plano Antigo | Plano Novo | Tipo | Preço Novo |
|--------------|------------|------|------------|
| Trial | Trial | trial | R$ 0 (mantém) |
| Starter | **Básico** | basico | R$ 149 |
| Professional | **Profissional** | profissional | R$ 349 |
| Enterprise | Enterprise | enterprise | R$ 599 |

### Ajustes de Preços

Os preços foram ajustados para o novo modelo:

**Antes:**
- Starter: R$ 29,90
- Professional: R$ 79,90
- Enterprise: R$ 199,90

**Depois:**
- Básico: R$ 149,00
- Profissional: R$ 349,00
- Enterprise: R$ 599,00

**Motivo**: Alinhamento com funcionalidades premium e valor de mercado.

## 🚀 Como Executar a Migration

### Passo 1: Backup (Importante!)

```sql
-- Fazer backup das tabelas
CREATE TABLE plans_backup AS SELECT * FROM plans;
CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;
```

### Passo 2: Executar Migration

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `migrations/002_adapt_existing_plans.sql`
4. Clique em **Run**

### Passo 3: Verificar

```sql
-- Verificar planos atualizados
SELECT id, name, type, price_monthly, max_users, max_storage_gb 
FROM plans 
ORDER BY price_monthly;

-- Verificar colunas adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plans' 
  AND column_name IN ('type', 'stripe_price_id', 'usuario_adicional_preco');

-- Verificar funções RPC
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_user_active_subscription', 'create_trial_subscription');
```

## ⚠️ Impacto em Subscriptions Existentes

### Subscriptions Ativas

As subscriptions existentes **continuarão funcionando**, mas você deve:

1. **Atualizar referências de plano**:
```sql
-- Se houver subscriptions com plan_name ao invés de plan_id
UPDATE subscriptions s
SET plan_id = p.id
FROM plans p
WHERE s.plan_name = p.name
  AND s.plan_id IS NULL;
```

2. **Migrar status**:
```sql
-- Garantir que status está padronizado
UPDATE subscriptions
SET status = CASE
  WHEN status = 'active' THEN 'active'
  WHEN status = 'trial' THEN 'trial'
  WHEN status = 'canceled' THEN 'canceled'
  WHEN status = 'expired' THEN 'expired'
  ELSE 'active'
END;
```

3. **Preencher campos novos**:
```sql
-- Preencher current_users e current_storage_gb
UPDATE subscriptions
SET 
  current_users = COALESCE(current_users, 1),
  current_storage_gb = COALESCE(current_storage_gb, 0),
  start_date = COALESCE(start_date, current_period_start, created_at)
WHERE current_users IS NULL 
   OR current_storage_gb IS NULL 
   OR start_date IS NULL;
```

## 🔍 Compatibilidade com Código Existente

### Antes (código antigo)
```typescript
// Pode continuar funcionando
const { data } = await supabase
  .from('subscriptions')
  .select('*, plans(*)')
  .eq('user_id', userId)
  .single()
```

### Depois (código novo)
```typescript
// Usar a nova função RPC (recomendado)
const { data } = await supabase
  .rpc('get_user_active_subscription', { p_user_id: userId })
  .single()
```

Ambos funcionam! A função RPC é mais eficiente.

## 📝 Checklist de Migração

- [ ] Fazer backup das tabelas
- [ ] Executar migration `002_adapt_existing_plans.sql`
- [ ] Verificar planos atualizados
- [ ] Verificar colunas adicionadas
- [ ] Verificar funções RPC criadas
- [ ] Atualizar subscriptions existentes (se necessário)
- [ ] Testar função `get_user_active_subscription`
- [ ] Testar função `create_trial_subscription`
- [ ] Atualizar código para usar novas funções
- [ ] Testar fluxo completo

## 🆘 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

```sql
-- Restaurar tabelas do backup
DROP TABLE plans;
DROP TABLE subscriptions;

ALTER TABLE plans_backup RENAME TO plans;
ALTER TABLE subscriptions_backup RENAME TO subscriptions;

-- Recriar triggers e funções originais
-- (consulte backup do schema)
```

## ✅ Vantagens desta Abordagem

1. ✅ **Mantém dados existentes** - Nenhuma perda de dados
2. ✅ **Compatibilidade retroativa** - Código antigo continua funcionando
3. ✅ **Migração gradual** - Pode atualizar código aos poucos
4. ✅ **Sem downtime** - Sistema continua operando
5. ✅ **Reversível** - Pode fazer rollback se necessário

## 🎯 Próximos Passos

Após executar a migration:

1. **Atualizar código** para usar as novas funções RPC
2. **Configurar Stripe** e adicionar `stripe_price_id` nos planos
3. **Testar criação de trial**: 
   ```sql
   SELECT create_trial_subscription('user-id-aqui', 'profissional');
   ```
4. **Integrar componentes** React do novo sistema
5. **Testar fluxo completo** de checkout

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs do Supabase
2. Consulte o backup antes de fazer alterações
3. Teste em ambiente de desenvolvimento primeiro
4. Documente qualquer erro encontrado

---

**Importante**: Esta migration é **não-destrutiva** e **reversível**. Sempre faça backup antes de executar!
