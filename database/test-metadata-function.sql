-- 🧪 TESTE: Verificar se a função handle_new_user está processando metadata

-- 1. Criar função de teste para simular criação de usuário
CREATE OR REPLACE FUNCTION test_handle_new_user_metadata()
RETURNS TEXT AS $$
DECLARE
    test_metadata JSONB;
    result_text TEXT := '';
BEGIN
    -- Simular metadata que deveria vir do frontend
    test_metadata := '{
        "full_name": "Teste Usuario",
        "role": "admin",
        "entity_role": "admin", 
        "registration_type": "entity_admin",
        "selected_plan_id": "123e4567-e89b-12d3-a456-426614174000",
        "entity_name": "Teste Empresa Ltda",
        "entity_legal_name": "Teste Empresa Limitada",
        "entity_cnpj": "12345678000199",
        "entity_phone": "(11) 99999-9999"
    }'::JSONB;
    
    result_text := result_text || 'Metadata de teste: ' || test_metadata::TEXT || E'\n';
    
    -- Testar extração de dados
    result_text := result_text || 'full_name: ' || COALESCE(test_metadata->>'full_name', 'NULL') || E'\n';
    result_text := result_text || 'role: ' || COALESCE(test_metadata->>'role', 'NULL') || E'\n';
    result_text := result_text || 'entity_role: ' || COALESCE(test_metadata->>'entity_role', 'NULL') || E'\n';
    result_text := result_text || 'registration_type: ' || COALESCE(test_metadata->>'registration_type', 'NULL') || E'\n';
    result_text := result_text || 'entity_name: ' || COALESCE(test_metadata->>'entity_name', 'NULL') || E'\n';
    result_text := result_text || 'entity_legal_name: ' || COALESCE(test_metadata->>'entity_legal_name', 'NULL') || E'\n';
    result_text := result_text || 'entity_cnpj: ' || COALESCE(test_metadata->>'entity_cnpj', 'NULL') || E'\n';
    result_text := result_text || 'entity_phone: ' || COALESCE(test_metadata->>'entity_phone', 'NULL') || E'\n';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 2. Executar teste
SELECT test_handle_new_user_metadata();

-- 3. Verificar o último usuário criado e seu metadata real
SELECT 
    '🔍 ÚLTIMO USUÁRIO CRIADO' as status,
    u.email,
    u.raw_user_meta_data,
    CASE 
        WHEN u.raw_user_meta_data IS NULL THEN '❌ METADATA NULL'
        WHEN u.raw_user_meta_data = '{}' THEN '❌ METADATA VAZIO'
        ELSE '✅ METADATA PRESENTE'
    END as metadata_status,
    COALESCE(u.raw_user_meta_data->>'registration_type', 'NULL') as registration_type_metadata,
    p.registration_type as registration_type_profile
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 1;