-- 🔧 SQL para corrigir títulos NULL em registros existentes

-- 1. Verificar registros com título NULL
SELECT 
    id,
    signature_url,
    arqsign_document_id,
    title,
    created_at
FROM public.document_signatures 
WHERE title IS NULL
ORDER BY created_at DESC;

-- 2. Atualizar registros com título NULL baseado no signature_url
UPDATE public.document_signatures 
SET title = CASE 
    WHEN signature_url IS NOT NULL THEN 
        -- Extrair nome do arquivo da URL (remove path e extensões .pdf)
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(signature_url, '^.*/', ''), -- Remove path
                '\\.pdf\\.pdf$', '', 'gi' -- Remove .pdf.pdf duplo
            ),
            '\\.pdf$', '', 'gi' -- Remove .pdf simples
        )
    WHEN arqsign_document_id IS NOT NULL THEN 
        -- Usar ID do documento como fallback
        'Documento ' || arqsign_document_id
    ELSE 
        'Documento sem título'
END
WHERE title IS NULL;

-- 3. Corrigir especificamente o registro mencionado
UPDATE public.document_signatures 
SET title = 'signed_1760113985089_1554_UNDIME'
WHERE id = '0a2aee3a-5e32-43d1-b43a-ab942900d2e9' 
  AND signature_url = 'signed_1760113985089_1554_UNDIME.pdf.pdf'
  AND title IS NULL;

-- 4. Verificar resultados após atualização
SELECT 
    id,
    title,
    signature_url,
    arqsign_document_id,
    status,
    created_at
FROM public.document_signatures 
WHERE title IS NULL
ORDER BY created_at DESC;

-- 5. Estatísticas finais
SELECT 
    COUNT(*) as total_signatures,
    COUNT(title) as signatures_with_title,
    COUNT(*) - COUNT(title) as signatures_without_title,
    ROUND(COUNT(title) * 100.0 / COUNT(*), 2) as percentage_with_title
FROM public.document_signatures;

-- 6. Exemplos de títulos gerados
SELECT 
    title,
    signature_url,
    arqsign_document_id,
    created_at
FROM public.document_signatures 
WHERE title IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;