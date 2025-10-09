-- SQL para criar apenas as tabelas que estão faltando
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de tipos de documento (se não existir)
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT document_types_pkey PRIMARY KEY (id)
);

-- 2. Criar tabela de documentos (se não existir)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  document_type_id UUID,
  created_by UUID,
  status VARCHAR(50) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_document_type_id_fkey FOREIGN KEY (document_type_id) REFERENCES document_types(id),
  CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT documents_status_check CHECK (status = ANY(ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'rejected'::text, 'archived'::text]))
);

-- 3. Criar tabela de solicitações de aprovação
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  step_order INTEGER DEFAULT 1,
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(50) DEFAULT 'medium',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT approval_requests_pkey PRIMARY KEY (id),
  CONSTRAINT approval_requests_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT approval_requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT approval_requests_status_check CHECK (status = ANY(ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])),
  CONSTRAINT approval_requests_priority_check CHECK (priority = ANY(ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))
);

-- 4. Criar view notification_feed para compatibilidade
CREATE OR REPLACE VIEW public.notification_feed AS
SELECT 
  id,
  created_by as user_id,
  title,
  message,
  type,
  CASE 
    WHEN status = 'read' THEN true 
    ELSE false 
  END as is_read,
  created_at,
  updated_at
FROM public.notifications
WHERE recipients IS NOT NULL AND array_length(recipients, 1) > 0;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_document_type_id ON public.documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

CREATE INDEX IF NOT EXISTS idx_approval_requests_document_id ON public.approval_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id ON public.approval_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at ON public.approval_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_approval_requests_deadline ON public.approval_requests(deadline);

CREATE INDEX IF NOT EXISTS idx_document_types_name ON public.document_types(name);
CREATE INDEX IF NOT EXISTS idx_document_types_is_active ON public.document_types(is_active);

-- 6. Criar triggers para updated_at (se a função já existir)
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at 
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_types_updated_at 
  BEFORE UPDATE ON public.document_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS

-- Políticas para documents
DROP POLICY IF EXISTS "Users can view documents they created or are approving" ON public.documents;
CREATE POLICY "Users can view documents they created or are approving" ON public.documents
  FOR SELECT USING (
    created_by = auth.uid() OR 
    id IN (SELECT document_id FROM approval_requests WHERE approver_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (created_by = auth.uid());

-- Políticas para approval_requests
DROP POLICY IF EXISTS "Users can view approval requests they're involved in" ON public.approval_requests;
CREATE POLICY "Users can view approval requests they're involved in" ON public.approval_requests
  FOR SELECT USING (
    approver_id = auth.uid() OR 
    document_id IN (SELECT id FROM documents WHERE created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert approval requests for their documents" ON public.approval_requests;
CREATE POLICY "Users can insert approval requests for their documents" ON public.approval_requests
  FOR INSERT WITH CHECK (
    document_id IN (SELECT id FROM documents WHERE created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Approvers can update their approval requests" ON public.approval_requests;
CREATE POLICY "Approvers can update their approval requests" ON public.approval_requests
  FOR UPDATE USING (approver_id = auth.uid());

-- Políticas para document_types (todos podem ver, apenas admins podem modificar)
DROP POLICY IF EXISTS "Everyone can view document types" ON public.document_types;
CREATE POLICY "Everyone can view document types" ON public.document_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify document types" ON public.document_types;
CREATE POLICY "Only admins can modify document types" ON public.document_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 9. Inserir tipos de documento padrão
INSERT INTO public.document_types (name, description) VALUES
  ('Contrato', 'Documentos contratuais e acordos'),
  ('Relatório', 'Relatórios diversos e análises'),
  ('Política', 'Políticas internas da empresa'),
  ('Procedimento', 'Procedimentos operacionais padrão'),
  ('Manual', 'Manuais e guias de instrução'),
  ('Formulário', 'Formulários e documentos de preenchimento'),
  ('Certificado', 'Certificados e documentos de validação'),
  ('Proposta', 'Propostas comerciais e técnicas')
ON CONFLICT (name) DO NOTHING;

-- 10. Comentários nas tabelas
COMMENT ON TABLE public.documents IS 'Tabela principal de documentos do sistema';
COMMENT ON TABLE public.approval_requests IS 'Solicitações de aprovação para documentos';
COMMENT ON TABLE public.document_types IS 'Tipos de documento disponíveis no sistema';
COMMENT ON VIEW public.notification_feed IS 'View de compatibilidade para o sistema de notificações existente';

-- 11. Verificar se as tabelas foram criadas
DO $$
BEGIN
  RAISE NOTICE 'Verificando tabelas criadas...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ Tabela documents criada com sucesso';
  ELSE
    RAISE NOTICE '❌ Erro ao criar tabela documents';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_requests' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ Tabela approval_requests criada com sucesso';
  ELSE
    RAISE NOTICE '❌ Erro ao criar tabela approval_requests';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_types' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ Tabela document_types criada com sucesso';
  ELSE
    RAISE NOTICE '❌ Erro ao criar tabela document_types';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'notification_feed' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ View notification_feed criada com sucesso';
  ELSE
    RAISE NOTICE '❌ Erro ao criar view notification_feed';
  END IF;
  
  RAISE NOTICE 'Configuração concluída! 🎉';
END $$;