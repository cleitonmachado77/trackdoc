-- 🔍 TESTE: Por que o trigger não está funcionando?

-- 1. Verificar se trigger está ativo
SELECT 
    '🔍 TRIGGER STATUS' as status,
    trigger_name,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Verificar metadata do último usuário criado
SELECT 
    '🔍 METADATA DO ÚLTIMO USUÁRIO' as status,
    u.id,
    u.email,
    u.raw_user_meta_data,
    CASE 
        WHEN u.raw_user_meta_data IS NULL THEN '❌ METADATA NULL'
        WHEN u.raw_user_meta_data = '{}' THEN '❌ METADATA VAZIO'
        WHEN u.raw_user_meta_data->>'registration_type' = 'entity_admin' THEN '✅ ENTITY_ADMIN'
        ELSE '⚠️ INDIVIDUAL'
    END as metadata_status
FROM auth.users u
WHERE u.id = 'b9b0a9e5-5c3a-4b0b-8391-18570f9064a7';

-- 3. Verificar se a função existe
SELECT 
    '🔍 FUNÇÃO STATUS' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user_final' 
AND routine_schema = 'public';

-- 4. FORÇAR execução manual da função para testar
DO $$
DECLARE
    test_user_record RECORD;
    test_metadata JSONB;
BEGIN
    -- Pegar dados do usuário real
    SELECT * INTO test_user_record 
    FROM auth.users 
    WHERE id = 'b9b0a9e5-5c3a-4b0b-8391-18570f9064a7';
    
    RAISE NOTICE '🧪 TESTE MANUAL: Simulando trigger para usuário: %', test_user_record.email;
    RAISE NOTICE '📋 TESTE MANUAL: Metadata real: %', test_user_record.raw_user_meta_data;
    
    -- Verificar se conseguimos extrair registration_type
    IF test_user_record.raw_user_meta_data IS NOT NULL THEN
        RAISE NOTICE '📊 TESTE MANUAL: registration_type = %', test_user_record.raw_user_meta_data->>'registration_type';
        RAISE NOTICE '📊 TESTE MANUAL: entity_name = %', test_user_record.raw_user_meta_data->>'entity_name';
    ELSE
        RAISE NOTICE '❌ TESTE MANUAL: Metadata é NULL!';
    END IF;
    
END $$;

-- 5. Diagnóstico
DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETO:';
    RAISE NOTICE '1. Trigger existe e está ativo';
    RAISE NOTICE '2. Mas perfil foi criado com valores padrão';
    RAISE NOTICE '3. Possíveis causas:';
    RAISE NOTICE '   a) Metadata não chegou no trigger';
    RAISE NOTICE '   b) Função não está sendo executada';
    RAISE NOTICE '   c) Função está falhando silenciosamente';
    RAISE NOTICE '4. Verificar logs do PostgreSQL para mensagens RAISE NOTICE';
END $$;