-- ============================================================================
-- TESTE RÁPIDO - Verificar se correções funcionaram
-- ============================================================================

-- 1. Verificar usuário órfão
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = '1e4799e6-d473-4ffd-ad43-fb669af58be5') 
        THEN '✅ Usuário órfão CORRIGIDO' 
        ELSE '❌ Usuário ainda órfão' 
    END as status_usuario;

-- 2. Verificar políticas RLS
SELECT COUNT(*) as total_politicas FROM pg_policies WHERE schemaname = 'public';

-- 3. Verificar função get_entity_stats
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_entity_stats')
        THEN '✅ Função get_entity_stats existe'
        ELSE '❌ Função get_entity_stats não existe'
    END as status_funcao;

-- 4. Testar consulta básica de profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- 5. Testar consulta básica de documents
SELECT COUNT(*) as total_documents FROM documents;