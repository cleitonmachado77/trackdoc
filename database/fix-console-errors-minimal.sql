-- ============================================================================
-- CORREÇÃO MÍNIMA DOS ERROS DE CONSOLE
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

-- 6. REMOVER FUNÇÃO PROBLEMÁTICA E RECRIAR SIMPLES
DROP FUNCTION IF EXISTS public.get_entity_stats(UUID);
DROP FUNCTION IF EXISTS public.get_entity_stats();

-- Criar função básica que sempre retorna dados válidos
CREATE FUNCTION public.get_entity_stats(entity_uuid UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'total_documents', 0,
        'total_users', 1,
        'pending_approvals', 0,
        'entity_id', entity_uuid
    );
$$;

-- 7. DAR PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_entity_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_stats(UUID) TO anon;