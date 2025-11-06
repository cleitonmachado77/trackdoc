-- ========================================
-- CORREÇÃO FINAL - STATUS INATIVO ATÉ CONFIRMAÇÃO
-- ========================================

-- PROBLEMA: Trigger criava perfis 'active' imediatamente
-- SOLUÇÃO: Criar perfis 'inactive' até confirmação do email

-- 1. CORRIGIR FUNÇÃO PARA CRIAR PERFIS INATIVOS
CREATE OR REPLACE FUNCTION public.handle_new_user_robust()
RETURNS TRIGGER AS $$
DECLARE
    user_full_name TEXT;
    user_registration_type TEXT;
    initial_status TEXT;
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
    
    -- Determinar status inicial baseado na confirmação de email
    IF NEW.email_confirmed_at IS NOT NULL THEN
        initial_status := 'active';
    ELSE
        initial_status := 'inactive';  -- Inativo até confirmação
    END IF;
    
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
            initial_status,
            CASE 
                WHEN initial_status = 'active' THEN '["read", "write"]'::jsonb
                ELSE '[]'::jsonb  -- Sem permissões até confirmação
            END,
            user_registration_type,
            CASE 
                WHEN initial_status = 'active' THEN true
                ELSE false  -- Registro incompleto até confirmação
            END,
            NOW(),
            NOW()
        );
        
        -- Log de sucesso
        RAISE NOTICE 'Perfil criado com status % para usuário: %', initial_status, NEW.email;
        
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

-- 2. CRIAR TRIGGER PARA ATIVAR QUANDO EMAIL FOR CONFIRMADO
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o email foi confirmado (mudou de NULL para uma data)
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        -- Ativar perfil correspondente
        UPDATE public.profiles 
        SET 
            status = 'active',
            registration_completed = true,
            permissions = '["read", "write"]'::jsonb,
            updated_at = NOW()
        WHERE id = NEW.id AND status = 'inactive';
        
        RAISE NOTICE 'Perfil ativado após confirmação de email para: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR TRIGGER PARA CONFIRMAÇÃO DE EMAIL
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
CREATE TRIGGER handle_email_confirmation_trigger
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_email_confirmation();

-- 4. CORRIGIR USUÁRIOS EXISTENTES QUE ESTÃO ATIVOS SEM CONFIRMAÇÃO
UPDATE public.profiles 
SET 
    status = 'inactive',
    registration_completed = false,
    permissions = '[]'::jsonb,
    updated_at = NOW()
WHERE id IN (
    SELECT p.id 
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.status = 'active' 
    AND u.email_confirmed_at IS NULL
);

-- 5. ATIVAR USUÁRIOS QUE JÁ CONFIRMARAM EMAIL MAS ESTÃO INATIVOS
UPDATE public.profiles 
SET 
    status = 'active',
    registration_completed = true,
    permissions = '["read", "write"]'::jsonb,
    updated_at = NOW()
WHERE id IN (
    SELECT p.id 
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.status = 'inactive' 
    AND u.email_confirmed_at IS NOT NULL
);

-- 6. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.handle_new_user_robust() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO authenticated, service_role;

-- 7. VERIFICAÇÃO FINAL
SELECT 
    'Correção aplicada com sucesso!' as status,
    COUNT(CASE WHEN p.status = 'inactive' AND u.email_confirmed_at IS NULL THEN 1 END) as usuarios_inativos_aguardando_confirmacao,
    COUNT(CASE WHEN p.status = 'active' AND u.email_confirmed_at IS NOT NULL THEN 1 END) as usuarios_ativos_confirmados,
    COUNT(CASE WHEN p.status = 'active' AND u.email_confirmed_at IS NULL THEN 1 END) as usuarios_ativos_sem_confirmacao_ERRO
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;