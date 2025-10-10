-- 🔧 CORREÇÃO: Remover triggers duplicados e criar apenas um correto

BEGIN;

-- 1. Remover TODOS os triggers duplicados
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Verificar se foram removidos
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_schema = 'auth' 
    AND event_object_table = 'users'
    AND trigger_name IN ('handle_new_user', 'on_auth_user_created');
    
    RAISE NOTICE '🔍 Triggers removidos. Restantes: %', trigger_count;
END $$;

-- 3. Criar APENAS UM trigger com a função correta
CREATE TRIGGER on_auth_user_created_final
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user_v2();

COMMIT;

-- 4. Verificar resultado final
SELECT 
    '🔍 TRIGGERS FINAIS' as status,
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 5. Confirmar
DO $$
BEGIN
    RAISE NOTICE '✅ Triggers duplicados removidos!';
    RAISE NOTICE '✅ Apenas um trigger ativo: on_auth_user_created_final';
    RAISE NOTICE '✅ Usando função correta: handle_new_user_v2';
    RAISE NOTICE '🧪 Agora teste registrando nova entidade!';
END $$;