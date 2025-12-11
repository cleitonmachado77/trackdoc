-- =====================================================
-- CORREÇÃO: CONTAGEM DE ARMAZENAMENTO CONSIDERANDO ENTIDADE
-- =====================================================
-- Esta migração atualiza a função get_user_storage_data para:
-- 1. Se o usuário pertence a uma entidade, mostrar dados da entidade inteira
-- 2. Se o usuário é solo (sem entidade), mostrar apenas seus próprios dados
-- =====================================================

-- Primeiro, adicionar coluna max_documents à tabela plans se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plans' AND column_name = 'max_documents'
  ) THEN
    ALTER TABLE plans ADD COLUMN max_documents INTEGER DEFAULT 1000;
    
    -- Atualizar valores padrão por plano
    UPDATE plans SET max_documents = 500 WHERE type = 'basico';
    UPDATE plans SET max_documents = 2000 WHERE type = 'profissional';
    UPDATE plans SET max_documents = 10000 WHERE type = 'enterprise';
  END IF;
END $$;

-- Remover função existente (necessário porque mudamos os parâmetros de retorno)
DROP FUNCTION IF EXISTS get_user_storage_data(UUID);

-- Criar função para calcular uso por usuário considerando entidade
CREATE OR REPLACE FUNCTION get_user_storage_data(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  documents_count INTEGER,
  storage_gb NUMERIC,
  plan_name TEXT,
  max_storage_gb NUMERIC,
  max_documents INTEGER,
  storage_percent INTEGER,
  documents_percent INTEGER,
  users_count INTEGER,
  max_users INTEGER,
  users_percent INTEGER,
  is_entity_data BOOLEAN
) AS $func$
DECLARE
  v_entity_id UUID;
  v_entity_role TEXT;
  v_docs_count INTEGER := 0;
  v_storage_gb NUMERIC := 0.0;
  v_users_count INTEGER := 1;
  v_plan_name TEXT := 'Sem plano';
  v_max_storage NUMERIC := 0.0;
  v_max_docs INTEGER := 0;
  v_max_users INTEGER := 1;
  v_is_entity_data BOOLEAN := FALSE;
BEGIN
  -- Verificar se o usuário pertence a uma entidade
  SELECT entity_id, entity_role
  INTO v_entity_id, v_entity_role
  FROM profiles
  WHERE id = p_user_id;
  
  -- Se o usuário pertence a uma entidade, calcular dados da entidade
  IF v_entity_id IS NOT NULL THEN
    v_is_entity_data := TRUE;
    
    -- Calcular documentos e armazenamento de TODA a entidade
    SELECT 
      COALESCE(COUNT(*), 0)::INTEGER,
      COALESCE(SUM(file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)
    INTO v_docs_count, v_storage_gb
    FROM documents d
    WHERE d.entity_id = v_entity_id
      AND (d.status IS NULL OR d.status != 'deleted');
    
    -- Contar usuários da entidade
    SELECT COUNT(*)::INTEGER
    INTO v_users_count
    FROM profiles p
    WHERE p.entity_id = v_entity_id
      AND p.status IN ('active', 'pending_confirmation');
    
    -- Buscar informações do plano via admin da entidade
    SELECT 
      COALESCE(pl.name, 'Sem plano'),
      COALESCE(pl.max_storage_gb, 0.0),
      COALESCE(pl.max_documents, 1000),
      COALESCE(pl.max_users, 1)
    INTO v_plan_name, v_max_storage, v_max_docs, v_max_users
    FROM profiles admin
    INNER JOIN subscriptions s ON s.user_id = admin.id
    INNER JOIN plans pl ON pl.id = s.plan_id
    WHERE admin.entity_id = v_entity_id
      AND admin.entity_role = 'admin'
      AND s.status = 'active'
    LIMIT 1;
    
    -- Se não encontrou via admin, buscar via entity_subscriptions
    IF v_plan_name = 'Sem plano' THEN
      SELECT 
        COALESCE(pl.name, 'Sem plano'),
        COALESCE(pl.max_storage_gb, 0.0),
        COALESCE(pl.max_documents, 1000),
        COALESCE(pl.max_users, 1)
      INTO v_plan_name, v_max_storage, v_max_docs, v_max_users
      FROM entity_subscriptions es
      INNER JOIN plans pl ON pl.id = es.plan_id
      WHERE es.entity_id = v_entity_id
        AND es.status = 'active'
      LIMIT 1;
    END IF;
    
    -- Se ainda não encontrou, buscar via subscriptions com entity_id
    IF v_plan_name = 'Sem plano' THEN
      SELECT 
        COALESCE(pl.name, 'Sem plano'),
        COALESCE(pl.max_storage_gb, 0.0),
        COALESCE(pl.max_documents, 1000),
        COALESCE(pl.max_users, 1)
      INTO v_plan_name, v_max_storage, v_max_docs, v_max_users
      FROM subscriptions s
      INNER JOIN plans pl ON pl.id = s.plan_id
      WHERE s.entity_id = v_entity_id
        AND s.status = 'active'
      LIMIT 1;
    END IF;
    
  ELSE
    -- Usuário solo (sem entidade) - calcular apenas seus próprios dados
    v_is_entity_data := FALSE;
    v_users_count := 1;
    v_max_users := 1;
    
    -- Calcular documentos e armazenamento do usuário individual
    SELECT 
      COALESCE(COUNT(*), 0)::INTEGER,
      COALESCE(SUM(file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)
    INTO v_docs_count, v_storage_gb
    FROM documents d
    WHERE d.created_by = p_user_id
      AND (d.status IS NULL OR d.status != 'deleted');
    
    -- Buscar informações do plano do usuário solo
    SELECT 
      COALESCE(pl.name, 'Sem plano'),
      COALESCE(pl.max_storage_gb, 0.0),
      COALESCE(pl.max_documents, 1000)
    INTO v_plan_name, v_max_storage, v_max_docs
    FROM subscriptions s
    INNER JOIN plans pl ON pl.id = s.plan_id
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
    LIMIT 1;
  END IF;
  
  RETURN QUERY
  SELECT 
    p_user_id,
    v_docs_count,
    v_storage_gb,
    v_plan_name,
    v_max_storage,
    v_max_docs,
    CASE 
      WHEN v_max_storage > 0 THEN LEAST(100, (v_storage_gb * 100 / v_max_storage)::INTEGER)
      ELSE 0 
    END as storage_percent,
    CASE 
      WHEN v_max_docs > 0 THEN LEAST(100, (v_docs_count * 100 / v_max_docs))
      ELSE 0 
    END as documents_percent,
    v_users_count,
    v_max_users,
    CASE 
      WHEN v_max_users > 0 THEN LEAST(100, (v_users_count * 100 / v_max_users))
      ELSE 0 
    END as users_percent,
    v_is_entity_data;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_user_storage_data(UUID) TO authenticated;

-- Verificar se a função foi atualizada
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_user_storage_data'
ORDER BY routine_name;

-- =====================================================
-- TESTE DA FUNÇÃO
-- =====================================================
-- Descomente para testar:
-- SELECT * FROM get_user_storage_data('SEU_USER_ID_AQUI');
-- 
-- Resultado esperado:
-- - Se usuário pertence a entidade: is_entity_data = true, 
--   dados refletem toda a entidade (docs, storage, users)
-- - Se usuário é solo: is_entity_data = false,
--   dados refletem apenas o próprio usuário
-- =====================================================
