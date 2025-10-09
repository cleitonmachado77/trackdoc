-- ============================================================================
-- CORREÇÃO SIMPLES DOS ERROS DE CONSOLE
-- ============================================================================

-- 1. CRIAR PERFIL PARA USUÁRIO ÓRFÃO
INSERT INTO profiles (
    id, 
    full_name, 
    email, 
    role, 
    status,
    entity_role,
    registration_type,
    registration_completed
)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    u.email,
    'user',
    'active',
    'user',
    'individual',
    true
FROM auth.users u
WHERE u.id = '1e4799e6-d473-4ffd-ad43-fb669af58be5'
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 2. LIMPAR APPROVAL_REQUESTS ÓRFÃOS
DELETE FROM approval_requests 
WHERE approver_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = approver_id);

-- 3. LIMPAR DEPARTMENTS COM MANAGER_ID ÓRFÃO
UPDATE departments 
SET manager_id = NULL
WHERE manager_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = manager_id);

-- 4. LIMPAR ENTITIES COM ADMIN_USER_ID ÓRFÃO
UPDATE entities 
SET admin_user_id = NULL
WHERE admin_user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = admin_user_id);

-- 5. LIMPAR DOCUMENTOS COM REFERÊNCIAS ÓRFÃS
UPDATE documents 
SET author_id = NULL
WHERE author_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = author_id);

UPDATE documents 
SET category_id = NULL
WHERE category_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = category_id);

UPDATE documents 
SET document_type_id = NULL
WHERE document_type_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM document_types dt WHERE dt.id = document_type_id);

-- 6. CORRIGIR FUNÇÃO GET_ENTITY_STATS
-- Primeiro remover a função existente se houver conflito de tipo
DROP FUNCTION IF EXISTS public.get_entity_stats(UUID);

-- Criar função com tipo correto
CREATE OR REPLACE FUNCTION public.get_entity_stats(entity_uuid UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_entity_id UUID;
    target_entity_id UUID;
BEGIN
    -- Obter entity_id do usuário atual
    SELECT entity_id INTO user_entity_id 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- Determinar qual entidade consultar
    target_entity_id := COALESCE(entity_uuid, user_entity_id);
    
    -- Construir estatísticas básicas
    SELECT json_build_object(
        'total_documents', COALESCE((
            SELECT COUNT(*) FROM documents 
            WHERE entity_id = target_entity_id
        ), 0),
        'total_users', COALESCE((
            SELECT COUNT(*) FROM profiles 
            WHERE entity_id = target_entity_id
        ), 0),
        'pending_approvals', 0,
        'entity_id', target_entity_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. DAR PERMISSÕES PARA A FUNÇÃO
GRANT EXECUTE ON FUNCTION public.get_entity_stats(UUID) TO authenticated;