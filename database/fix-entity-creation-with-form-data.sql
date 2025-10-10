-- 🔧 CORREÇÃO: Criar entidade com dados do formulário
-- Este script modifica o trigger para usar dados do metadata do usuário

BEGIN;

-- 1. Função melhorada que usa dados do metadata do usuário
CREATE OR REPLACE FUNCTION public.create_entity_from_user_metadata()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id UUID;
    v_entity_id UUID;
    v_entity_name TEXT;
    v_entity_legal_name TEXT;
    v_entity_cnpj TEXT;
    v_entity_phone TEXT;
    v_user_metadata JSONB;
BEGIN
    -- Só executar para usuários entity_admin que não têm entidade
    IF NEW.registration_type = 'entity_admin' AND NEW.entity_id IS NULL THEN
        
        RAISE NOTICE '🏢 Criando entidade com dados do formulário para: %', NEW.email;
        
        -- Buscar metadata do usuário no auth.users
        SELECT raw_user_meta_data INTO v_user_metadata
        FROM auth.users 
        WHERE id = NEW.id;
        
        -- Extrair dados da entidade do metadata (se existir)
        IF v_user_metadata IS NOT NULL THEN
            v_entity_name := v_user_metadata->>'entity_name';
            v_entity_legal_name := v_user_metadata->>'entity_legal_name';
            v_entity_cnpj := v_user_metadata->>'entity_cnpj';
            v_entity_phone := v_user_metadata->>'entity_phone';
            
            -- Tentar extrair selected_plan_id
            IF v_user_metadata->>'selected_plan_id' IS NOT NULL THEN
                v_plan_id := (v_user_metadata->>'selected_plan_id')::UUID;
            END IF;
        END IF;
        
        -- Usar valores padrão se não encontrar no metadata
        IF v_entity_name IS NULL OR v_entity_name = '' THEN
            v_entity_name := COALESCE(NEW.company, 'Empresa de ' || NEW.full_name, 'Minha Empresa');
        END IF;
        
        IF v_entity_legal_name IS NULL OR v_entity_legal_name = '' THEN
            v_entity_legal_name := v_entity_name || ' ME';
        END IF;
        
        -- Buscar plano padrão se não especificado
        IF v_plan_id IS NULL THEN
            SELECT id INTO v_plan_id 
            FROM plans 
            WHERE is_active = true 
            ORDER BY price_monthly ASC 
            LIMIT 1;
        END IF;
        
        IF v_plan_id IS NULL THEN
            RAISE WARNING 'Nenhum plano ativo encontrado';
            RETURN NEW;
        END IF;
        
        RAISE NOTICE '📋 Dados da entidade: Nome=%, Razão=%, CNPJ=%, Telefone=%', 
                     v_entity_name, v_entity_legal_name, v_entity_cnpj, v_entity_phone;
        
        -- Criar entidade com dados do formulário
        INSERT INTO entities (
            name,
            legal_name,
            cnpj,
            email,
            phone,
            subscription_plan_id,
            max_users,
            admin_user_id,
            status,
            type
        ) VALUES (
            v_entity_name,
            v_entity_legal_name,
            v_entity_cnpj,
            NEW.email,
            v_entity_phone,
            v_plan_id,
            10,
            NEW.id,
            'active',
            'company'
        ) RETURNING id INTO v_entity_id;
        
        -- Atualizar o perfil com a entidade
        NEW.entity_id := v_entity_id;
        NEW.registration_completed := true;
        
        RAISE NOTICE '✅ Entidade criada: % (ID: %)', v_entity_name, v_entity_id;
        
        -- Criar assinatura trial
        INSERT INTO entity_subscriptions (
            entity_id,
            plan_id,
            status,
            is_trial,
            current_period_start,
            current_period_end
        ) VALUES (
            v_entity_id,
            v_plan_id,
            'active',
            true,
            NOW(),
            NOW() + INTERVAL '30 days'
        );
        
        RAISE NOTICE '✅ Assinatura trial criada para entidade: %', v_entity_id;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar entidade para %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar triggers para usar a nova função
DROP TRIGGER IF EXISTS ensure_entity_for_admin_trigger ON profiles;
CREATE TRIGGER ensure_entity_for_admin_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (
        NEW.registration_type = 'entity_admin' 
        AND NEW.entity_id IS NULL
        AND (OLD.registration_completed = false OR OLD.registration_completed IS NULL)
        AND NEW.registration_completed = true
    )
    EXECUTE FUNCTION public.create_entity_from_user_metadata();

DROP TRIGGER IF EXISTS ensure_entity_for_admin_insert_trigger ON profiles;
CREATE TRIGGER ensure_entity_for_admin_insert_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    WHEN (NEW.registration_type = 'entity_admin' AND NEW.entity_id IS NULL)
    EXECUTE FUNCTION public.create_entity_from_user_metadata();

COMMIT;

-- 3. Teste: Verificar metadata de usuários existentes
SELECT 
    '🔍 METADATA DOS USUÁRIOS' as status,
    u.id,
    u.email,
    u.raw_user_meta_data,
    p.registration_type,
    p.entity_id
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.registration_type = 'entity_admin'
ORDER BY u.created_at DESC
LIMIT 3;