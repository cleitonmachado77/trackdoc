-- ============================================================================
-- FORÇAR DESABILITAÇÃO COMPLETA DA CRIAÇÃO DE PERFIS
-- ============================================================================

-- 1. REMOVER TRIGGER COMPLETAMENTE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. REMOVER FUNÇÃO SE NECESSÁRIO (OPCIONAL)
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. VERIFICAR SE FOI REMOVIDO
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        )
        THEN '❌ TRIGGER AINDA ATIVO - PERFIS SERÃO CRIADOS AUTOMATICAMENTE'
        ELSE '✅ TRIGGER REMOVIDO - PERFIS NÃO SERÃO CRIADOS AUTOMATICAMENTE'
    END as status_trigger;

-- 4. LIMPAR QUALQUER PERFIL ÓRFÃO EXISTENTE
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 5. VERIFICAR USUÁRIOS SEM PERFIL
SELECT 
    COUNT(*) as usuarios_sem_perfil,
    'Usuários autenticados mas sem perfil (serão bloqueados)' as descricao
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- 6. LISTAR USUÁRIOS SEM PERFIL (PARA DEBUG)
SELECT 
    u.id,
    u.email,
    u.created_at,
    'SEM PERFIL - SERÁ BLOQUEADO' as status
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ORDER BY u.created_at DESC;