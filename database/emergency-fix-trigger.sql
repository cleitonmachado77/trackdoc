-- 🚨 CORREÇÃO EMERGENCIAL: Trigger não está funcionando

-- 1. Verificar se trigger existe
SELECT 
    '🔍 STATUS DO TRIGGER' as status,
    COUNT(*) as triggers_encontrados
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth'
AND event_object_table = 'users';

-- 2. Verificar se função existe
SELECT 
    '🔍 STATUS DA FUNÇÃO' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 3. Tentar recriar trigger com permissões de superuser
DO $$
BEGIN
    -- Remover trigger existente
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Tentar criar novamente
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW 
        EXECUTE FUNCTION public.handle_new_user();
        
    RAISE NOTICE '✅ Trigger recriado com sucesso!';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '❌ Erro de permissão: Precisa de superuser para criar trigger em auth.users';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar trigger: %', SQLERRM;
END $$;

-- 4. Verificar novamente
SELECT 
    '🔍 VERIFICAÇÃO FINAL' as status,
    COUNT(*) as triggers_ativos
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Se trigger não funcionar, mostrar solução alternativa
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created';
    
    IF trigger_count = 0 THEN
        RAISE NOTICE '❌ TRIGGER NÃO PODE SER CRIADO';
        RAISE NOTICE '🔧 SOLUÇÃO: Modificar frontend para chamar API que cria entidade';
        RAISE NOTICE '📋 Ou executar como service_role/superuser';
    ELSE
        RAISE NOTICE '✅ Trigger ativo! Teste novamente.';
    END IF;
END $$;