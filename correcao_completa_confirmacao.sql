-- ========================================
-- CORREÇÃO COMPLETA DO PROBLEMA DE CONFIRMAÇÃO
-- ========================================

-- 1. REMOVER TRIGGERS PROBLEMÁTICOS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_simple_trigger ON auth.users;

-- 2. CRIAR FUNÇÃO ROBUSTA PARA CRIAÇÃO DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user_robust()
RETURNS TRIGGER AS $$
DECLARE
    user_full_name TEXT;
    user_registration_type TEXT;
BEGIN
    -- Extrair dados do metadata
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    user_registration_type := COALESCE(
        NEW.raw_user_meta_data->>'registration_type',
        'individual'
    );
    
    -- Inserir perfil com tratamento de erro
    BEGIN
        INSERT INTO public.profiles (
            id,
            full_name,
            email,
            role,
            status,
            permissions,
            registration_type,
            registration_completed,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            user_full_name,
            NEW.email,
            'user',
            'active',
            '["read", "write"]'::jsonb,
            user_registration_type,
            true,
            NOW(),
            NOW()
        );
        
        -- Log de sucesso
        RAISE NOTICE 'Perfil criado com sucesso para usuário: %', NEW.email;
        
    EXCEPTION 
        WHEN unique_violation THEN
            -- Perfil já existe, apenas atualizar
            UPDATE public.profiles 
            SET 
                email = NEW.email,
                updated_at = NOW()
            WHERE id = NEW.id;
            
            RAISE NOTICE 'Perfil já existia para usuário: %', NEW.email;
            
        WHEN OTHERS THEN
            -- Log do erro mas não falhar o processo de criação do usuário
            RAISE WARNING 'Erro ao criar perfil para %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR TRIGGER ROBUSTO
CREATE TRIGGER handle_new_user_robust_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_robust();

-- 4. CRIAR FUNÇÃO PARA CORRIGIR USUÁRIOS EXISTENTES SEM PERFIL
CREATE OR REPLACE FUNCTION fix_users_without_profiles()
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    fixed_count INTEGER := 0;
    error_count INTEGER := 0;
    result JSON;
BEGIN
    -- Buscar usuários sem perfil
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
        FROM auth.users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            INSERT INTO public.profiles (
                id,
                full_name,
                email,
                role,
                status,
                permissions,
                registration_type,
                registration_completed,
                created_at,
                updated_at
            ) VALUES (
                user_record.id,
                COALESCE(
                    user_record.raw_user_meta_data->>'full_name',
                    split_part(user_record.email, '@', 1)
                ),
                user_record.email,
                'user',
                'active',
                '["read", "write"]'::jsonb,
                COALESCE(
                    user_record.raw_user_meta_data->>'registration_type',
                    'individual'
                ),
                true,
                user_record.created_at,
                NOW()
            );
            
            fixed_count := fixed_count + 1;
            
        EXCEPTION 
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE WARNING 'Erro ao criar perfil para %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
    
    result := json_build_object(
        'success', true,
        'fixed_profiles', fixed_count,
        'errors', error_count,
        'message', format('Corrigidos %s perfis, %s erros', fixed_count, error_count)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. EXECUTAR CORREÇÃO DOS USUÁRIOS EXISTENTES
SELECT fix_users_without_profiles();

-- 6. CRIAR FUNÇÃO PARA ATIVAÇÃO MANUAL MELHORADA
CREATE OR REPLACE FUNCTION manual_confirm_and_activate_user_v2(
    p_email TEXT
)
RETURNS JSON AS $$
DECLARE
    v_auth_user RECORD;
    v_profile RECORD;
    v_result JSON;
BEGIN
    -- Buscar usuário no auth.users
    SELECT * INTO v_auth_user
    FROM auth.users 
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado no auth.users'
        );
    END IF;
    
    -- Confirmar email se não estiver confirmado
    IF v_auth_user.email_confirmed_at IS NULL THEN
        UPDATE auth.users 
        SET 
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_auth_user.id;
    END IF;
    
    -- Buscar ou criar perfil
    SELECT * INTO v_profile
    FROM profiles 
    WHERE id = v_auth_user.id;
    
    IF NOT FOUND THEN
        -- Criar perfil
        INSERT INTO profiles (
            id,
            full_name,
            email,
            role,
            status,
            permissions,
            registration_type,
            registration_completed,
            created_at,
            updated_at
        ) VALUES (
            v_auth_user.id,
            COALESCE(v_auth_user.raw_user_meta_data->>'full_name', split_part(v_auth_user.email, '@', 1)),
            v_auth_user.email,
            'user',
            'active',
            '["read", "write"]'::jsonb,
            COALESCE(v_auth_user.raw_user_meta_data->>'registration_type', 'individual'),
            true,
            NOW(),
            NOW()
        );
        
        RETURN json_build_object(
            'success', true,
            'message', 'Email confirmado e perfil criado com sucesso',
            'user_id', v_auth_user.id,
            'action', 'profile_created_and_activated'
        );
    ELSE
        -- Ativar perfil existente
        UPDATE profiles 
        SET 
            status = 'active',
            registration_completed = true,
            permissions = '["read", "write"]'::jsonb,
            updated_at = NOW()
        WHERE id = v_auth_user.id;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Email confirmado e perfil ativado com sucesso',
            'user_id', v_auth_user.id,
            'action', 'profile_activated'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.handle_new_user_robust() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION fix_users_without_profiles() TO service_role;
GRANT EXECUTE ON FUNCTION manual_confirm_and_activate_user_v2(TEXT) TO service_role;

-- 8. VERIFICAÇÃO FINAL
SELECT 
    'Correção aplicada com sucesso!' as status,
    COUNT(*) as usuarios_sem_perfil
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;