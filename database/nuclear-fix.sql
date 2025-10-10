-- 🚨 CORREÇÃO NUCLEAR: Substituir função antiga completamente

BEGIN;

-- 1. SUBSTITUIR a função handle_new_user original
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
    v_has_entity_data BOOLEAN := false;
BEGIN
    RAISE NOTICE '🚨 [NUCLEAR FIX] FUNÇÃO SUBSTITUÍDA EXECUTANDO para: %', NEW.email;
    RAISE NOTICE '📋 [NUCLEAR FIX] Metadata: %', NEW.raw_user_meta_data;
    
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
        
        RAISE NOTICE '📊 [NUCLEAR FIX] Dados extraídos: tipo=%, entity_name=%', v_registration_type, v_entity_name;
        
        -- FALLBACK: Detectar se tem dados de entidade
        IF (v_entity_name IS NOT NULL AND v_entity_name != '') OR 
           (v_entity_legal_name IS NOT NULL AND v_entity_legal_name != '') OR
           (v_entity_cnpj IS NOT NULL AND v_entity_cnpj != '') THEN
            v_has_entity_data := true;
            v_registration_type := 'entity_admin';
            v_role := 'admin';
            v_entity_role := 'admin';
            RAISE NOTICE '🔧 [NUCLEAR FIX] DETECTADOS dados de entidade! Corrigindo tipo.';
        END IF;
    END IF;
    
    -- Usar email como fallback
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := NEW.email;
    END IF;
    
    RAISE NOTICE '🎯 [NUCLEAR FIX] Processando: Tipo=%, Nome=%, EntityName=%', 
                 v_registration_type, v_full_name, v_entity_name;
    
    -- Criar entidade se necessário
    IF v_registration_type = 'entity_admin' OR v_has_entity_data THEN
        RAISE NOTICE '🏢 [NUCLEAR FIX] Criando entidade com nome: %', v_entity_name;
        
        -- Buscar plano
        IF v_selected_plan_id IS NOT NULL THEN
            v_plan_id := v_selected_plan_id;
        ELSE
            SELECT id INTO v_plan_id FROM plans WHERE is_active = true ORDER BY price_monthly ASC LIMIT 1;
        END IF;
        
        -- Nomes da entidade (usar dados do formulário)
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
        
        RAISE NOTICE '✅ [NUCLEAR FIX] Entidade criada: % (ID: %)', v_entity_name, v_entity_id;
        
        -- Criar assinatura
        IF v_plan_id IS NOT NULL THEN
            INSERT INTO entity_subscriptions (entity_id, plan_id, status, is_trial, current_period_start, current_period_end)
            VALUES (v_entity_id, v_plan_id, 'active', true, NOW(), NOW() + INTERVAL '30 days');
            RAISE NOTICE '✅ [NUCLEAR FIX] Assinatura criada';
        END IF;
    END IF;
    
    -- Criar perfil
    INSERT INTO public.profiles (id, full_name, email, role, status, entity_role, registration_type, registration_completed, selected_plan_id, entity_id)
    VALUES (NEW.id, v_full_name, NEW.email, v_role, 'active', v_entity_role, v_registration_type, 
            CASE WHEN v_registration_type = 'entity_admin' THEN false ELSE true END, v_selected_plan_id, v_entity_id);
    
    RAISE NOTICE '✅ [NUCLEAR FIX] Perfil criado: Tipo=%, Role=%, EntityID=%', v_registration_type, v_role, v_entity_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ [NUCLEAR FIX] Erro: %', SQLERRM;
        INSERT INTO public.profiles (id, full_name, email, role, status)
        VALUES (NEW.id, COALESCE(v_full_name, NEW.email), NEW.email, 'user', 'active')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Confirmar
DO $$
BEGIN
    RAISE NOTICE '🚨 CORREÇÃO NUCLEAR APLICADA!';
    RAISE NOTICE '✅ Função handle_new_user SUBSTITUÍDA completamente';
    RAISE NOTICE '🧪 Teste registrando nova entidade - deve funcionar agora!';
END $$;