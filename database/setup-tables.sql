-- Script para criar as tabelas necessárias no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de tipos de documento (se não existir)
CREATE TABLE IF NOT EXISTS document_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de documentos (se não existir)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  document_type_id UUID REFERENCES document_types(id),
  created_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de perfis (se não existir)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de solicitações de aprovação
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'pending',
  step_order INTEGER DEFAULT 1,
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar view para notification_feed (compatibilidade)
CREATE OR REPLACE VIEW notification_feed AS
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  is_read,
  created_at,
  updated_at
FROM notifications;

-- 7. Inserir alguns tipos de documento padrão
INSERT INTO document_types (name, description) VALUES
  ('Contrato', 'Documentos contratuais'),
  ('Relatório', 'Relatórios diversos'),
  ('Política', 'Políticas da empresa'),
  ('Procedimento', 'Procedimentos operacionais')
ON CONFLICT (name) DO NOTHING;

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_document_id ON approval_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id ON approval_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- 9. Habilitar RLS (Row Level Security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas RLS básicas
-- Políticas para documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (created_by = auth.uid());

-- Políticas para approval_requests
CREATE POLICY "Users can view approval requests they're involved in" ON approval_requests
  FOR SELECT USING (
    approver_id = auth.uid() OR 
    document_id IN (SELECT id FROM documents WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can insert approval requests for their documents" ON approval_requests
  FOR INSERT WITH CHECK (
    document_id IN (SELECT id FROM documents WHERE created_by = auth.uid())
  );

CREATE POLICY "Approvers can update their approval requests" ON approval_requests
  FOR UPDATE USING (approver_id = auth.uid());

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Políticas para profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 11. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Criar triggers para updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at BEFORE UPDATE ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Criar função para sincronizar perfil com auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Criar trigger para sincronizar novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE documents IS 'Tabela de documentos do sistema';
COMMENT ON TABLE approval_requests IS 'Tabela de solicitações de aprovação';
COMMENT ON TABLE notifications IS 'Tabela de notificações do sistema';
COMMENT ON VIEW notification_feed IS 'View de compatibilidade para notificações';