-- 📝 SQL para adicionar campo title na tabela document_signatures

-- 1. Adicionar coluna title na tabela document_signatures
ALTER TABLE public.document_signatures 
ADD COLUMN title TEXT;

-- 2. Comentário na coluna para documentação
COMMENT ON COLUMN public.document_signatures.title IS 'Título do documento assinado';

-- 3. Atualizar registros existentes com títulos baseados no signature_url
-- Extrair nome do arquivo da URL de assinatura
UPDATE public.document_signatures 
SET title = CASE 
    WHEN signature_url IS NOT NULL THEN 
        -- Extrair nome do arquivo da URL de assinatura
        REGEXP_REPLACE(
            REGEXP_REPLACE(signature_url, '^.*/', ''), -- Remove path
            '\\.(pdf|PDF)$', '', 'g' -- Remove extensão
        )
    WHEN arqsign_document_id IS NOT NULL THEN 
        -- Usar ID do documento como fallback
        'Documento ' || arqsign_document_id
    ELSE 
        'Documento sem título'
END
WHERE title IS NULL;

-- 4. Verificar resultados
SELECT 
    id,
    title,
    signature_url,
    arqsign_document_id,
    status,
    created_at
FROM public.document_signatures 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Estatísticas após atualização
SELECT 
    COUNT(*) as total_signatures,
    COUNT(title) as signatures_with_title,
    COUNT(*) - COUNT(title) as signatures_without_title
FROM public.document_signatures;