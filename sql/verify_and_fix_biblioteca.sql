-- Script de verificação e correção da estrutura da Biblioteca Pública
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna category_id existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'public_library' 
        AND column_name = 'category_id'
    ) THEN
        RAISE NOTICE 'PROBLEMA ENCONTRADO: Coluna category_id não existe na tabela public_library';
        RAISE NOTICE 'SOLUÇÃO: Execute o script sql/create_library_categories.sql';
    ELSE
        RAISE NOTICE 'OK: Coluna category_id existe na tabela public_library';
    END IF;
END $$;

-- 2. Verificar se a tabela library_categories existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'library_categories'
    ) THEN
        RAISE NOTICE 'PROBLEMA ENCONTRADO: Tabela library_categories não existe';
        RAISE NOTICE 'SOLUÇÃO: Execute o script sql/create_library_categories.sql';
    ELSE
        RAISE NOTICE 'OK: Tabela library_categories existe';
    END IF;
END $$;

-- 3. Listar estrutura atual da tabela public_library
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'public_library'
ORDER BY ordinal_position;

-- 4. Se precisar adicionar a coluna manualmente (caso o script completo não possa ser executado):
-- Descomente as linhas abaixo:

-- ALTER TABLE public.public_library 
--   ADD COLUMN IF NOT EXISTS category_id UUID NULL;

-- ALTER TABLE public.public_library 
--   ADD CONSTRAINT public_library_category_id_fkey 
--     FOREIGN KEY (category_id) REFERENCES library_categories (id) ON DELETE SET NULL;

-- CREATE INDEX IF NOT EXISTS idx_public_library_category_id 
--   ON public.public_library USING btree (category_id);
