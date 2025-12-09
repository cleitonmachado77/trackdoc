-- =====================================================
-- CRIAR SUBSCRIPTION PARA USUÁRIO EXISTENTE
-- =====================================================
-- Este script cria uma subscription para o usuário Pedro
-- e pode ser adaptado para outros usuários
-- =====================================================

-- 1. Verificar se o usuário existe
SELECT id, full_name, email FROM profiles WHERE email = 'diariosolovorex@gmail.com';

-- 2. Buscar o plano Básico (ou outro plano desejado)
SELECT id, name, type FROM plans WHERE type = 'basico' AND interval = 'monthly';

-- 3. Criar subscription para o usuário
-- IMPORTANTE: Substitua os UUIDs pelos valores reais retornados acima

INSERT INTO subscriptions (
  user_id,
  plan_id,
  status,
  start_date,
  current_users,
  current_storage_gb,
  created_at,
  updated_at
)
SELECT 
  'f7f5b07d-ef74-4808-9855-9b7ecf03fa79'::uuid as user_id,  -- ID do Pedro
  p.id as plan_id,
  'active' as status,
  NOW() as start_date,
  1 as current_users,  -- Começar com 1 usuário (ele mesmo)
  0 as current_storage_gb,
  NOW() as created_at,
  NOW() as updated_at
FROM plans p
WHERE p.type = 'basico' AND p.interval = 'monthly'
LIMIT 1;

-- 4. Verificar se a subscription foi criada
SELECT 
  s.id,
  s.user_id,
  s.status,
  s.current_users,
  s.current_storage_gb,
  p.name as plan_name,
  p.type as plan_type
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deve retornar 1 linha com:
-- - status: active
-- - current_users: 1
-- - current_storage_gb: 0
-- - plan_name: Básico
-- - plan_type: basico
-- =====================================================
