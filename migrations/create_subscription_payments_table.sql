-- =====================================================
-- CRIAR TABELA DE PAGAMENTOS DE ASSINATURAS
-- =====================================================
-- Tabela para registrar histórico de pagamentos
-- =====================================================

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  payment_method VARCHAR(50) DEFAULT 'manual',
  transaction_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT subscription_payments_status_check 
    CHECK (status IN ('completed', 'pending', 'failed', 'refunded'))
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id 
  ON subscription_payments(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id 
  ON subscription_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_date 
  ON subscription_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_status 
  ON subscription_payments(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_subscription_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_payments_updated_at();

-- Comentários
COMMENT ON TABLE subscription_payments IS 
  'Histórico de pagamentos das assinaturas dos usuários';

COMMENT ON COLUMN subscription_payments.subscription_id IS 
  'ID da assinatura relacionada';

COMMENT ON COLUMN subscription_payments.amount IS 
  'Valor pago em reais';

COMMENT ON COLUMN subscription_payments.payment_date IS 
  'Data em que o pagamento foi realizado';

COMMENT ON COLUMN subscription_payments.status IS 
  'Status do pagamento: completed, pending, failed, refunded';

COMMENT ON COLUMN subscription_payments.payment_method IS 
  'Método de pagamento: manual, credit_card, pix, boleto, etc';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
  '=== TABELA CRIADA ===' as info;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar a estrutura da tabela subscription_payments
-- com todos os campos criados
-- =====================================================
