-- Criar tabela para armazenar confirmações de email como fallback
CREATE TABLE IF NOT EXISTS email_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  email_content TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_confirmations_email ON email_confirmations(email);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_token ON email_confirmations(token);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_expires_at ON email_confirmations(expires_at);

-- RLS (Row Level Security)
ALTER TABLE email_confirmations ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção
CREATE POLICY "Allow insert email confirmations" ON email_confirmations
FOR INSERT 
TO authenticated, service_role
WITH CHECK (true);

-- Política para permitir leitura
CREATE POLICY "Allow read email confirmations" ON email_confirmations
FOR SELECT 
TO authenticated, service_role
USING (true);

-- Política para permitir atualização
CREATE POLICY "Allow update email confirmations" ON email_confirmations
FOR UPDATE 
TO authenticated, service_role
USING (true);

-- Função para limpeza automática de tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_email_confirmations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_confirmations 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON email_confirmations TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_email_confirmations() TO authenticated, service_role;

SELECT 'Tabela email_confirmations criada com sucesso' as status;