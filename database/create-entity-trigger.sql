-- 🔧 TRIGGER: Criar entidade automaticamente para usuários entity_admin
-- Este trigger cria a entidade quando o usuário confirma o email

BEGIN;

-- 1. Função para criar entidade automaticamente
CREATE OR REPLACE FUNCTION public.create_entity_for_admin()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id UUID;
    v_entity_id UUID;
    v_entity_name TEXT;
    v_entity_legal_name TEXT;
BEGIN
    -- Só executar para usuários entity_admin sem entidade
    IF NEW.registration_type = 'entity_admin' AND NEW.entity_id IS NULL THEN
        
        RAISE NOTICE '🏢 Criando entidade para usuário entity_admin: %', NEW.email;
        
        -- Buscar plano padrão
        SELECT id INTO v_plan_id 
        FROM plans 
        WHERE is_active = true 
        ORDER BY price_monthly ASC 
        LIMIT 1;
        
        IF v_plan_id IS NULL THEN
            RAISE WARNING 'Nenhum plano ativo encontrado para criar entidade';
            RETURN NEW;
        END IF;
        
        -- Definir nomes padrão da entidade
        v_entity_name := COALESCE(NEW.company, 'Empresa de ' || NEW.full_name, 'Minha Empresa');
        v_entity_legal_name := v_entity_name || ' ME';
        
        -- Criar entidade
        INSERT INTO entities (
            name,
            legal_name,
            email,
            subscription_plan_id,
            max_users,
            admin_user_id,
            status,
            type,
            created_at,
            updated_at
        ) VALUES (
            v_entity_name,
            v_entity_legal_name,
            NEW.email,
            v_plan_id,
            10, -- max_users padrão
            NEW.id,
            'active',
            'company',
            NOW(),
            NOW()
        ) RETURNING id INTO v_entity_id;
        
        -- Atualizar perfil com entity_id
        NEW.entity_id := v_entity_id;
        NEW.registration_completed := true;
        NEW.updated_at := NOW();
        
        RAISE NOTICE '✅ Entidade criada com ID: % para usuário: %', v_entity_id, NEW.email;
        
        -- Criar assinatura da entidade
        INSERT INTO entity_subscriptions (
            entity_id,
            plan_id,
            status,
            is_trial,
            current_period_start,
            current_period_end,
            created_at,
            updated_at
        ) VALUES (
            v_entity_id,
            v_plan_id,
            'active',
            true, -- trial
            NOW(),
            NOW() + INTERVAL '30 days',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Assinatura criada para entidade: %', v_entity_id;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar entidade para %: %', NEW.email, SQLERRM;
        RETURN NEW; -- Não falhar a atualização do perfil
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger que executa ANTES do UPDATE no profiles
DROP TRIGGER IF EXISTS create_entity_for_admin_trigger ON profiles;
CREATE TRIGGER create_entity_for_admin_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (
        NEW.registration_type = 'entity_admin' 
        AND OLD.entity_id IS NULL 
        AND NEW.entity_id IS NULL
        AND NEW.registration_completed = true
    )
    EXECUTE FUNCTION public.create_entity_for_admin();

COMMIT;

-- 3. Teste: Simular confirmação de email para usuários entity_admin existentes
DO $$
DECLARE
    user_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Procurando usuários entity_admin sem entidade...';
    
    FOR user_record IN 
        SELECT id, email, full_name, registration_type, entity_id
        FROM profiles 
        WHERE registration_type = 'entity_admin' 
        AND entity_id IS NULL
        AND registration_completed = false
    LOOP
        RAISE NOTICE '📋 Encontrado usuário: % (%)', user_record.email, user_record.id;
        
        -- Simular confirmação de email (isso vai disparar o trigger)
        UPDATE profiles 
        SET registration_completed = true,
            updated_at = NOW()
        WHERE id = user_record.id;
        
        RAISE NOTICE '✅ Processado usuário: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE '🎉 Processamento concluído!';
END $$;

-- 4. Verificar resultado
SELECT 
    '🎯 RESULTADO' as status,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_role,
    p.registration_completed,
    e.name as entity_name,
    e.legal_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND p.entity_role = 'admin' THEN '✅ ENTIDADE CRIADA'
        WHEN p.registration_type = 'entity_admin' AND p.entity_id IS NULL THEN '❌ SEM ENTIDADE'
        ELSE '➖ USUÁRIO INDIVIDUAL'
    END as resultado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.registration_type = 'entity_admin'
ORDER BY p.created_at DESC;