-- 🔍 VERIFICAR: Último usuário criado e seu metadata

-- 1. Verificar o último usuário criado
SELECT 
    '🔍 ÚLTIMO USUÁRIO' as status,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data,
    CASE 
        WHEN u.raw_user_meta_data IS NULL THEN '❌ METADATA NULL'
        WHEN u.raw_user_meta_data = '{}' THEN '❌ METADATA VAZIO'
        WHEN u.raw_user_meta_data->>'registration_type' IS NULL THEN '⚠️ SEM registration_type'
        WHEN u.raw_user_meta_data->>'registration_type' = 'entity_admin' THEN '✅ ENTITY_ADMIN'
        ELSE '➖ INDIVIDUAL'
    END as metadata_status
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 1;

-- 2. Verificar perfil correspondente
SELECT 
    '🔍 PERFIL DO ÚLTIMO USUÁRIO' as status,
    p.id,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_role,
    p.role,
    p.entity_id,
    CASE 
        WHEN p.registration_type = 'entity_admin' AND p.entity_id IS NOT NULL THEN '✅ ENTITY_ADMIN COM ENTIDADE'
        WHEN p.registration_type = 'entity_admin' AND p.entity_id IS NULL THEN '❌ ENTITY_ADMIN SEM ENTIDADE'
        WHEN p.registration_type = 'individual' THEN '➖ USUÁRIO INDIVIDUAL'
        ELSE '❓ ESTADO DESCONHECIDO'
    END as status_perfil
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 1;

-- 3. Verificar se o trigger está realmente ativo
SELECT 
    '🔍 STATUS DO TRIGGER' as status,
    COUNT(*) as triggers_ativos
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- 4. Verificar logs recentes (se a função está sendo executada)
-- Vamos simular um INSERT para ver se a função executa
DO $$
BEGIN
    RAISE NOTICE '🧪 Testando se a função handle_new_user está ativa...';
    
    -- Verificar se a função existe
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Função handle_new_user existe';
    ELSE
        RAISE NOTICE '❌ Função handle_new_user NÃO existe';
    END IF;
    
    -- Verificar se o trigger existe
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE '✅ Trigger on_auth_user_created existe';
    ELSE
        RAISE NOTICE '❌ Trigger on_auth_user_created NÃO existe';
    END IF;
END $$;