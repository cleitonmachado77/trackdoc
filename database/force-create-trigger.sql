-- 🔧 FORÇAR CRIAÇÃO: Trigger handle_new_user na tabela auth.users

BEGIN;

-- 1. Verificar se temos permissão para criar trigger em auth.users
DO $$
BEGIN
    -- Tentar criar a função primeiro
    RAISE NOTICE '🔧 Criando função handle_new_user...';
END $$;

-- 2. Recriar função handle_new_user (versão simplificada para teste)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_role TEXT := 'user';
    v_entity_role TEXT := 'user';
    v_registration_type TEXT := 'individual';
    v_selected_plan_id UUID := NULL;
    v_entity_name TEXT;
    v_entity_legal_name TEXT;
    v_entity_cnpj TEXT;
    v_entity_phone TEXT;
    v_entity_id UUID;
    v_plan_id UUID;
BEGIN
    -- Log para debug
    RAISE NOTICE '🔄 [handle_new_user] Processando usuário: % com metadata: %', NEW.email, NEW.raw_user_meta_data;
    
    -- Extrair dados do metadata
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
        v_entity_role := COALESCE(NEW.raw_user_meta_data->>'entity_role', 'user');
        v_registration_type := COALESCE(NEW.raw_user_meta_data->>'registration_type', 'individual');
        
        IF NEW.raw_user_meta_data->>'selected_plan_id' IS NOT NULL THEN
            v_selected_plan_id := (NEW.raw_user_meta_data->>'selected_plan_id')::UUID;
        END IF;
        
        -- Dados da entidade
        IF v_registration_type = 'entity_admin' THEN
            v_entity_name := NEW.raw_user_meta_data->>'entity_name';
            v_entity_legal_name := NEW.raw_user_meta_data->>'entity_legal_name';
            v_entity_cnpj := NEW.raw_user_meta_data->>'entity_cnpj';
            v_entity_phone := NEW.raw_user_meta_data->>'entity_phone';
            
            RAISE NOTICE '🏢 [handle_new_user] Criando entidade: %', v_entity_name;
        END IF;
    END IF;
    
    -- Usar email como fallback
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := NEW.email;
    END IF;
    
    RAISE NOTICE '📋 [handle_new_user] Dados: Nome=%, Role=%, Tipo=%', v_full_name, v_role, v_registration_type;
    
    -- Criar entidade se necessário
    IF v_registration_type = 'entity_admin' THEN
        -- Buscar plano
        IF v_selected_plan_id IS NOT NULL THEN
            v_plan_id := v_selected_plan_id;
        ELSE
            SELECT id INTO v_plan_id FROM plans WHERE is_active = true ORDER BY price_monthly ASC LIMIT 1;
        END IF;
        
        -- Nomes padrão
        IF v_entity_name IS NULL OR v_entity_name = '' THEN
            v_entity_name := 'Empresa de ' || v_full_name;
        END IF;
        IF v_entity_legal_name IS NULL OR v_entity_legal_name = '' THEN
            v_entity_legal_name := v_entity_name || ' ME';
        END IF;
        
        -- Criar entidade
        INSERT INTO entities (name, legal_name, cnpj, email, phone, subscription_plan_id, max_users, admin_user_id, status, type)
        VALUES (v_entity_name, v_entity_legal_name, v_entity_cnpj, NEW.email, v_entity_phone, v_plan_id, 10, NEW.id, 'active', 'company')
        RETURNING id INTO v_entity_id;
        
        RAISE NOTICE '✅ [handle_new_user] Entidade criada: % (ID: %)', v_entity_name, v_entity_id;
        
        -- Criar assinatura
        IF v_plan_id IS NOT NULL THEN
            INSERT INTO entity_subscriptions (entity_id, plan_id, status, is_trial, current_period_start, current_period_end)
            VALUES (v_entity_id, v_plan_id, 'active', true, NOW(), NOW() + INTERVAL '30 days');
        END IF;
    END IF;
    
    -- Criar perfil
    INSERT INTO public.profiles (id, full_name, email, role, status, entity_role, registration_type, registration_completed, selected_plan_id, entity_id)
    VALUES (NEW.id, v_full_name, NEW.email, v_role, 'active', v_entity_role, v_registration_type, 
            CASE WHEN v_registration_type = 'entity_admin' THEN false ELSE true END, v_selected_plan_id, v_entity_id);
    
    RAISE NOTICE '✅ [handle_new_user] Perfil criado para: %', NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ [handle_new_user] Erro para %: %', NEW.email, SQLERRM;
        -- Criar perfil básico em caso de erro
        INSERT INTO public.profiles (id, full_name, email, role, status)
        VALUES (NEW.id, COALESCE(v_full_name, NEW.email), NEW.email, 'user', 'active')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tentar criar trigger (pode falhar por permissões)
DO $$
BEGIN
    -- Remover trigger existente
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Criar novo trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW 
        EXECUTE FUNCTION public.handle_new_user();
        
    RAISE NOTICE '✅ Trigger criado com sucesso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Erro ao criar trigger: %', SQLERRM;
        RAISE NOTICE '⚠️ Pode ser problema de permissão na tabela auth.users';
END $$;

COMMIT;

-- 4. Verificar se funcionou
SELECT 
    '🔍 VERIFICAÇÃO FINAL' as status,
    COUNT(*) as triggers_criados
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Se não funcionou, mostrar alternativa
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created';
    
    IF trigger_count = 0 THEN
        RAISE NOTICE '❌ Trigger não foi criado - problema de permissão';
        RAISE NOTICE '🔧 SOLUÇÃO ALTERNATIVA: Usar API route para criar perfil+entidade';
        RAISE NOTICE '📋 Ou executar como superuser/service_role';
    ELSE
        RAISE NOTICE '✅ Trigger criado com sucesso!';
        RAISE NOTICE '🧪 Teste registrando novo usuário';
    END IF;
END $$;