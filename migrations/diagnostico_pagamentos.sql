-- =====================================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA DE PAGAMENTOS
-- =====================================================
-- Execute este SQL para verificar o estado atual
-- =====================================================

-- 1. VERIFICAR POLÍTICAS RLS ATUAIS
SELECT 
  '=== 1. POLÍTICAS RLS DA TABELA SUBSCRIPTIONS ===' as info;

SELECT 
  policyname as "Política",
  cmd as "Comando",
  permissive as "Permissiva",
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Leitura'
    WHEN cmd = 'UPDATE' THEN '🔧 Atualização'
    WHEN cmd = 'INSERT' THEN '➕ Inserção'
    WHEN cmd = 'DELETE' THEN '🗑️ Exclusão'
    ELSE cmd
  END as "Tipo"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
ORDER BY cmd, policyname;

-- 2. VERIFICAR ESTRUTURA DA TABELA SUBSCRIPTIONS
SELECT 
  '=== 2. CAMPOS DA TABELA SUBSCRIPTIONS ===' as info;

SELECT 
  column_name as "Campo",
  data_type as "Tipo",
  is_nullable as "Nulo?",
  column_default as "Padrão"
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND table_schema = 'public'
  AND column_name IN ('next_billing_date', 'end_date', 'status', 'updated_at')
ORDER BY ordinal_position;

-- 3. VERIFICAR SUBSCRIPTION DO PEDRO
SELECT 
  '=== 3. SUBSCRIPTION DO PEDRO (ANTES) ===' as info;

SELECT 
  id,
  user_id,
  plan_name,
  plan_price,
  status,
  start_date,
  end_date,
  next_billing_date,
  CASE 
    WHEN next_billing_date IS NULL THEN '❌ SEM DATA'
    WHEN next_billing_date < CURRENT_TIMESTAMP THEN '🔴 VENCIDO'
    WHEN next_billing_date < CURRENT_TIMESTAMP + INTERVAL '7 days' THEN '🟡 PENDENTE'
    ELSE '🟢 OK'
  END as "Status Pagamento",
  CASE 
    WHEN next_billing_date IS NULL THEN 0
    ELSE EXTRACT(DAY FROM (next_billing_date - CURRENT_TIMESTAMP))::integer
  END as "Dias Restantes",
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- 4. VERIFICAR TABELA DE PAGAMENTOS
SELECT 
  '=== 4. HISTÓRICO DE PAGAMENTOS ===' as info;

SELECT 
  id,
  subscription_id,
  amount as "Valor",
  payment_date as "Data Pagamento",
  status,
  payment_method as "Método",
  created_at
FROM subscription_payments
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79'
ORDER BY created_at DESC
LIMIT 5;

-- 5. VERIFICAR PERFIL DO USUÁRIO LOGADO
SELECT 
  '=== 5. PERFIL DO USUÁRIO ATUAL ===' as info;

SELECT 
  id,
  full_name as "Nome",
  email,
  role as "Papel",
  CASE 
    WHEN role = 'super_admin' THEN '✅ Pode atualizar subscriptions'
    WHEN role = 'admin' THEN '⚠️ Pode atualizar da sua entidade'
    ELSE '❌ Não pode atualizar'
  END as "Permissão UPDATE"
FROM profiles
WHERE id = auth.uid();

-- 6. TESTE DE UPDATE (SIMULAÇÃO)
SELECT 
  '=== 6. TESTE DE UPDATE (SIMULAÇÃO) ===' as info;

-- Calcular nova data (30 dias a partir de hoje)
SELECT 
  CURRENT_DATE as "Data Atual",
  (CURRENT_DATE + INTERVAL '30 days')::date as "Nova Data Vencimento",
  EXTRACT(DAY FROM INTERVAL '30 days') as "Dias Adicionados";

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- 
-- 1. POLÍTICAS RLS:
--    ✅ Deve ter políticas de SELECT
--    ✅ Deve ter políticas de UPDATE (após correção)
--
-- 2. CAMPOS:
--    ✅ next_billing_date existe
--    ✅ end_date existe
--    ✅ status existe
--    ✅ updated_at existe
--
-- 3. SUBSCRIPTION:
--    - Mostra dados atuais do Pedro
--    - Status do pagamento
--    - Dias restantes
--
-- 4. PAGAMENTOS:
--    - Lista pagamentos registrados
--    - Pode ter duplicatas (bug anterior)
--
-- 5. PERFIL:
--    - Mostra se usuário pode fazer UPDATE
--    - Super Admin = ✅
--
-- 6. TESTE:
--    - Mostra cálculo de nova data
--
-- =====================================================

-- =====================================================
-- PRÓXIMOS PASSOS
-- =====================================================
--
-- SE NÃO HOUVER POLÍTICAS DE UPDATE:
-- 1. Execute: migrations/fix_rls_subscriptions_update.sql
--
-- SE HOUVER POLÍTICAS DE UPDATE:
-- 1. Teste no frontend
-- 2. Clique em "Lançar Pagamento"
-- 3. Verifique se atualiza
--
-- =====================================================
