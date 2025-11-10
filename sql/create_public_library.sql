-- Tabela para armazenar a biblioteca pública de documentos
CREATE TABLE IF NOT EXISTS public.public_library (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  document_id UUID NULL, -- Referência ao documento existente (opcional)
  
  -- Campos para documentos novos (não existentes na tabela documents)
  title TEXT NOT NULL,
  description TEXT NULL,
  file_path TEXT NULL,
  file_name TEXT NULL,
  file_size INTEGER NULL,
  file_type TEXT NULL,
  
  -- Configurações da biblioteca
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NULL DEFAULT 0,
  category TEXT NULL, -- Categoria customizada para a biblioteca
  tags TEXT[] NULL,
  
  -- Link público compartilhável
  public_slug TEXT NOT NULL UNIQUE, -- Slug único para acesso público
  
  -- Metadados
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NULL,
  
  -- Constraints
  CONSTRAINT public_library_pkey PRIMARY KEY (id),
  CONSTRAINT public_library_entity_id_fkey FOREIGN KEY (entity_id) 
    REFERENCES entities (id) ON DELETE CASCADE,
  CONSTRAINT public_library_document_id_fkey FOREIGN KEY (document_id) 
    REFERENCES documents (id) ON DELETE CASCADE,
  CONSTRAINT public_library_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT public_library_public_slug_key UNIQUE (public_slug)
) TABLESPACE pg_default;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_public_library_entity_id 
  ON public.public_library USING btree (entity_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_public_library_document_id 
  ON public.public_library USING btree (document_id) 
  TABLESPACE pg_default 
  WHERE document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_library_public_slug 
  ON public.public_library USING btree (public_slug) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_public_library_is_active 
  ON public.public_library USING btree (is_active) 
  TABLESPACE pg_default 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_public_library_entity_active 
  ON public.public_library USING btree (entity_id, is_active) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_public_library_display_order 
  ON public.public_library USING btree (entity_id, display_order) 
  TABLESPACE pg_default;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_public_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_public_library_updated_at_trigger
  BEFORE UPDATE ON public.public_library
  FOR EACH ROW
  EXECUTE FUNCTION update_public_library_updated_at();

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_public_library_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Se já tem slug, não faz nada
  IF NEW.public_slug IS NOT NULL AND NEW.public_slug != '' THEN
    RETURN NEW;
  END IF;
  
  -- Gera slug base a partir do entity_id
  base_slug := LOWER(REPLACE(NEW.entity_id::TEXT, '-', ''));
  base_slug := SUBSTRING(base_slug, 1, 12);
  final_slug := base_slug;
  
  -- Verifica se o slug já existe e adiciona contador se necessário
  WHILE EXISTS (SELECT 1 FROM public.public_library WHERE public_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.public_slug = final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_public_library_slug_trigger
  BEFORE INSERT ON public.public_library
  FOR EACH ROW
  EXECUTE FUNCTION generate_public_library_slug();

-- Comentários na tabela
COMMENT ON TABLE public.public_library IS 'Biblioteca pública de documentos acessível por link externo';
COMMENT ON COLUMN public.public_library.public_slug IS 'Slug único para acesso público via URL';
COMMENT ON COLUMN public.public_library.document_id IS 'Referência ao documento existente (opcional)';
COMMENT ON COLUMN public.public_library.is_active IS 'Define se o documento está ativo na biblioteca pública';
COMMENT ON COLUMN public.public_library.display_order IS 'Ordem de exibição dos documentos';
