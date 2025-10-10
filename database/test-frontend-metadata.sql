-- 🔍 TESTE: Verificar se frontend está enviando metadata corretamente

-- 1. Verificar metadata de TODOS os usuários recentes
SELECT 
    '🔍 METADATA DE USUÁRIOS RECENTES' as status,
    u.email,
    u.created_at,
    u.raw_user_meta_data,
    CASE 
        WHEN u.raw_user_meta_data IS NULL THEN '❌ NULL'
        WHEN u.raw_user_meta_data = '{}' THEN '❌ VAZIO'
        WHEN u.raw_user_meta_data->>'registration_type' IS NULL THEN '⚠️ SEM registration_type'
        WHEN u.raw_user_meta_data->>'registration_type' = 'entity_admin' THEN '✅ ENTITY_ADMIN'
        ELSE '➖ INDIVIDUAL'
    END as metadata_status,
    u.raw_user_meta_data->>'registration_type' as reg_type,
    u.raw_user_meta_data->>'entity_name' as entity_name_meta,
    u.raw_user_meta_data->>'full_name' as full_name_meta
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '2 hours'
ORDER BY u.created_at DESC;

-- 2. Criar função de teste para simular registro com metadata correto
CREATE OR REPLACE FUNCTION test_registration_with_metadata()
RETURNS TEXT AS $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'teste.metadata@empresa.com';
    test_metadata JSONB;
    result_text TEXT := '';
BEGIN
    -- Simular metadata que DEVERIA vir do frontend
    test_metadata := '{
        "full_name": "João Teste Metadata",
        "role": "admin",
        "entity_role": "admin",
        "registration_type": "entity_admin",
        "selected_plan_id": "1e3d300b-a492-4e95-a42c-dd1d53a5b848",
        "entity_name": "Teste Metadata Empresa",
        "entity_legal_name": "Teste Metadata Empresa Ltda",
        "entity_cnpj": "11223344000155",
        "entity_phone": "(11) 77777-7777"
    }'::JSONB;
    
    result_text := result_text || 'Testando criação com metadata: ' || test_metadata::TEXT || E'\n';
    
    -- Simular INSERT em auth.users (o que o Supabase faria)
    -- NOTA: Não podemos realmente inserir em auth.users, mas podemos testar a função
    
    result_text := result_text || 'Metadata seria processado pela função handle_new_user' || E'\n';
    result_text := result_text || 'entity_name extraído: ' || (test_metadata->>'entity_name') || E'\n';
    result_text := result_text || 'registration_type extraído: ' || (test_metadata->>'registration_type') || E'\n';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 3. Executar teste
SELECT test_registration_with_metadata();

-- 4. Verificar se a função handle_new_user tem logs habilitados
DO $$
BEGIN
    RAISE NOTICE '🔍 Para debugar o problema do metadata:';
    RAISE NOTICE '1. Verifique se o frontend está enviando registration_type = entity_admin';
    RAISE NOTICE '2. Verifique se os dados da entidade estão no metadata';
    RAISE NOTICE '3. A função handle_new_user deveria mostrar logs RAISE NOTICE';
    RAISE NOTICE '4. Se não há logs, a função pode não estar sendo executada';
END $$;