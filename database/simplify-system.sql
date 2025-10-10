-- 🔄 SIMPLIFICAR SISTEMA: Remover triggers complexos e deixar apenas usuários individuais

BEGIN;

-- 1. REMOVER TODOS OS TRIGGERS RELACIONADOS A ENTIDADES
DROP TRIGGER IF EXISTS handle_new_user_final_trigger ON auth.users;
DROP TRIGGER IF EXISTS ensure_entity_for_admin_insert_trigger ON profiles;
DROP TRIGGER IF EXISTS ensure_entity_for_admin_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 2. CRIAR TRIGGER SIMPLES APENAS PARA USUÁRIOS INDIVIDUAIS
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    -- Extrair nome do metadata
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        v_full_name := NEW.raw_user_meta_data->>'full_name';
    END IF;
    
    -- Usar email como fallback
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := NEW.email;
    END IF;
    
    -- Criar perfil individual simples
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        status,
        entity_role,
        registration_type,
        registration_completed
    ) VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        'user',
        'active',
        'user',
        'individual',
        true
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, criar perfil básico
        INSERT INTO public.profiles (id, full_name, email, role, status)
        VALUES (NEW.id, COALESCE(v_full_name, NEW.email), NEW.email, 'user', 'active')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger simples
CREATE TRIGGER handle_new_user_simple_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user_simple();

COMMIT;

-- 4. Verificar se foi criado
SELECT 
    '✅ SISTEMA SIMPLIFICADO' as status,
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
AND trigger_name = 'handle_new_user_simple_trigger';

-- 5. Confirmar
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema simplificado com sucesso!';
    RAISE NOTICE '📋 Agora apenas usuários individuais são criados automaticamente';
    RAISE NOTICE '🏢 Entidades devem ser criadas via painel administrativo';
    RAISE NOTICE '🧪 Teste o novo fluxo de registro';
END $$;