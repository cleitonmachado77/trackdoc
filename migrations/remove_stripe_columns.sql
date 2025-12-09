-- ============================================================================
-- MIGRAÇÃO: Remover colunas do Stripe das tabelas
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- 1. Remover colunas do Stripe da tabela plans
ALTER TABLE plans 
DROP COLUMN IF EXISTS stripe_price_id,
DROP COLUMN IF EXISTS stripe_product_id;

-- 2. Remover colunas do Stripe da tabela subscriptions (se existirem)
ALTER TABLE subscriptions 
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- 3. Remover índice do stripe_price_id se existir
DROP INDEX IF EXISTS idx_plans_stripe_price_id;

-- 4. Atualizar os planos com as informações corretas baseadas na tabela fornecida
-- Plano Básico
UPDATE plans SET
  name = 'Básico',
  price_monthly = 149.00,
  max_users = 15,
  max_storage_gb = 10,
  features = jsonb_build_object(
    'dashboard_gerencial', true,
    'upload_documentos', true,
    'solicitacao_aprovacoes', true,
    'suporte_email', true,
    'biblioteca_publica', false,
    'assinatura_eletronica_simples', false,
    'assinatura_eletronica_multipla', false,
    'chat_nativo', false,
    'auditoria_completa', false,
    'backup_automatico_diario', false,
    'suporte_tecnico_dedicado', false
  ),
  usuario_adicional_preco = 2.90,
  armazenamento_extra_preco = 0.49
WHERE type = 'basico';

-- Plano Profissional
UPDATE plans SET
  name = 'Profissional',
  price_monthly = 349.00,
  max_users = 50,
  max_storage_gb = 50,
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
  usuario_adicional_preco = NULL,
  armazenamento_extra_preco = NULL
WHERE type = 'profissional';

-- Plano Enterprise
UPDATE plans SET
  name = 'Enterprise',
  price_monthly = 599.00,
  max_users = 70,
  max_storage_gb = 120,
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
  usuario_adicional_preco = NULL,
  armazenamento_extra_preco = NULL
WHERE type = 'enterprise';

-- 5. Verificar os planos atualizados
SELECT id, name, type, price_monthly, max_users, max_storage_gb, features
FROM plans
WHERE type IN ('basico', 'profissional', 'enterprise')
ORDER BY price_monthly;
