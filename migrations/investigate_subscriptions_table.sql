-- =====================================================
-- INVESTIGAR ESTRUTURA DA TABELA SUBSCRIPTIONS
-- =====================================================

-- 1. Ver TODOS os campos da tabela subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver constraints (NOT NULL, etc)
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'subscriptions'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Ver um exemplo de subscription existente (se houver)
SELECT * FROM subscriptions LIMIT 1;

-- 4. Ver os planos disponíveis
SELECT id, name, type, interval, is_active FROM plans;
