-- ============================================================================
-- DESABILITAR CRIAÇÃO AUTOMÁTICA DE PERFIS
-- ============================================================================

-- 1. REMOVER TRIGGER QUE CRIA PERFIS AUTOMATICAMENTE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. MANTER A FUNÇÃO MAS NÃO EXECUTAR AUTOMATICAMENTE
-- (Pode ser útil para criação manual se necessário)
COMMENT ON FUNCTION public.handle_new_user() IS 'Função desabilitada - não cria perfis automaticamente';

-- 3. VERIFICAR SE O TRIGGER FOI REMOVIDO
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        )
        THEN '❌ Trigger ainda ativo'
        ELSE '✅ Trigger removido - perfis não serão criados automaticamente'
    END as status_trigger;