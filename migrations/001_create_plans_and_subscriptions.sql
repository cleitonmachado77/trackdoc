-- Migration: Sistema de Planos e Assinaturas
-- Criado em: 2025-12-08

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('basico', 'profissional', 'enterprise')),
  price DECIMAL(10, 2) NOT NULL,
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('monthly', 'yearly')),
  
  -- Features (JSON para flexibilidade)
  features JSONB NOT NULL DEFAULT '{}',
  
  -- Limites
  max_usuarios INTEGER NOT NULL,
  armazenamento_gb INTEGER NOT NULL,
  usuario_adicional_preco DECIMAL(10, 2),
  armazenamento_extra_preco DECIMAL(10, 2),
  
  -- Stripe
  stripe_price_id VARCHAR(255),
  stripe_product_id VARCHAR(255),
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(type, interval)
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES plans(id),
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'trial', 'canceled', 'expired', 'past_due')),
  
  -- Datas
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Stripe
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Uso atual
  current_users INTEGER DEFAULT 1,
  current_storage_gb DECIMAL(10, 2) DEFAULT 0,
  
  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Um usuário só pode ter uma assinatura ativa por vez
  UNIQUE(user_id, status) WHERE status IN ('active', 'trial')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_entity_id ON subscriptions(entity_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(type);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar se trial expirou
CREATE OR REPLACE FUNCTION check_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'trial' AND NEW.trial_end_date IS NOT NULL AND NEW.trial_end_date < NOW() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_subscription_trial_expiration
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_trial_expiration();

-- Inserir planos padrão
INSERT INTO plans (name, type, price, interval, features, max_usuarios, armazenamento_gb, usuario_adicional_preco, armazenamento_extra_preco)
VALUES 
  -- Plano Básico
  (
    'Básico',
    'basico',
    149.00,
    'monthly',
    '{
      "dashboard_gerencial": true,
      "upload_documentos": true,
      "solicitacao_aprovacoes": true,
      "suporte_email": true,
      "biblioteca_publica": false,
      "assinatura_eletronica_simples": false,
      "assinatura_eletronica_multipla": false,
      "chat_nativo": false,
      "auditoria_completa": false,
      "backup_automatico_diario": false,
      "suporte_tecnico_dedicado": false
    }'::jsonb,
    15,
    10,
    2.90,
    0.49
  ),
  -- Plano Profissional
  (
    'Profissional',
    'profissional',
    349.00,
    'monthly',
    '{
      "dashboard_gerencial": true,
      "upload_documentos": true,
      "solicitacao_aprovacoes": true,
      "suporte_email": true,
      "biblioteca_publica": true,
      "assinatura_eletronica_simples": true,
      "assinatura_eletronica_multipla": false,
      "chat_nativo": false,
      "auditoria_completa": false,
      "backup_automatico_diario": false,
      "suporte_tecnico_dedicado": false
    }'::jsonb,
    50,
    50,
    NULL,
    NULL
  ),
  -- Plano Enterprise
  (
    'Enterprise',
    'enterprise',
    599.00,
    'monthly',
    '{
      "dashboard_gerencial": true,
      "upload_documentos": true,
      "solicitacao_aprovacoes": true,
      "suporte_email": true,
      "biblioteca_publica": true,
      "assinatura_eletronica_simples": true,
      "assinatura_eletronica_multipla": true,
      "chat_nativo": true,
      "auditoria_completa": true,
      "backup_automatico_diario": true,
      "suporte_tecnico_dedicado": true
    }'::jsonb,
    70,
    120,
    NULL,
    NULL
  )
ON CONFLICT (type, interval) DO NOTHING;

-- RLS (Row Level Security)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para plans (todos podem ler)
CREATE POLICY "Plans são públicos para leitura"
  ON plans FOR SELECT
  USING (is_active = true);

-- Políticas para subscriptions (usuários só veem suas próprias)
CREATE POLICY "Usuários podem ver suas próprias subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Função para buscar subscription ativa do usuário
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  entity_id UUID,
  plan_id UUID,
  status VARCHAR,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  current_users INTEGER,
  current_storage_gb DECIMAL,
  plan_name VARCHAR,
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
    s.start_date,
    s.end_date,
    s.trial_start_date,
    s.trial_end_date,
    s.current_users,
    s.current_storage_gb,
    p.name as plan_name,
    p.type as plan_type,
    p.price as plan_price,
    p.features as plan_features,
    p.max_usuarios,
    p.armazenamento_gb
  FROM subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar trial de 14 dias
CREATE OR REPLACE FUNCTION create_trial_subscription(p_user_id UUID, p_plan_type VARCHAR DEFAULT 'profissional')
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_subscription_id UUID;
  v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar plano
  SELECT id INTO v_plan_id
  FROM plans
  WHERE type = p_plan_type AND interval = 'monthly' AND is_active = true
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
    trial_end_date
  ) VALUES (
    p_user_id,
    v_plan_id,
    'trial',
    NOW(),
    NOW(),
    v_trial_end
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE plans IS 'Planos disponíveis na plataforma';
COMMENT ON TABLE subscriptions IS 'Assinaturas dos usuários';
COMMENT ON FUNCTION get_user_active_subscription IS 'Retorna a subscription ativa do usuário com dados do plano';
COMMENT ON FUNCTION create_trial_subscription IS 'Cria uma subscription trial de 14 dias para o usuário';
