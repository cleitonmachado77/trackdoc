-- 🔧 CORREÇÃO: Bug no frontend - seleção de entidade não funciona

-- 1. Primeiro, execute o debug para confirmar o problema
SELECT 
    '🔍 CONFIRMANDO O BUG' as status,
    u.email,
    u.raw_user_meta_data->>'registration_type' as metadata_enviado,
    p.registration_type as perfil_criado,
    CASE 
        WHEN u.raw_user_meta_data->>'registration_type' = 'individual' THEN '❌ BUG CONFIRMADO: Frontend enviou individual'
        WHEN u.raw_user_meta_data->>'registration_type' = 'entity_admin' THEN '✅ Frontend funcionou'
        ELSE '❓ Estado desconhecido'
    END as diagnostico
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'cleitoncr767@gmail.com'
ORDER BY u.created_at DESC
LIMIT 1;

-- 2. Mostrar o que deveria ter sido enviado
DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO DO BUG:';
    RAISE NOTICE '1. Usuário selecionou "Entidade/Organização" no formulário';
    RAISE NOTICE '2. Mas frontend enviou registration_type = "individual"';
    RAISE NOTICE '3. Isso indica bug no JavaScript do formulário';
    RAISE NOTICE '4. Vamos corrigir o frontend agora';
END $$;