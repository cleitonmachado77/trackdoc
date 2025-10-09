-- ============================================================================
-- TESTE DAS CORREÇÕES DE CONSOLE
-- ============================================================================

-- 1. VERIFICAR SE O USUÁRIO ÓRFÃO FOI CORRIGIDO
SELECT 
    'Usuário órfão' as teste,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = '1e4799e6-d473-4ffd-ad43-fb669af58be5') 
        THEN 'CORRIGIDO ✅' 
        ELSE 'AINDA ÓRFÃO ❌' 
    END as status;

-- 2. VERIFICAR SINCRONIZAÇÃO ENTRE AUTH.USERS E PROFILES
SELECT 
    'Sincronização auth/profiles' as teste,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles)
        THEN 'SINCRONIZADO ✅'
        ELSE CONCAT('DESSINCRONIZADO ❌ (auth: ', (SELECT COUNT(*) FROM auth.users), ', profiles: ', (SELECT COUNT(*) FROM profiles), ')')
    END as status;

-- 3. VERIFICAR APPROVAL_REQUESTS ÓRFÃOS
SELECT 
    'Approval requests órfãos' as teste,
    CASE 
        WHEN (SELECT COUNT(*) FROM approval_requests ar WHERE ar.approver_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ar.approver_id)) = 0
        THEN 'LIMPOS ✅'
        ELSE CONCAT((SELECT COUNT(*) FROM approval_requests ar WHERE ar.approver_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ar.approver_id)), ' ÓRFÃOS ❌')
    END as status;

-- 4. VERIFICAR DEPARTMENTS COM MANAGER_ID ÓRFÃO
SELECT 
    'Departments órfãos' as teste,
    CASE 
        WHEN (SELECT COUNT(*) FROM departments d WHERE d.manager_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = d.manager_id)) = 0
        THEN 'LIMPOS ✅'
        ELSE CONCAT((SELECT COUNT(*) FROM departments d WHERE d.manager_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = d.manager_id)), ' ÓRFÃOS ❌')
    END as status;

-- 5. VERIFICAR ENTITIES COM ADMIN_USER_ID ÓRFÃO
SELECT 
    'Entities órfãs' as teste,
    CASE 
        WHEN (SELECT COUNT(*) FROM entities e WHERE e.admin_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = e.admin_user_id)) = 0
        THEN 'LIMPAS ✅'
        ELSE CONCAT((SELECT COUNT(*) FROM entities e WHERE e.admin_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = e.admin_user_id)), ' ÓRFÃS ❌')
    END as status;

-- 6. VERIFICAR FUNÇÃO GET_ENTITY_STATS
SELECT 
    'Função get_entity_stats' as teste,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_entity_stats' AND routine_schema = 'public')
        THEN 'EXISTE ✅'
        ELSE 'NÃO EXISTE ❌'
    END as status;

-- 7. VERIFICAR POLÍTICAS RLS
SELECT 
    'Políticas RLS' as teste,
    CONCAT((SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'), ' políticas ativas') as status;

-- 8. TESTAR FUNÇÃO GET_ENTITY_STATS (se existir)
SELECT 
    'Teste get_entity_stats' as teste,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_entity_stats')
        THEN 'TESTANDO...'
        ELSE 'FUNÇÃO NÃO EXISTE'
    END as status;

-- Se a função existir, testar ela
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_entity_stats') THEN
        PERFORM public.get_entity_stats();
        RAISE NOTICE 'Função get_entity_stats testada com sucesso ✅';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao testar get_entity_stats: %', SQLERRM;
END $$;

-- 9. RESUMO FINAL
SELECT 
    '=== RESUMO FINAL ===' as teste,
    CONCAT(
        'Auth users: ', (SELECT COUNT(*) FROM auth.users), 
        ' | Profiles: ', (SELECT COUNT(*) FROM profiles),
        ' | Documents: ', (SELECT COUNT(*) FROM documents),
        ' | Entities: ', (SELECT COUNT(*) FROM entities)
    ) as status;