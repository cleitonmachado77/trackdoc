-- Migration: Adaptar Tabelas Existentes para o Sistema de Planos
-- Esta migration adapta as tabelas existentes (plans, subscriptions, profiles)
-- para funcionar com o novo sistema de planos

-- ============================================================================
-- 1. ATUALIZAR TABELA PLANS
-- ============================================================================

-- Adicionar colunas que faltam (se não existirem)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS interval VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS usuario_adicional_preco DECIMAL(10, 2);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS armazenamento_extra_preco DECIMAL(10, 2);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(type);
CREATE INDEX IF NOT EXISTS idx_plans_stripe_price_id ON plans(stripe_price_id);

-- ============================================================================
-- 2. ATUALIZAR TABELA SUBSCRIPTIONS
-- ============================================================================

-- Adicionar colunas que faltam
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_users INTEGER DEFAULT 1;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_storage_gb DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Renomear colunas para padronizar (se necessário)
DO $$ 
BEGIN
  -- Renomear trial_start para trial_start_date se existir
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'subscriptions' AND column_name = 'trial_start') THEN
    ALTER TABLE subscriptions RENAME COLUMN trial_start TO trial_start_date;
  END IF;
  
  -- Renomear trial_end para trial_end_date se existir
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'subscriptions' AND column_name = 'trial_end') THEN
    ALTER TABLE subscriptions RENAME COLUMN trial_end TO trial_end_date;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Adicionar colunas de data se não existirem com os nomes corretos
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_entity_id ON subscriptions(entity_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- 3. ATUALIZAR PLANOS EXISTENTES
-- ============================================================================

-- Atualizar plano Trial (se existir)
UPDATE plans 
SET type = 'trial',
    interval = 'monthly',
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
    )
WHERE name = 'Trial' AND type IS NULL;

-- Atualizar plano Starter para Básico
UPDATE plans 
SET name = 'Básico',
    type = 'basico',
    interval = 'monthly',
    price_monthly = 149.00,
    max_users = 15,
    max_storage_gb = 10,
    usuario_adicional_preco = 2.90,
    armazenamento_extra_preco = 0.49,
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
    )
WHERE name = 'Starter' AND type IS NULL;

-- Atualizar plano Professional para Profissional
UPDATE plans 
SET name = 'Profissional',
    type = 'profissional',
    interval = 'monthly',
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
    )
WHERE name = 'Professional' AND type IS NULL;

-- Atualizar plano Enterprise
UPDATE plans 
SET type = 'enterprise',
    interval = 'monthly',
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
    )
WHERE name = 'Enterprise' AND type IS NULL;

-- ============================================================================
-- 4. CRIAR/ATUALIZAR FUNÇÕES RPC
-- ============================================================================

-- Remover funções antigas se existirem
DROP FUNCTION IF EXISTS get_user_active_subscription(UUID);
DROP FUNCTION IF EXISTS create_trial_subscription(UUID, VARCHAR);

-- Função para buscar subscription ativa do usuário (adaptada)
CREATE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  entity_id UUID,
  plan_id UUID,
  status TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  current_users INTEGER,
  current_storage_gb DECIMAL,
  plan_name TEXT,
  plan_type VARCHAR,
  plan_price DECIMAL,
  plan_features JSONB,
  max_usuarios INTEGER,
  armazenamento_gb INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.entity_id,
    s.plan_id,
    s.status,
    COALESCE(s.start_date, s.current_period_start) as start_date,
    COALESCE(s.end_date, s.current_period_end) as end_date,
    s.trial_start_date,
    s.trial_end_date,
    COALESCE(s.current_users, 1) as current_users,
    COALESCE(s.current_storage_gb, 0) as current_storage_gb,
    p.name as plan_name,
    p.type as plan_type,
    p.price_monthly as plan_price,
    p.features as plan_features,
    p.max_users as max_usuarios,
    p.max_storage_gb as armazenamento_gb
  FROM subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar trial de 14 dias (adaptada)
CREATE FUNCTION create_trial_subscription(
  p_user_id UUID, 
  p_plan_type VARCHAR DEFAULT 'profissional'
)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_subscription_id UUID;
  v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar plano pelo tipo
  SELECT id INTO v_plan_id
  FROM plans
  WHERE type = p_plan_type 
    AND is_active = true
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plano % não encontrado', p_plan_type;
  END IF;
  
  -- Calcular data de fim do trial (14 dias)
  v_trial_end := NOW() + INTERVAL '14 days';
  
  -- Criar subscription
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    trial_start_date,
    trial_end_date,
    is_trial,
    current_users,
    current_storage_gb
  ) VALUES (
    p_user_id,
    v_plan_id,
    'trial',
    NOW(),
    NOW(),
    v_trial_end,
    true,
    1,
    0
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ATUALIZAR POLÍTICAS DE RLS
-- ============================================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Plans são públicos para leitura" ON plans;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias subscriptions" ON subscriptions;

-- Criar políticas
CREATE POLICY "Plans são públicos para leitura"
  ON plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Usuários podem ver suas próprias subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. TRIGGER PARA EXPIRAÇÃO DE TRIAL
-- ============================================================================

-- Função para verificar expiração de trial
CREATE OR REPLACE FUNCTION check_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'trial' 
     AND NEW.trial_end_date IS NOT NULL 
     AND NEW.trial_end_date < NOW() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS check_subscription_trial_expiration ON subscriptions;
CREATE TRIGGER check_subscription_trial_expiration
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_trial_expiration();

-- ============================================================================
-- 7. COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN plans.type IS 'Tipo do plano: basico, profissional, enterprise, trial';
COMMENT ON COLUMN plans.interval IS 'Intervalo de cobrança: monthly, yearly';
COMMENT ON COLUMN plans.stripe_price_id IS 'ID do preço no Stripe';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'ID da subscription no Stripe';
COMMENT ON COLUMN subscriptions.current_users IS 'Número atual de usuários';
COMMENT ON COLUMN subscriptions.current_storage_gb IS 'Armazenamento atual em GB';

-- ============================================================================
-- 8. VERIFICAÇÃO
-- ============================================================================

-- Verificar planos atualizados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM plans WHERE type IS NOT NULL;
  RAISE NOTICE 'Planos atualizados: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM plans WHERE type IN ('basico', 'profissional', 'enterprise');
  RAISE NOTICE 'Planos principais configurados: %', v_count;
END $$;

-- Fim da migration
