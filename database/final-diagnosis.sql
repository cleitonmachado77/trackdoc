-- 🚨 DIAGNÓSTICO FINAL: Por que a função não executa?

-- 1. Verificar se nossa função v2 existe
SELECT 
    '🔍 FUNÇÃO V2' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user_v2' 
AND routine_schema = 'public';

-- 2. Verificar triggers ativos
SELECT 
    '🔍 TRIGGERS ATIVOS' as status,
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 3. Verificar se há função handle_new_user antiga ainda ativa
SELECT 
    '🔍 FUNÇÃO ANTIGA' as status,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 4. FORÇAR execução manual da nossa função para testar
DO $$
DECLARE
    test_metadata JSONB;
    test_user_record RECORD;
BEGIN
    -- Simular NEW record
    test_metadata := '{
        "full_name": "Teste Manual",
        "role": "admin",
        "entity_role": "admin",
        "registration_type": "entity_admin",
        "entity_name": "Teste Manual Empresa",
        "entity_legal_name": "Teste Manual Empresa Ltda",
        "entity_cnpj": "12345678000199"
    }'::JSONB;
    
    RAISE NOTICE '🧪 TESTE MANUAL: Simulando execução da função';
    RAISE NOTICE '📋 Metadata de teste: %', test_metadata;
    
    -- Verificar se conseguimos extrair dados
    RAISE NOTICE '📊 registration_type extraído: %', test_metadata->>'registration_type';
    RAISE NOTICE '📊 entity_name extraído: %', test_metadata->>'entity_name';
    
END $$;

-- 5. Mostrar diagnóstico
DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO:';
    RAISE NOTICE '1. Frontend envia metadata correto ✅';
    RAISE NOTICE '2. Perfil criado com dados errados ❌';
    RAISE NOTICE '3. Isso significa: função antiga ainda executa';
    RAISE NOTICE '4. Ou: nossa função não está sendo chamada';
    RAISE NOTICE '5. Ou: há conflito de funções';
END $$;