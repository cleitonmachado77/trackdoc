-- =====================================================
-- FUNÇÕES PARA ATUALIZAÇÃO DE CONTADORES
-- =====================================================
-- Funções RPC para atualizar automaticamente os
-- contadores de uso (usuários e armazenamento)
-- =====================================================

-- =====================================================
-- 1. INCREMENTAR CONTADOR DE USUÁRIOS
-- =====================================================
-- Chamada quando um novo usuário é criado na entidade
-- Funciona com entity_id OU user_id
-- =====================================================

CREATE OR REPLACE FUNCTION increment_user_count(p_entity_id UUID DEFAULT NULL, p_user_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Atualizar por entity_id (se fornecido)
  IF p_entity_id IS NOT NULL THEN
    UPDATE subscriptions
    SET 
      current_users = current_users + 1,
      updated_at = NOW()
    WHERE entity_id = p_entity_id
      AND status = 'active';
      
    RAISE NOTICE 'Incrementado contador de usuários para entidade %', p_entity_id;
  
  -- Atualizar por user_id (se fornecido)
  ELSIF p_user_id IS NOT NULL THEN
    UPDATE subscriptions
    SET 
      current_users = current_users + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND status = 'active';
      
    RAISE NOTICE 'Incrementado contador de usuários para usuário %', p_user_id;
  ELSE
    RAISE EXCEPTION 'É necessário fornecer entity_id ou user_id';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. DECREMENTAR CONTADOR DE USUÁRIOS
-- =====================================================
-- Chamada quando um usuário é removido da entidade
-- Garante que o valor não fique negativo
-- Funciona com entity_id OU user_id
-- =====================================================

CREATE OR REPLACE FUNCTION decrement_user_count(p_entity_id UUID DEFAULT NULL, p_user_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Atualizar por entity_id (se fornecido)
  IF p_entity_id IS NOT NULL THEN
    UPDATE subscriptions
    SET 
      current_users = GREATEST(0, current_users - 1),
      updated_at = NOW()
    WHERE entity_id = p_entity_id
      AND status = 'active';
      
    RAISE NOTICE 'Decrementado contador de usuários para entidade %', p_entity_id;
  
  -- Atualizar por user_id (se fornecido)
  ELSIF p_user_id IS NOT NULL THEN
    UPDATE subscriptions
    SET 
      current_users = GREATEST(0, current_users - 1),
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND status = 'active';
      
    RAISE NOTICE 'Decrementado contador de usuários para usuário %', p_user_id;
  ELSE
    RAISE EXCEPTION 'É necessário fornecer entity_id ou user_id';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. ADICIONAR ARMAZENAMENTO USADO
-- =====================================================
-- Chamada após upload bem-sucedido de arquivo
-- Recebe tamanho em GB
-- =====================================================

CREATE OR REPLACE FUNCTION add_storage_usage(
  p_user_id UUID,
  p_size_gb NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    current_storage_gb = current_storage_gb + p_size_gb,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active';
    
  -- Log da operação (opcional)
  RAISE NOTICE 'Adicionado % GB de armazenamento para usuário %', p_size_gb, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. REMOVER ARMAZENAMENTO USADO
-- =====================================================
-- Chamada após exclusão de arquivo
-- Garante que o valor não fique negativo
-- =====================================================

CREATE OR REPLACE FUNCTION remove_storage_usage(
  p_user_id UUID,
  p_size_gb NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    current_storage_gb = GREATEST(0, current_storage_gb - p_size_gb),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active';
    
  -- Log da operação (opcional)
  RAISE NOTICE 'Removido % GB de armazenamento para usuário %', p_size_gb, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. RECALCULAR ARMAZENAMENTO TOTAL (UTILITÁRIO)
-- =====================================================
-- Função para recalcular o armazenamento total baseado
-- nos documentos existentes (útil para correções)
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_storage_usage(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_gb NUMERIC;
BEGIN
  -- Calcular total de armazenamento dos documentos do usuário
  SELECT COALESCE(SUM(size_bytes) / (1024.0 * 1024.0 * 1024.0), 0)
  INTO v_total_gb
  FROM documents
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;
  
  -- Atualizar subscription
  UPDATE subscriptions
  SET 
    current_storage_gb = v_total_gb,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active';
  
  RETURN v_total_gb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RECALCULAR USUÁRIOS TOTAIS (UTILITÁRIO)
-- =====================================================
-- Função para recalcular o total de usuários baseado
-- nos profiles existentes (útil para correções)
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_user_count(p_entity_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_users INTEGER;
BEGIN
  -- Contar usuários ativos da entidade
  SELECT COUNT(*)
  INTO v_total_users
  FROM profiles
  WHERE entity_id = p_entity_id
    AND deleted_at IS NULL;
  
  -- Atualizar subscription
  UPDATE subscriptions
  SET 
    current_users = v_total_users,
    updated_at = NOW()
  WHERE entity_id = p_entity_id
    AND status = 'active';
  
  RETURN v_total_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTES DAS FUNÇÕES
-- =====================================================

-- Teste 1: Incrementar usuários (por entity_id)
-- SELECT increment_user_count(p_entity_id := 'uuid-da-entidade');

-- Teste 1b: Incrementar usuários (por user_id)
-- SELECT increment_user_count(p_user_id := 'uuid-do-usuario');

-- Teste 2: Decrementar usuários (por entity_id)
-- SELECT decrement_user_count(p_entity_id := 'uuid-da-entidade');

-- Teste 2b: Decrementar usuários (por user_id)
-- SELECT decrement_user_count(p_user_id := 'uuid-do-usuario');

-- Teste 3: Adicionar armazenamento (1.5 GB)
-- SELECT add_storage_usage('uuid-do-usuario', 1.5);

-- Teste 4: Remover armazenamento (0.5 GB)
-- SELECT remove_storage_usage('uuid-do-usuario', 0.5);

-- Teste 5: Recalcular armazenamento
-- SELECT recalculate_storage_usage('uuid-do-usuario');

-- Teste 6: Recalcular usuários
-- SELECT recalculate_user_count('uuid-da-entidade');

-- =====================================================
-- PERMISSÕES
-- =====================================================
-- Garantir que as funções podem ser chamadas via RPC

GRANT EXECUTE ON FUNCTION increment_user_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_storage_usage(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_storage_usage(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_storage_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_user_count(UUID) TO authenticated;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'increment_user_count',
    'decrement_user_count',
    'add_storage_usage',
    'remove_storage_usage',
    'recalculate_storage_usage',
    'recalculate_user_count'
  )
ORDER BY routine_name;
