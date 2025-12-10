-- =====================================================
-- CORREÇÃO DOS CONTADORES DE USO NO PAINEL SUPER-ADMIN
-- =====================================================
-- Esta migração corrige a contagem de documentos e 
-- armazenamento no painel super-admin e implementa
-- verificação de limites de planos
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO PARA CALCULAR USO REAL DE ARMAZENAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  documents_count INTEGER,
  storage_used_gb NUMERIC,
  last_document_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_user_id as user_id,
    COALESCE(COUNT(d.id)::INTEGER, 0) as documents_count,
    COALESCE(SUM(d.file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)::NUMERIC as storage_used_gb,
    MAX(d.created_at) as last_document_date
  FROM documents d
  WHERE d.created_by = p_user_id
    AND d.status != 'deleted'
  GROUP BY p_user_id;
  
  -- Se não há documentos, retornar zeros
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p_user_id as user_id,
      0 as documents_count,
      0.0::NUMERIC as storage_used_gb,
      NULL::TIMESTAMP WITH TIME ZONE as last_document_date;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FUNÇÃO PARA VERIFICAR LIMITES DE PLANO
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_plan_limits(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  plan_name VARCHAR(255),
  plan_type VARCHAR(50),
  -- Limites do plano
  max_users INTEGER,
  max_storage_gb NUMERIC,
  max_documents INTEGER,
  -- Uso atual
  current_users INTEGER,
  current_storage_gb NUMERIC,
  current_documents INTEGER,
  -- Status dos limites
  users_limit_reached BOOLEAN,
  storage_limit_reached BOOLEAN,
  documents_limit_reached BOOLEAN,
  -- Percentuais de uso
  users_usage_percent INTEGER,
  storage_usage_percent INTEGER,
  documents_usage_percent INTEGER
) AS $$
DECLARE
  v_subscription_id UUID;
  v_plan_id UUID;
  v_entity_id UUID;
BEGIN
  -- Buscar subscription do usuário
  SELECT s.id, s.plan_id, p.entity_id
  INTO v_subscription_id, v_plan_id, v_entity_id
  FROM subscriptions s
  INNER JOIN profiles p ON p.id = s.user_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  LIMIT 1;
  
  -- Se não encontrou subscription individual, buscar por entidade
  IF v_subscription_id IS NULL AND v_entity_id IS NOT NULL THEN
    SELECT s.id, s.plan_id
    INTO v_subscription_id, v_plan_id
    FROM subscriptions s
    WHERE s.entity_id = v_entity_id
      AND s.status = 'active'
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrou, retornar valores padrão
  IF v_subscription_id IS NULL THEN
    RETURN QUERY
    SELECT 
      p_user_id,
      'Sem plano'::VARCHAR(255),
      'none'::VARCHAR(50),
      0, 0.0::NUMERIC, 0,
      0, 0.0::NUMERIC, 0,
      false, false, false,
      0, 0, 0;
    RETURN;
  END IF;
  
  -- Retornar dados completos
  RETURN QUERY
  WITH plan_data AS (
    SELECT 
      pl.name as plan_name,
      pl.type as plan_type,
      pl.max_users,
      pl.max_storage_gb,
      pl.max_documents
    FROM plans pl
    WHERE pl.id = v_plan_id
  ),
  usage_data AS (
    SELECT 
      s.current_users,
      s.current_storage_gb,
      COALESCE(doc_count.documents_count, 0) as current_documents
    FROM subscriptions s
    LEFT JOIN (
      SELECT 
        created_by,
        COUNT(*) as documents_count
      FROM documents 
      WHERE created_by = p_user_id 
        AND status != 'deleted'
      GROUP BY created_by
    ) doc_count ON doc_count.created_by = p_user_id
    WHERE s.id = v_subscription_id
  )
  SELECT 
    p_user_id,
    pd.plan_name,
    pd.plan_type,
    pd.max_users,
    pd.max_storage_gb,
    pd.max_documents,
    ud.current_users,
    ud.current_storage_gb,
    ud.current_documents,
    -- Status dos limites
    (ud.current_users >= pd.max_users) as users_limit_reached,
    (ud.current_storage_gb >= pd.max_storage_gb) as storage_limit_reached,
    (ud.current_documents >= pd.max_documents) as documents_limit_reached,
    -- Percentuais
    CASE 
      WHEN pd.max_users > 0 THEN LEAST(100, (ud.current_users * 100 / pd.max_users))
      ELSE 0 
    END as users_usage_percent,
    CASE 
      WHEN pd.max_storage_gb > 0 THEN LEAST(100, (ud.current_storage_gb * 100 / pd.max_storage_gb)::INTEGER)
      ELSE 0 
    END as storage_usage_percent,
    CASE 
      WHEN pd.max_documents > 0 THEN LEAST(100, (ud.current_documents * 100 / pd.max_documents))
      ELSE 0 
    END as documents_usage_percent
  FROM plan_data pd, usage_data ud;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FUNÇÃO PARA ATUALIZAR CONTADORES AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_subscription_counters(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_documents_count INTEGER;
  v_storage_gb NUMERIC;
  v_subscription_id UUID;
BEGIN
  -- Calcular uso real
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)
  INTO v_documents_count, v_storage_gb
  FROM documents
  WHERE created_by = p_user_id
    AND status != 'deleted';
  
  -- Buscar subscription
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;
  
  -- Atualizar se encontrou subscription
  IF v_subscription_id IS NOT NULL THEN
    UPDATE subscriptions
    SET 
      current_storage_gb = v_storage_gb,
      updated_at = NOW()
    WHERE id = v_subscription_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNÇÃO PARA VERIFICAR SE UPLOAD É PERMITIDO
-- =====================================================

CREATE OR REPLACE FUNCTION can_upload_file(
  p_user_id UUID,
  p_file_size_bytes BIGINT
)
RETURNS TABLE (
  can_upload BOOLEAN,
  reason TEXT,
  current_storage_gb NUMERIC,
  max_storage_gb NUMERIC,
  available_gb NUMERIC,
  current_documents INTEGER,
  max_documents INTEGER
) AS $$
DECLARE
  v_limits RECORD;
  v_file_size_gb NUMERIC;
  v_new_total_gb NUMERIC;
BEGIN
  -- Converter tamanho do arquivo para GB
  v_file_size_gb := p_file_size_bytes / (1024.0 * 1024.0 * 1024.0);
  
  -- Buscar limites do usuário
  SELECT * INTO v_limits
  FROM check_user_plan_limits(p_user_id)
  LIMIT 1;
  
  -- Se não tem plano, bloquear
  IF v_limits.plan_type = 'none' THEN
    RETURN QUERY
    SELECT 
      false,
      'Usuário sem plano ativo',
      0.0::NUMERIC,
      0.0::NUMERIC,
      0.0::NUMERIC,
      0,
      0;
    RETURN;
  END IF;
  
  -- Calcular novo total de armazenamento
  v_new_total_gb := v_limits.current_storage_gb + v_file_size_gb;
  
  -- Verificar limite de documentos
  IF v_limits.current_documents >= v_limits.max_documents THEN
    RETURN QUERY
    SELECT 
      false,
      'Limite de documentos atingido',
      v_limits.current_storage_gb,
      v_limits.max_storage_gb,
      GREATEST(0, v_limits.max_storage_gb - v_limits.current_storage_gb),
      v_limits.current_documents,
      v_limits.max_documents;
    RETURN;
  END IF;
  
  -- Verificar limite de armazenamento
  IF v_new_total_gb > v_limits.max_storage_gb THEN
    RETURN QUERY
    SELECT 
      false,
      'Limite de armazenamento seria excedido',
      v_limits.current_storage_gb,
      v_limits.max_storage_gb,
      GREATEST(0, v_limits.max_storage_gb - v_limits.current_storage_gb),
      v_limits.current_documents,
      v_limits.max_documents;
    RETURN;
  END IF;
  
  -- Upload permitido
  RETURN QUERY
  SELECT 
    true,
    'Upload permitido',
    v_limits.current_storage_gb,
    v_limits.max_storage_gb,
    GREATEST(0, v_limits.max_storage_gb - v_limits.current_storage_gb),
    v_limits.current_documents,
    v_limits.max_documents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGER PARA ATUALIZAR CONTADORES AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_storage_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar contadores quando documento é inserido
  IF TG_OP = 'INSERT' THEN
    PERFORM update_subscription_counters(NEW.created_by);
    RETURN NEW;
  END IF;
  
  -- Atualizar contadores quando documento é atualizado
  IF TG_OP = 'UPDATE' THEN
    -- Se mudou o tamanho do arquivo ou status
    IF OLD.file_size != NEW.file_size OR OLD.status != NEW.status THEN
      PERFORM update_subscription_counters(NEW.created_by);
    END IF;
    RETURN NEW;
  END IF;
  
  -- Atualizar contadores quando documento é deletado
  IF TG_OP = 'DELETE' THEN
    PERFORM update_subscription_counters(OLD.created_by);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_storage_counters ON documents;
CREATE TRIGGER trigger_update_storage_counters
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_storage_counters();

-- =====================================================
-- 6. ATUALIZAR CONTADORES EXISTENTES
-- =====================================================

-- Atualizar todos os contadores baseado nos dados reais
UPDATE subscriptions 
SET current_storage_gb = COALESCE(doc_stats.storage_gb, 0),
    updated_at = NOW()
FROM (
  SELECT 
    d.created_by as user_id,
    SUM(d.file_size) / (1024.0 * 1024.0 * 1024.0) as storage_gb
  FROM documents d
  WHERE d.status != 'deleted'
    AND d.created_by IS NOT NULL
  GROUP BY d.created_by
) doc_stats
WHERE subscriptions.user_id = doc_stats.user_id
  AND subscriptions.status = 'active';

-- =====================================================
-- 7. PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION calculate_user_storage_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_plan_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_subscription_counters(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_upload_file(UUID, BIGINT) TO authenticated;

-- =====================================================
-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION calculate_user_storage_usage IS 'Calcula uso real de armazenamento e documentos por usuário';
COMMENT ON FUNCTION check_user_plan_limits IS 'Verifica limites do plano e status de uso atual';
COMMENT ON FUNCTION update_subscription_counters IS 'Atualiza contadores de uso baseado nos dados reais';
COMMENT ON FUNCTION can_upload_file IS 'Verifica se um upload de arquivo é permitido baseado nos limites';

-- =====================================================
-- 9. VERIFICAÇÃO
-- =====================================================

-- Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_user_storage_usage',
    'check_user_plan_limits',
    'update_subscription_counters',
    'can_upload_file'
  )
ORDER BY routine_name;

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_storage_counters';

-- =====================================================
-- 10. TESTE DAS FUNÇÕES (OPCIONAL)
-- =====================================================

-- Descomente para testar com um usuário específico:
-- SELECT * FROM calculate_user_storage_usage('uuid-do-usuario');
-- SELECT * FROM check_user_plan_limits('uuid-do-usuario');
-- SELECT * FROM can_upload_file('uuid-do-usuario', 1048576); -- 1MB