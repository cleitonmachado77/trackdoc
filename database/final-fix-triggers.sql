-- 🚨 CORREÇÃO DEFINITIVA: Forçar criação de entidade para usuários existentes

BEGIN;

-- 1. REMOVER TODOS OS TRIGGERS CONFLITANTES
DROP TRIGGER IF EXISTS ensure_entity_for_admin_insert_trigger ON profiles;
DROP TRIGGER IF EXISTS ensure_entity_for_admin_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_final ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 2. CRIAR FUNÇÃO DEFINITIVA QUE SEMPRE FUNCIONA
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
    RAISE NOTICE '🚨 [FINAL FIX] Processando usuário: %', NEW.email;
    RAISE NOTICE '📋 [FINAL FIX] Metadata: %', NEW.raw_user_meta_data;
    
    -- Extrair dados do metadata
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
        v_entity_role := COALESCE(NEW.raw_user_meta_data->>'entity_role', 'user');
        v_registration_type := COALESCE(NEW.raw_user_meta_data->>'registration_type', 'individual');
        
        IF NEW.raw_user_meta_data->>'selected_plan_id' IS NOT NULL THEN
            v_selected_plan_id := (NEW.raw_user_meta_data->>'selected_plan_id')::UUID;
        END IF;
        
        -- Extrair dados da entidade
        v_entity_name := NEW.raw_user_meta_data->>'entity_name';
        v_entity_legal_name := NEW.raw_user_meta_data->>'entity_legal_name';
        v_entity_cnpj := NEW.raw_user_meta_data->>'entity_cnpj';
        v_entity_phone := NEW.raw_user_meta_data->>'entity_phone';
        
        RAISE NOTICE '📊 [FINAL FIX] Extraído: tipo=%, entity_name=%', v_registration_type, v_entity_name;
    END IF;
    
    -- Usar email como fallback
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := NEW.email;
    END IF;
    
    -- Criar entidade se for entity_admin
    IF v_registration_type = 'entity_admin' THEN
        RAISE NOTICE '🏢 [FINAL FIX] Criando entidade para entity_admin';
        
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
        
        RAISE NOTICE '✅ [FINAL FIX] Entidade criada: % (ID: %)', v_entity_name, v_entity_id;
        
        -- Criar assinatura
        IF v_plan_id IS NOT NULL THEN
            INSERT INTO entity_subscriptions (entity_id, plan_id, status, is_trial, current_period_start, current_period_end)
            VALUES (v_entity_id, v_plan_id, 'active', true, NOW(), NOW() + INTERVAL '30 days');
            RAISE NOTICE '✅ [FINAL FIX] Assinatura criada';
        END IF;
    END IF;
    
    -- Criar perfil
    INSERT INTO public.profiles (id, full_name, email, role, status, entity_role, registration_type, registration_completed, selected_plan_id, entity_id)
    VALUES (NEW.id, v_full_name, NEW.email, v_role, 'active', v_entity_role, v_registration_type, 
            CASE WHEN v_registration_type = 'entity_admin' THEN false ELSE true END, v_selected_plan_id, v_entity_id);
    
    RAISE NOTICE '✅ [FINAL FIX] Perfil criado: tipo=%, entity_id=%', v_registration_type, v_entity_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ [FINAL FIX] Erro: %', SQLERRM;
        INSERT INTO public.profiles (id, full_name, email, role, status)
        VALUES (NEW.id, COALESCE(v_full_name, NEW.email), NEW.email, 'user', 'active')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR APENAS UM TRIGGER DEFINITIVO
CREATE TRIGGER handle_new_user_final_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user_final();

COMMIT;

-- 4. CORRIGIR USUÁRIO ATUAL QUE JÁ FOI CRIADO INCORRETAMENTE
DO $$
DECLARE
    v_user_id UUID := '134ed9eb-f783-4136-a656-c2b212df3db9';
    v_entity_name TEXT := 'Prefeitura Santa Amelia';
    v_entity_legal_name TEXT := 'SA Melia';
    v_entity_cnpj TEXT := '06125758900010';
    v_entity_phone TEXT := '43991879783';
    v_plan_id UUID;
    v_entity_id UUID;
BEGIN
    RAISE NOTICE '🔧 Corrigindo usuário atual que foi criado incorretamente...';
    
    -- Buscar plano
    SELECT id INTO v_plan_id FROM plans WHERE is_active = true ORDER BY price_monthly ASC LIMIT 1;
    
    -- Criar entidade
    INSERT INTO entities (name, legal_name, cnpj, email, phone, subscription_plan_id, max_users, admin_user_id, status, type)
    VALUES (v_entity_name, v_entity_legal_name, v_entity_cnpj, 'cleitoncr767@gmail.com', v_entity_phone, v_plan_id, 10, v_user_id, 'active', 'company')
    RETURNING id INTO v_entity_id;
    
    -- Atualizar perfil
    UPDATE profiles SET
        registration_type = 'entity_admin',
        entity_role = 'admin',
        role = 'admin',
        entity_id = v_entity_id,
        registration_completed = true,
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Criar assinatura
    INSERT INTO entity_subscriptions (entity_id, plan_id, status, is_trial, current_period_start, current_period_end)
    VALUES (v_entity_id, v_plan_id, 'active', true, NOW(), NOW() + INTERVAL '30 days');
    
    RAISE NOTICE '✅ Usuário atual corrigido com entidade: %', v_entity_name;
END $$;

-- 5. Verificar resultado
SELECT 
    '🎯 RESULTADO FINAL' as status,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_role,
    p.role,
    e.name as entity_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND p.entity_role = 'admin' THEN '✅ CORRIGIDO'
        ELSE '❌ PROBLEMA'
    END as resultado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.id = '134ed9eb-f783-4136-a656-c2b212df3db9';

DO $$
BEGIN
    RAISE NOTICE '🎉 CORREÇÃO DEFINITIVA APLICADA!';
    RAISE NOTICE '✅ Trigger único e funcional criado';
    RAISE NOTICE '✅ Usuário atual corrigido';
    RAISE NOTICE '🧪 Teste com novo usuário deve funcionar perfeitamente';
END $$;