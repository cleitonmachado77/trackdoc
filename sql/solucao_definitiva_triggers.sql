-- ========================================
-- SOLUÇÃO DEFINITIVA - LIMPAR TRIGGERS CONFLITANTES
-- ========================================

-- PROBLEMA: Múltiplos triggers conflitantes na tabela auth.users
-- SOLUÇÃO: Remover todos e criar um único trigger funcional

-- 1. REMOVER TODOS OS TRIGGERS PROBLEMÁTICOS
DROP TRIGGER IF EXISTS handle_new_user_simple_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
DROP TRIGGER IF EXISTS trigger_auto_activate_on_email_confirm ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. REMOVER FUNÇÕES ANTIGAS PROBLEMÁTICAS
DROP FUNCTION IF EXISTS handle_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS auto_activate_confirmed_users() CASCADE;

-- 3. CRIAR FUNÇÃO ÚNICA E ROBUSTA
CREATE OR REPLACE FUNCTION handle_new_user_definitive()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_entity_id UUID;
    v_entity_role TEXT;
    v_registration_type TEXT;
BEGIN
    -- Log para debug
    RAISE NOTICE 'Processando usuário: %', NEW.email;
    
    -- Extrair dados dos metadados
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_entity_id := NULLIF(NEW.raw_user_meta_data->>'entity_id', '')::UUID;
    v_entity_role := COALESCE(NEW.raw_user_meta_data->>'entity_role', 'user');
    v_registration_type := COALESCE(NEW.raw_user_meta_data->>'registration_type', 'individual');
    
    -- Verificar se perfil já existe (evitar duplicatas)
    IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        RAISE NOTICE 'Perfil já existe para usuário: %', NEW.email;
        RETURN NEW;
    END IF;
    
    -- Criar perfil
    INSERT INTO profiles (
        id,
        full_name,
        email,
        role,
        status,
        permissions,
        entity_id,
        entity_role,
        registration_type,
        registration_completed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        'user',
        CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'
            ELSE 'inactive'
        END,
        '["read", "write"]'::jsonb,
        v_entity_id,
        v_entity_role,
        v_registration_type,
        CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN true
            ELSE false
        END,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Perfil criado com sucesso para: %', NEW.email;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, apenas logar e continuar
        RAISE WARNING 'Erro ao criar perfil para %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR FUNÇÃO PARA ATIVAÇÃO AUTOMÁTICA NA CONFIRMAÇÃO
CREATE OR REPLACE FUNCTION handle_email_confirmation_definitive()
RETURNS TRIGGER AS $$
BEGIN
    -- Só processar se o email foi confirmado agora
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        
        RAISE NOTICE 'Email confirmado para usuário: %', NEW.email;
        
        -- Ativar perfil
        UPDATE profiles 
        SET 
            status = 'active',
            registration_completed = true,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Perfil ativado para usuário: %', NEW.email;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, apenas logar e continuar
        RAISE WARNING 'Erro ao ativar perfil para %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CRIAR TRIGGERS ÚNICOS E FUNCIONAIS
CREATE TRIGGER handle_new_user_definitive_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_definitive();

CREATE TRIGGER handle_email_confirmation_definitive_trigger
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_email_confirmation_definitive();

-- 6. VERIFICAÇÃO
SELECT 'Triggers limpos e recriados com sucesso!' as status;

-- Verificar triggers ativos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;