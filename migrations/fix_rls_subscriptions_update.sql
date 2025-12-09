-- =====================================================
-- ADICIONAR POLÍTICAS DE UPDATE PARA SUBSCRIPTIONS
-- =====================================================
-- Permitir que admins atualizem subscriptions
-- =====================================================

-- Verificar políticas atuais
SELECT 
  '=== POLÍTICAS ATUAIS ===' as info;

SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
ORDER BY policyname;

-- =====================================================
-- CRIAR POLÍTICAS DE UPDATE
-- =====================================================

-- Política 1: Super Admins podem atualizar qualquer subscription
CREATE POLICY "super_admins_update_subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Política 2: Admins podem atualizar subscriptions da sua entidade
CREATE POLICY "admins_update_entity_subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
        AND (
          profiles.entity_id = subscriptions.entity_id
          OR profiles.role = 'super_admin'
        )
    )
  );

-- Política 3: Sistema pode atualizar (para triggers e funções)
CREATE POLICY "system_update_subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

SELECT 
  '=== POLÍTICAS APÓS CRIAÇÃO ===' as info;

SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
ORDER BY cmd, policyname;

-- =====================================================
-- TESTAR UPDATE
-- =====================================================

SELECT 
  '=== TESTE DE UPDATE ===' as info;

-- Ver estado atual da subscription do Pedro
SELECT 
  id,
  user_id,
  plan_name,
  status,
  next_billing_date,
  end_date,
  updated_at
FROM subscriptions
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- Tentar atualizar (teste)
UPDATE subscriptions
SET 
  next_billing_date = (CURRENT_DATE + INTERVAL '30 days')::timestamp with time zone,
  end_date = (CURRENT_DATE + INTERVAL '30 days')::timestamp with time zone,
  updated_at = NOW()
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79'
RETURNING 
  id,
  user_id,
  next_billing_date,
  end_date,
  updated_at;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar:
-- 1. Políticas de UPDATE criadas
-- 2. UPDATE executado com sucesso
-- 3. Datas atualizadas para +30 dias
-- =====================================================
