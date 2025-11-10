-- Corrigir constraint de unicidade de categorias
-- Problema: categories_name_key é global, deveria ser por entidade

-- 1. Remover a constraint antiga (global)
ALTER TABLE public.categories 
DROP CONSTRAINT IF EXISTS categories_name_key;

-- 2. Adicionar nova constraint única composta (name + entity_id)
-- Isso permite que diferentes entidades tenham categorias com o mesmo nome
ALTER TABLE public.categories 
ADD CONSTRAINT categories_name_entity_unique 
UNIQUE (name, entity_id);

-- 3. Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_categories_name_entity 
ON public.categories (name, entity_id);

-- Comentário explicativo
COMMENT ON CONSTRAINT categories_name_entity_unique ON public.categories IS 
'Garante que cada entidade tenha nomes de categorias únicos, mas permite que diferentes entidades usem os mesmos nomes';
