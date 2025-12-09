-- =====================================================
-- CORRIGIR PERMISSÕES RLS (Row Level Security)
-- =====================================================
-- Garantir que usuários possam ler suas próprias subscriptions
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
  '=== STATUS DO RLS ===' as info;

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'plans');

-- =====================================================
-- HABILITAR RLS SE NECESSÁRIO
-- =====================================================

-- Habilitar RLS na tabela subscriptions (se não estiver)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela plans (se não estiver)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVER POLÍTICAS ANTIGAS
-- =====================================================

DROP POLICY IF EXISTS "Usuários podem ver suas próprias subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Usuários podem ver seus planos" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their subscription" ON subscriptions;
DROP POLICY IF EXISTS "Todos podem ver planos" ON plans;
DROP POLICY IF EXISTS "Everyone can view plans" ON plans;
DROP POLICY IF EXISTS "Public plans are viewable by everyone" ON plans;

-- =====================================================
-- CRIAR POLÍTICAS DE ACESSO
-- =====================================================

-- Política 1: Usuários podem ver suas próprias subscriptions
CREATE POLICY "users_view_own_subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR 
    auth.uid() IN (
      SELECT id FROM profiles WHERE entity_id = subscriptions.entity_id
    )
  );

-- Política 2: Todos podem ver planos ativos (necessário para escolher plano)
CREATE POLICY "everyone_view_active_plans"
  ON plans
  FOR SELECT
  USING (is_active = true);

-- Política 3: Admins podem ver todas as subscriptions
CREATE POLICY "admins_view_all_subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

SELECT 
  '=== POLÍTICAS CRIADAS ===' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'plans')
ORDER BY tablename, policyname;

-- =====================================================
-- TESTAR ACESSO
-- =====================================================

SELECT 
  '=== TESTE DE ACESSO ===' as info;

-- Verificar se a subscription do Pedro está acessível
SELECT 
  id,
  user_id,
  plan_name,
  status
FROM subscriptions
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- Verificar se os planos estão acessíveis
SELECT 
  id,
  name,
  type,
  is_active
FROM plans
WHERE is_active = true;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar:
-- 1. RLS habilitado em ambas as tabelas
-- 2. 3 políticas criadas
-- 3. Subscription do Pedro visível
-- 4. Planos ativos visíveis
-- =====================================================
