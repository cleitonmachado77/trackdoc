-- 🔧 CORREÇÃO: Fluxo de confirmação de email
-- Este script corrige o problema onde confirmar email não atualiza registration_completed

BEGIN;

-- 1. Função para detectar confirmação de email e atualizar perfil
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Detectar quando email_confirmed_at muda de NULL para uma data
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        
        RAISE NOTICE '📧 Email confirmado para usuário: %', NEW.email;
        
        -- Atualizar o perfil correspondente
        UPDATE profiles 
        SET registration_completed = true,
            updated_at = NOW()
        WHERE id = NEW.id 
        AND registration_completed = false;
        
        RAISE NOTICE '✅ Perfil atualizado para usuário: %', NEW.email;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao processar confirmação de email para %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger na tabela auth.users
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
CREATE TRIGGER handle_email_confirmation_trigger
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_email_confirmation();

-- 3. Corrigir usuários que já confirmaram email mas têm registration_completed = false
UPDATE profiles 
SET registration_completed = true,
    updated_at = NOW()
WHERE id IN (
    SELECT p.id 
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE u.email_confirmed_at IS NOT NULL 
    AND p.registration_completed = false
);

COMMIT;

-- 4. Verificar resultado para o usuário atual
SELECT 
    '🎯 VERIFICAÇÃO APÓS CORREÇÃO' as status,
    p.id,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_role,
    p.entity_id,
    p.registration_completed,
    u.email_confirmed_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL AND p.registration_completed = true THEN '✅ EMAIL CONFIRMADO E PERFIL ATUALIZADO'
        WHEN u.email_confirmed_at IS NOT NULL AND p.registration_completed = false THEN '⚠️ EMAIL CONFIRMADO MAS PERFIL NÃO ATUALIZADO'
        WHEN u.email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO'
        ELSE '❓ ESTADO DESCONHECIDO'
    END as status_confirmacao
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = 'be6dab15-d410-4b20-abe8-810f36cc2660';

-- 5. Verificar se há entidade criada
SELECT 
    '🏢 VERIFICAÇÃO DE ENTIDADE' as status,
    COUNT(*) as total_entidades,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ENTIDADE EXISTE'
        ELSE '❌ NENHUMA ENTIDADE CRIADA'
    END as resultado
FROM entities 
WHERE admin_user_id = 'be6dab15-d410-4b20-abe8-810f36cc2660';