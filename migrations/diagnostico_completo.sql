-- =====================================================
-- DIAGNÓSTICO COMPLETO - Verificar Estado Atual
-- =====================================================
-- Execute este SQL PRIMEIRO para entender o estado atual
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA SUBSCRIPTIONS
SELECT 
  '=== ESTRUTURA DA TABELA SUBSCRIPTIONS ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR PLANOS DISPONÍVEIS
SELECT 
  '=== PLANOS DISPONÍVEIS ===' as info;

SELECT 
  id,
  name,
  type,
  interval,
  price_monthly,
  max_users,
  max_storage_gb,
  is_active
FROM plans
ORDER BY 
  CASE type
    WHEN 'basico' THEN 1
    WHEN 'profissional' THEN 2
    WHEN 'enterprise' THEN 3
    ELSE 4
  END;

-- 3. VERIFICAR USUÁRIO PEDRO
SELECT 
  '=== DADOS DO PEDRO ===' as info;

SELECT 
  id,
  full_name,
  email,
  status,
  entity_id,
  created_at
FROM profiles
WHERE id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- 4. VERIFICAR SE PEDRO JÁ TEM SUBSCRIPTION
SELECT 
  '=== SUBSCRIPTION DO PEDRO (se existir) ===' as info;

SELECT 
  s.id,
  s.user_id,
  s.plan_id,
  s.plan_name,
  s.plan_price,
  s.status,
  s.current_users,
  s.current_storage_gb,
  s.start_date,
  p.name as plan_name_from_plans,
  p.type as plan_type
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- 5. VERIFICAR TODOS OS USUÁRIOS E SUAS SUBSCRIPTIONS
SELECT 
  '=== TODOS OS USUÁRIOS E SUBSCRIPTIONS ===' as info;

SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.status as user_status,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_name,
  s.plan_price,
  pl.name as plan_name_from_plans,
  pl.type as plan_type
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
LEFT JOIN plans pl ON pl.id = s.plan_id
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. VERIFICAR TRIGGERS EXISTENTES
SELECT 
  '=== TRIGGERS NA TABELA PROFILES ===' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- 7. VERIFICAR SE TRIGGER AUTO_CREATE_SUBSCRIPTION EXISTE
SELECT 
  '=== TRIGGER AUTO_CREATE_SUBSCRIPTION ===' as info;

SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_subscription';

-- 8. VERIFICAR FUNÇÃO AUTO_CREATE_SUBSCRIPTION
SELECT 
  '=== FUNÇÃO AUTO_CREATE_SUBSCRIPTION ===' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'auto_create_subscription'
  AND routine_schema = 'public';

-- =====================================================
-- RESUMO DO QUE VERIFICAR
-- =====================================================
-- 
-- ✅ Tabela subscriptions tem os campos:
--    - plan_name (TEXT NOT NULL)
--    - plan_price (NUMERIC NOT NULL)
--    - plan_id (UUID)
--    - user_id (UUID)
--    - status (TEXT)
--    - current_users (INTEGER)
--    - current_storage_gb (NUMERIC)
--
-- ✅ Planos disponíveis:
--    - Básico (type='basico', 15 users, 10GB)
--    - Profissional (type='profissional', 50 users, 50GB)
--    - Enterprise (type='enterprise', 70 users, 120GB)
--
-- ✅ Pedro existe e não tem subscription
--
-- ✅ Trigger auto_create_subscription não existe ainda
--
-- =====================================================
