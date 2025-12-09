-- =====================================================
-- ATUALIZAÇÃO DA CONFIGURAÇÃO DOS PLANOS
-- =====================================================
-- Este script atualiza as funcionalidades e limites dos
-- três planos conforme especificação oficial
-- =====================================================

-- Backup dos dados atuais (opcional, mas recomendado)
-- CREATE TABLE plans_backup AS SELECT * FROM plans;

-- =====================================================
-- PLANO BÁSICO
-- =====================================================
-- Usuários: 15
-- Armazenamento: 10 GB
-- Funcionalidades: 5 habilitadas, 6 bloqueadas
-- IMPORTANTE: biblioteca_publica = TRUE
-- =====================================================

UPDATE plans SET
  features = jsonb_build_object(
    'dashboard_gerencial', true,
    'upload_documentos', true,
    'solicitacao_aprovacoes', true,
    'suporte_email', true,
    'biblioteca_publica', true,
    'assinatura_eletronica_simples', false,
    'assinatura_eletronica_multipla', false,
    'chat_nativo', false,
    'auditoria_completa', false,
    'backup_automatico_diario', false,
    'suporte_tecnico_dedicado', false
  ),
  max_users = 15,
  max_storage_gb = 10,
  usuario_adicional_preco = 2.90,
  armazenamento_extra_preco = 0.49,
  updated_at = NOW()
WHERE type = 'basico' AND interval = 'monthly';

-- =====================================================
-- PLANO PROFISSIONAL
-- =====================================================
-- Usuários: 50
-- Armazenamento: 50 GB
-- Funcionalidades: 6 habilitadas, 5 bloqueadas
-- =====================================================

UPDATE plans SET
  features = jsonb_build_object(
    'dashboard_gerencial', true,
    'upload_documentos', true,
    'solicitacao_aprovacoes', true,
    'suporte_email', true,
    'biblioteca_publica', true,
    'assinatura_eletronica_simples', true,
    'assinatura_eletronica_multipla', false,
    'chat_nativo', false,
    'auditoria_completa', false,
    'backup_automatico_diario', false,
    'suporte_tecnico_dedicado', false
  ),
  max_users = 50,
  max_storage_gb = 50,
  usuario_adicional_preco = NULL,
  armazenamento_extra_preco = NULL,
  updated_at = NOW()
WHERE type = 'profissional' AND interval = 'monthly';

-- =====================================================
-- PLANO ENTERPRISE
-- =====================================================
-- Usuários: 70
-- Armazenamento: 120 GB
-- Funcionalidades: TODAS habilitadas (11)
-- =====================================================

UPDATE plans SET
  features = jsonb_build_object(
    'dashboard_gerencial', true,
    'upload_documentos', true,
    'solicitacao_aprovacoes', true,
    'suporte_email', true,
    'biblioteca_publica', true,
    'assinatura_eletronica_simples', true,
    'assinatura_eletronica_multipla', true,
    'chat_nativo', true,
    'auditoria_completa', true,
    'backup_automatico_diario', true,
    'suporte_tecnico_dedicado', true
  ),
  max_users = 70,
  max_storage_gb = 120,
  usuario_adicional_preco = NULL,
  armazenamento_extra_preco = NULL,
  updated_at = NOW()
WHERE type = 'enterprise' AND interval = 'monthly';

-- =====================================================
-- VERIFICAÇÃO DOS DADOS ATUALIZADOS
-- =====================================================

SELECT 
  name,
  type,
  interval,
  price_monthly,
  features->>'biblioteca_publica' as biblioteca_publica,
  features->>'assinatura_eletronica_simples' as assinatura_simples,
  features->>'assinatura_eletronica_multipla' as assinatura_multipla,
  features->>'chat_nativo' as chat_nativo,
  features->>'auditoria_completa' as auditoria_completa,
  max_users,
  max_storage_gb,
  usuario_adicional_preco,
  armazenamento_extra_preco,
  is_active
FROM plans
WHERE interval = 'monthly'
ORDER BY 
  CASE type
    WHEN 'basico' THEN 1
    WHEN 'profissional' THEN 2
    WHEN 'enterprise' THEN 3
  END;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Básico (R$ 149/mês):
--   biblioteca_publica: true ✅
--   assinatura_simples: false
--   assinatura_multipla: false
--   chat_nativo: false
--   auditoria_completa: false
--   max_users: 15
--   max_storage_gb: 10
--   usuario_adicional_preco: 2.90
--   armazenamento_extra_preco: 0.49
--
-- Profissional (R$ 349/mês):
--   biblioteca_publica: true
--   assinatura_simples: true ✅
--   assinatura_multipla: false
--   chat_nativo: false
--   auditoria_completa: false
--   max_users: 50
--   max_storage_gb: 50
--   usuario_adicional_preco: NULL
--   armazenamento_extra_preco: NULL
--
-- Enterprise (R$ 599/mês):
--   biblioteca_publica: true
--   assinatura_simples: true
--   assinatura_multipla: true ✅
--   chat_nativo: true ✅
--   auditoria_completa: true ✅
--   max_users: 70
--   max_storage_gb: 120
--   usuario_adicional_preco: NULL
--   armazenamento_extra_preco: NULL
-- =====================================================

-- =====================================================
-- CONTAGEM DE FUNCIONALIDADES POR PLANO
-- =====================================================

SELECT 
  name,
  type,
  (
    (features->>'dashboard_gerencial')::boolean::int +
    (features->>'upload_documentos')::boolean::int +
    (features->>'solicitacao_aprovacoes')::boolean::int +
    (features->>'suporte_email')::boolean::int +
    (features->>'biblioteca_publica')::boolean::int +
    (features->>'assinatura_eletronica_simples')::boolean::int +
    (features->>'assinatura_eletronica_multipla')::boolean::int +
    (features->>'chat_nativo')::boolean::int +
    (features->>'auditoria_completa')::boolean::int +
    (features->>'backup_automatico_diario')::boolean::int +
    (features->>'suporte_tecnico_dedicado')::boolean::int
  ) as total_funcionalidades_habilitadas
FROM plans
WHERE interval = 'monthly'
ORDER BY 
  CASE type
    WHEN 'basico' THEN 1
    WHEN 'profissional' THEN 2
    WHEN 'enterprise' THEN 3
  END;

-- Resultado esperado:
-- Básico: 5 funcionalidades
-- Profissional: 6 funcionalidades
-- Enterprise: 11 funcionalidades
-- =====================================================

-- =====================================================
-- VERIFICAÇÃO FINAL - CAMPOS DA TABELA
-- =====================================================
-- A tabela plans usa:
-- - max_users (não max_usuarios)
-- - max_storage_gb (não armazenamento_gb)
-- - price_monthly (não price)
-- =====================================================
