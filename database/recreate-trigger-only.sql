-- 🔧 RECRIAR APENAS O TRIGGER (após reset)

-- 1. Verificar se trigger existe
SELECT 
    '🔍 TRIGGER STATUS' as status,
    COUNT(*) as triggers_ativos
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user_final_trigger'
AND event_object_schema = 'auth'
AND event_object_table = 'users';

-- 2. Recriar função e trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_final()
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
    RAISE NOTICE '🚨 [TRIGGER RECRIADO] Processando: %', NEW.email;
    RAISE NOTICE '📋 [TRIGGER RECRIADO] Metadata: %', NEW.raw_user_meta_data;
    
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
        v_entity_name := NEW.raw_user_meta_data->>'entity_name';
        v_entity_legal_name := NEW.raw_user_meta_data->>'entity_legal_name';
        v_entity_cnpj := NEW.raw_user_meta_data->>'entity_cnpj';
        v_entity_phone := NEW.raw_user_meta_data->>'entity_phone';
        
        RAISE NOTICE '📊 [TRIGGER RECRIADO] Tipo: %, Entity: %', v_registration_type, v_entity_name;
    END IF;
    
    -- Fallback para nome
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := NEW.email;
    END IF;
    
    -- Criar entidade se entity_admin
    IF v_registration_type = 'entity_admin' THEN
        RAISE NOTICE '🏢 [TRIGGER RECRIADO] Criando entidade...';
        
        -- Buscar plano
        IF v_selected_plan_id IS NOT NULL THEN
            v_plan_id := v_selected_plan_id;
        ELSE
            SELECT id INTO v_plan_id FROM plans WHERE is_active = true ORDER BY price_monthly ASC LIMIT 1;
        END IF;
        
        -- Nomes da entidade
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
        
        RAISE NOTICE '✅ [TRIGGER RECRIADO] Entidade: % (ID: %)', v_entity_name, v_entity_id;
        
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
    
    RAISE NOTICE '✅ [TRIGGER RECRIADO] Perfil: tipo=%, entity_id=%', v_registration_type, v_entity_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ [TRIGGER RECRIADO] Erro: %', SQLERRM;
        INSERT INTO public.profiles (id, full_name, email, role, status)
        VALUES (NEW.id, COALESCE(v_full_name, NEW.email), NEW.email, 'user', 'active')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar trigger
DROP TRIGGER IF EXISTS handle_new_user_final_trigger ON auth.users;
CREATE TRIGGER handle_new_user_final_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user_final();

-- 4. Verificar se foi criado
SELECT 
    '✅ TRIGGER RECRIADO' as status,
    COUNT(*) as triggers_ativos
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user_final_trigger';

DO $$
BEGIN
    RAISE NOTICE '✅ Trigger recriado com sucesso!';
    RAISE NOTICE '🧪 Agora teste registrando nova entidade';
    RAISE NOTICE '📊 Deve ver logs: [TRIGGER RECRIADO] Processando';
END $$;