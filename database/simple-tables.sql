-- EXECUTE ESTES COMANDOS UM POR VEZ NO SUPABASE SQL EDITOR

-- 1. Criar tabela de tipos de documento
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT document_types_pkey PRIMARY KEY (id)
);

-- 2. Criar tabela de documentos
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- 3. Criar tabela de aprovações
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  document_id UUID,
  approver_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  step_order INTEGER DEFAULT 1,
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT approval_requests_pkey PRIMARY KEY (id)
);

-- 4. Criar view simples para notification_feed
CREATE OR REPLACE VIEW public.notification_feed AS
SELECT 
  id,
  NULL::UUID as user_id,
  title,
  message,
  type,
  false as is_read,
  created_at,
  updated_at
FROM public.notifications
LIMIT 0;

-- 5. Inserir tipos básicos
INSERT INTO public.document_types (name, description) VALUES
  ('Contrato', 'Documentos contratuais'),
  ('Relatório', 'Relatórios diversos'),
  ('Política', 'Políticas da empresa'),
  ('Procedimento', 'Procedimentos padrão')
ON CONFLICT (name) DO NOTHING;