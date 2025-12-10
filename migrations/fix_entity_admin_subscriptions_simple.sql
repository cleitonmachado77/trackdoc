-- =====================================================
-- CORREÇÃO SIMPLES DAS ASSINATURAS DOS ADMINS DE ENTIDADE
-- =====================================================
-- Versão simplificada que pode ser executada sem erros
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR SUBSCRIPTIONS DOS ADMINS DE ENTIDADE
-- =====================================================

-- Vincular subscriptions existentes aos admins de entidade
UPDATE subscriptions 
SET entity_id = profiles.entity_id,
    updated_at = NOW()
FROM profiles
WHERE subscriptions.user_id = profiles.id
  AND profiles.entity_role = 'admin'
  AND profiles.entity_id IS NOT NULL
  AND subscriptions.entity_id IS NULL
  AND subscriptions.status IN ('active', 'trial');

-- =====================================================
-- 2. FUNÇÃO PARA VERIFICAR LIMITES DE USUÁRIOS
-- =====================================================

CREATE OR REPLACE FUNCTION check_entity_user_limit(p_entity_id UUID)
RETURNS TABLE (
  can_create_user BOOLEAN,
  current_users INTEGER,
  max_users INTEGER,
  remaining_users INTEGER,
  plan_type TEXT,
  admin_user_id UUID,
  subscription_id UUID
) AS $$
DECLARE
  admin_id UUID;
  sub_id UUID;
  current_count INTEGER;
  max_count INTEGER;
  plan_name TEXT;
  entity_current_users INTEGER;
BEGIN
  -- Buscar admin da entidade
  SELECT p.id INTO admin_id
  FROM profiles p
  WHERE p.entity_id = p_entity_id
    AND p.entity_role = 'admin'
    AND p.status IN ('active', 'pending_confirmation')
  LIMIT 1;
  
  -- Se não encontrou admin, retornar valores padrão
  IF admin_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 0, ''::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Tentar buscar subscription individual do admin
  SELECT s.id, s.current_users, pl.max_users, pl.type
  INTO sub_id, current_count, max_count, plan_name
  FROM subscriptions s
  INNER JOIN plans pl ON pl.id = s.plan_id
  WHERE s.user_id = admin_id
    AND s.status = 'active'
  LIMIT 1;
  
  -- Se não encontrou subscription individual, buscar entity_subscription
  IF sub_id IS NULL THEN
    SELECT es.id, 0, pl.max_users, pl.type
    INTO sub_id, current_count, max_count, plan_name
    FROM entity_subscriptions es
    INNER JOIN plans pl ON pl.id = es.plan_id
    WHERE es.entity_id = p_entity_id
      AND es.status = 'active'
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrou, retornar valores padrão
  IF sub_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 0, ''::TEXT, admin_id, NULL::UUID;
    RETURN;
  END IF;
  
  -- Contar usuários reais da entidade se current_count for 0 ou nulo
  IF current_count IS NULL OR current_count = 0 THEN
    SELECT COUNT(*) INTO entity_current_users
    FROM profiles
    WHERE entity_id = p_entity_id
      AND status IN ('active', 'pending_confirmation')
      AND deleted_at IS NULL;
    current_count := entity_current_users;
  END IF;
  
  -- Garantir que max_count não seja nulo
  IF max_count IS NULL THEN
    max_count := 5; -- Valor padrão
  END IF;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    (current_count < max_count) as can_create_user,
    current_count,
    max_count,
    GREATEST(0, max_count - current_count) as remaining_users,
    COALESCE(plan_name, 'unknown') as plan_type,
    admin_id,
    sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION check_entity_user_limit(UUID) TO authenticated;

-- =====================================================
-- 4. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION check_entity_user_limit IS 'Verifica se uma entidade pode criar mais usuários baseado no plano do admin';

-- =====================================================
-- 5. TESTE DA FUNÇÃO
-- =====================================================

-- Testar a função com uma entidade existente (descomente para testar)
-- SELECT * FROM check_entity_user_limit('uuid-de-uma-entidade-existente');