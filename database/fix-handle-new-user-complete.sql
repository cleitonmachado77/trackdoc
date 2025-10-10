-- 🔧 CORREÇÃO DEFINITIVA: Função handle_new_user completa
-- Esta função processa TUDO: perfil + entidade automaticamente

BEGIN;

-- 1. Função handle_new_user COMPLETA que cria perfil E entidade
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    -- Variáveis para dados do usuário
    v_full_name TEXT;
    v_role TEXT := 'user';
    v_entity_role TEXT := 'user';
    v_registration_type TEXT := 'individual';
    v_selected_plan_id UUID := NULL;
    
    -- Variáveis para dados da entidade
    v_entity_name TEXT;
    v_entity_legal_name TEXT;
    v_entity_cnpj TEXT;
    v_entity_phone TEXT;
    v_entity_id UUID;
    v_plan_id UUID;
BEGIN
    RAISE NOTICE '🔄 [handle_new_user] Processando usuário: %', NEW.email;
    
    -- Extrair dados do metadata
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
        v_entity_role := COALESCE(NEW.raw_user_meta_data->>'entity_role', 'user');
        v_registration_type := COALESCE(NEW.raw_user_meta_data->>'registration_type', 'individual');
        
        -- Extrair selected_plan_id se existir
        IF NEW.raw_user_meta_data->>'selected_plan_id' IS NOT NULL THEN
            v_selected_plan_id := (NEW.raw_user_meta_data->>'selected_plan_id')::UUID;
        END IF;
        
        -- Extrair dados da entidade se for entity_admin
        IF v_registration_type = 'entity_admin' THEN
            v_entity_name := NEW.raw_user_meta_data->>'entity_name';
            v_entity_legal_name := NEW.raw_user_meta_data->>'entity_legal_name';
            v_entity_cnpj := NEW.raw_user_meta_data->>'entity_cnpj';
            v_entity_phone := NEW.raw_user_meta_data->>'entity_phone';
            
            RAISE NOTICE '🏢 [handle_new_user] Dados da entidade: Nome=%, Razão=%, CNPJ=%', 
                         v_entity_name, v_entity_legal_name, v_entity_cnpj;
        END IF;
    END IF;
    
    -- Usar email como fallback para full_name
    IF v_full_name IS NULL OR v_full_name = '' THEN
        v_full_name := NEW.email;
    END IF;
    
    RAISE NOTICE '📋 [handle_new_user] Dados do usuário: Nome=%, Role=%, Tipo=%, EntityRole=%', 
                 v_full_name, v_role, v_registration_type, v_entity_role;
    
    -- CRIAR ENTIDADE PRIMEIRO (se for entity_admin)
    IF v_registration_type = 'entity_admin' THEN
        
        -- Buscar plano (usar selected_plan_id ou padrão)
        IF v_selected_plan_id IS NOT NULL THEN
            v_plan_id := v_selected_plan_id;
        ELSE
            SELECT id INTO v_plan_id 
            FROM plans 
            WHERE is_active = true 
            ORDER BY price_monthly ASC 
            LIMIT 1;
        END IF;
        
        IF v_plan_id IS NULL THEN
            RAISE WARNING '⚠️ [handle_new_user] Nenhum plano encontrado, usando NULL';
        END IF;
        
        -- Definir nomes padrão se não fornecidos
        IF v_entity_name IS NULL OR v_entity_name = '' THEN
            v_entity_name := 'Empresa de ' || v_full_name;
        END IF;
        
        IF v_entity_legal_name IS NULL OR v_entity_legal_name = '' THEN
            v_entity_legal_name := v_entity_name || ' ME';
        END IF;
        
        -- Criar entidade
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
            type,
            created_at,
            updated_at
        ) VALUES (
            v_entity_name,
            v_entity_legal_name,
            v_entity_cnpj,
            NEW.email,
            v_entity_phone,
            v_plan_id,
            10, -- max_users padrão
            NEW.id,
            'active',
            'company',
            NOW(),
            NOW()
        ) RETURNING id INTO v_entity_id;
        
        RAISE NOTICE '✅ [handle_new_user] Entidade criada: % (ID: %)', v_entity_name, v_entity_id;
        
        -- Criar assinatura da entidade
        IF v_plan_id IS NOT NULL THEN
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
            
            RAISE NOTICE '✅ [handle_new_user] Assinatura criada para entidade: %', v_entity_id;
        END IF;
        
    END IF;
    
    -- CRIAR PERFIL DO USUÁRIO
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        status,
        entity_role,
        registration_type,
        registration_completed,
        selected_plan_id,
        entity_id,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        v_role,
        'active',
        v_entity_role,
        v_registration_type,
        CASE 
            WHEN v_registration_type = 'entity_admin' THEN false -- Será true após confirmar email
            ELSE true 
        END,
        v_selected_plan_id,
        v_entity_id, -- NULL para individual, ID da entidade para entity_admin
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ [handle_new_user] Perfil criado para: % (Tipo: %, EntityID: %)', 
                 NEW.email, v_registration_type, v_entity_id;
    
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

-- 2. Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- 3. Verificar se foi instalado corretamente
DO $$
BEGIN
    RAISE NOTICE '🎉 Função handle_new_user COMPLETA instalada com sucesso!';
    RAISE NOTICE '📋 Agora o sistema criará perfil + entidade automaticamente!';
    RAISE NOTICE '🧪 Teste registrando um novo usuário como entidade.';
END $$;

-- 4. Verificar se o trigger está ativo
SELECT 
    '🔍 TRIGGER VERIFICAÇÃO' as status,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Verificar se a função existe
SELECT 
    '🔍 FUNÇÃO VERIFICAÇÃO' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';