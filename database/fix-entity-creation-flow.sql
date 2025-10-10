-- 🔧 CORREÇÃO: Fluxo de criação de entidade
-- Este script corrige o fluxo para que entidades sejam criadas automaticamente

BEGIN;

-- 1. Função melhorada para criar entidade quando necessário
CREATE OR REPLACE FUNCTION public.ensure_entity_for_admin()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id UUID;
    v_entity_id UUID;
    v_entity_name TEXT;
    v_entity_legal_name TEXT;
BEGIN
    -- Só executar para usuários entity_admin que não têm entidade
    IF NEW.registration_type = 'entity_admin' AND NEW.entity_id IS NULL THEN
        
        RAISE NOTICE '🏢 Criando entidade automaticamente para: %', NEW.email;
        
        -- Buscar plano padrão (mais barato)
        SELECT id INTO v_plan_id 
        FROM plans 
        WHERE is_active = true 
        ORDER BY price_monthly ASC 
        LIMIT 1;
        
        IF v_plan_id IS NULL THEN
            RAISE WARNING 'Nenhum plano ativo encontrado';
            RETURN NEW;
        END IF;
        
        -- Definir nomes da entidade
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
            type
        ) VALUES (
            v_entity_name,
            v_entity_legal_name,
            NEW.email,
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

-- 2. Trigger que executa quando o perfil é atualizado
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
    EXECUTE FUNCTION public.ensure_entity_for_admin();

-- 3. Também criar trigger para INSERT (caso o perfil seja criado já como entity_admin)
DROP TRIGGER IF EXISTS ensure_entity_for_admin_insert_trigger ON profiles;
CREATE TRIGGER ensure_entity_for_admin_insert_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    WHEN (NEW.registration_type = 'entity_admin' AND NEW.entity_id IS NULL)
    EXECUTE FUNCTION public.ensure_entity_for_admin();

COMMIT;

-- 4. Corrigir usuários existentes que precisam de entidade
UPDATE profiles 
SET registration_completed = true,
    updated_at = NOW()
WHERE registration_type = 'entity_admin' 
AND entity_id IS NULL 
AND registration_completed = false;

-- 5. Verificar resultado
SELECT 
    '🎯 VERIFICAÇÃO FINAL' as status,
    COUNT(*) FILTER (WHERE registration_type = 'entity_admin' AND entity_id IS NOT NULL) as entidades_criadas,
    COUNT(*) FILTER (WHERE registration_type = 'entity_admin' AND entity_id IS NULL) as sem_entidade,
    COUNT(*) FILTER (WHERE registration_type = 'individual') as usuarios_individuais
FROM profiles;

-- 6. Mostrar detalhes dos usuários entity_admin
SELECT 
    p.full_name,
    p.email,
    p.registration_type,
    p.registration_completed,
    e.name as entity_name,
    CASE 
        WHEN p.entity_id IS NOT NULL THEN '✅ COM ENTIDADE'
        ELSE '❌ SEM ENTIDADE'
    END as status
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.registration_type = 'entity_admin'
ORDER BY p.created_at DESC;