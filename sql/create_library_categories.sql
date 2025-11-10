-- Tabela para categorias da biblioteca pública
CREATE TABLE IF NOT EXISTS public.library_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NULL,
  icon TEXT NULL, -- Nome do ícone (lucide-react)
  color TEXT NULL, -- Cor da categoria (hex)
  display_order INTEGER NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NULL,
  
  -- Constraints
  CONSTRAINT library_categories_pkey PRIMARY KEY (id),
  CONSTRAINT library_categories_entity_id_fkey FOREIGN KEY (entity_id) 
    REFERENCES entities (id) ON DELETE CASCADE,
  CONSTRAINT library_categories_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT library_categories_entity_name_unique UNIQUE (entity_id, name)
) TABLESPACE pg_default;

-- Índices
CREATE INDEX IF NOT EXISTS idx_library_categories_entity_id 
  ON public.library_categories USING btree (entity_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_library_categories_is_active 
  ON public.library_categories USING btree (is_active) 
  TABLESPACE pg_default 
  WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_library_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_library_categories_updated_at_trigger
  BEFORE UPDATE ON public.library_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_library_categories_updated_at();

-- Atualizar tabela public_library para usar category_id
ALTER TABLE public.public_library 
  ADD COLUMN IF NOT EXISTS category_id UUID NULL,
  ADD CONSTRAINT public_library_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES library_categories (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_public_library_category_id 
  ON public.public_library USING btree (category_id) 
  TABLESPACE pg_default;

-- Comentários
COMMENT ON TABLE public.library_categories IS 'Categorias para organizar documentos da biblioteca pública';
COMMENT ON COLUMN public.library_categories.icon IS 'Nome do ícone do lucide-react';
COMMENT ON COLUMN public.library_categories.color IS 'Cor da categoria em formato hexadecimal';
