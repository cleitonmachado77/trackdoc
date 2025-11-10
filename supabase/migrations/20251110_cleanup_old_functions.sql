-- Script de limpeza: Remover todas as versões antigas da função generate_document_number
-- Execute este script ANTES da migration principal

-- 1. Remover trigger se existir
DROP TRIGGER IF EXISTS trigger_generate_document_number ON documents;

-- 2. Listar e remover todas as versões da função generate_document_number
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'generate_document_number'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_record.func_signature);
        RAISE NOTICE 'Removida função: %', func_record.func_signature;
    END LOOP;
END $$;

-- 3. Verificar se foi removido
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'generate_document_number'
AND n.nspname = 'public';

-- Se a query acima não retornar nenhuma linha, a limpeza foi bem-sucedida
