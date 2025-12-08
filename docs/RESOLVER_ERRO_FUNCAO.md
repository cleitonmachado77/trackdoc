# 🔧 Resolver Erro: "cannot change return type of existing function"

## ❌ Erro Encontrado

```
ERROR: 42P13: cannot change return type of existing function
HINT: Use DROP FUNCTION get_user_active_subscription(uuid) first.
```

## 🎯 Causa

Você já tem uma função `get_user_active_subscription` no banco com um tipo de retorno diferente do que estamos tentando criar.

## ✅ Solução

### Opção 1: Usar Migration Segura (Recomendado)

Use a migration que já faz o DROP automaticamente:

```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: migrations/002_adapt_existing_plans_safe.sql
```

Esta versão:
- ✅ Remove funções antigas automaticamente
- ✅ Cria novas funções
- ✅ Pode ser executada múltiplas vezes
- ✅ Não causa erro se função não existir

### Opção 2: Remover Função Manualmente

Se preferir, remova a função antiga primeiro:

```sql
-- 1. Remover funções antigas
DROP FUNCTION IF EXISTS get_user_active_subscription(UUID);
DROP FUNCTION IF EXISTS create_trial_subscription(UUID, VARCHAR);
DROP FUNCTION IF EXISTS create_trial_subscription(UUID);

-- 2. Agora execute a migration
-- migrations/002_adapt_existing_plans.sql
```

### Opção 3: Script Completo de Limpeza

Se ainda tiver problemas, execute este script de limpeza:

```sql
-- ============================================================================
-- SCRIPT DE LIMPEZA - Execute ANTES da migration
-- ============================================================================

-- Remover todas as versões da função get_user_active_subscription
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure 
        FROM pg_proc 
        WHERE proname = 'get_user_active_subscription'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Removida: %', r.oid::regprocedure;
    END LOOP;
END $$;

-- Remover todas as versões da função create_trial_subscription
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure 
        FROM pg_proc 
        WHERE proname = 'create_trial_subscription'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Removida: %', r.oid::regprocedure;
    END LOOP;
END $$;

-- Verificar se foram removidas
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('get_user_active_subscription', 'create_trial_subscription');

-- Se retornar vazio, está tudo limpo!
```

## 🔍 Verificar Funções Existentes

Para ver quais funções você tem:

```sql
-- Ver todas as funções relacionadas a subscription
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname LIKE '%subscription%'
ORDER BY proname;
```

## 📋 Passo a Passo Completo

### 1. Fazer Backup
```sql
CREATE TABLE plans_backup AS SELECT * FROM plans;
CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;
```

### 2. Limpar Funções Antigas
```sql
-- Copie e cole o "Script Completo de Limpeza" acima
```

### 3. Executar Migration Segura
```sql
-- Cole o conteúdo de: migrations/002_adapt_existing_plans_safe.sql
```

### 4. Verificar
```sql
-- Ver planos atualizados
SELECT id, name, type, price_monthly FROM plans ORDER BY price_monthly;

-- Testar função
SELECT * FROM get_user_active_subscription('user-id-aqui');

-- Ver funções criadas
SELECT proname FROM pg_proc WHERE proname LIKE '%subscription%';
```

## ⚠️ Notas Importantes

### Por Que Isso Acontece?

Quando você tenta criar uma função com `CREATE OR REPLACE FUNCTION`, o PostgreSQL permite apenas se:
- A função não existir (cria nova)
- A função existir com **exatamente** os mesmos parâmetros e tipo de retorno (substitui)

Se o tipo de retorno for diferente, você **deve** fazer DROP primeiro.

### É Seguro Fazer DROP?

✅ **Sim**, se:
- Você fez backup
- Não tem código em produção usando a função antiga
- Está em ambiente de desenvolvimento

⚠️ **Cuidado** se:
- Está em produção
- Tem código dependendo da função antiga
- Não fez backup

### Alternativa Sem DROP

Se não quiser fazer DROP, pode criar com nome diferente:

```sql
-- Criar com nome novo
CREATE FUNCTION get_user_active_subscription_v2(p_user_id UUID)
RETURNS TABLE (...) AS $$
...
$$ LANGUAGE plpgsql;

-- Depois, quando testar e confirmar que funciona:
DROP FUNCTION get_user_active_subscription(UUID);
ALTER FUNCTION get_user_active_subscription_v2 RENAME TO get_user_active_subscription;
```

## 🎯 Recomendação Final

**Use a migration segura**: `migrations/002_adapt_existing_plans_safe.sql`

Ela já faz tudo automaticamente:
1. Remove funções antigas
2. Cria novas funções
3. Atualiza tabelas
4. Configura RLS
5. Verifica resultado

## 🆘 Ainda Com Problemas?

Se o erro persistir:

1. **Copie a mensagem de erro completa**
2. **Execute**:
```sql
SELECT 
    proname,
    pg_get_function_identity_arguments(oid) as args,
    pg_get_function_result(oid) as result
FROM pg_proc 
WHERE proname = 'get_user_active_subscription';
```
3. **Compartilhe o resultado** para análise

---

**Resumo**: Use `migrations/002_adapt_existing_plans_safe.sql` - ela resolve tudo automaticamente! ✅
