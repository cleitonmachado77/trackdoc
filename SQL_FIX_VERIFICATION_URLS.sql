-- 📝 SQL para corrigir URLs de verificação com localhost
-- Este script atualiza os links de verificação que ainda apontam para localhost

-- 1. Verificar quantos registros têm localhost na verification_url
SELECT 
    COUNT(*) as total_with_localhost,
    COUNT(CASE WHEN verification_url LIKE '%localhost%' THEN 1 END) as with_localhost_url
FROM public.document_signatures 
WHERE verification_url IS NOT NULL;

-- 2. Mostrar exemplos de URLs com localhost
SELECT 
    id,
    title,
    verification_code,
    verification_url,
    created_at
FROM public.document_signatures 
WHERE verification_url LIKE '%localhost%'
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Atualizar URLs de verificação substituindo localhost pela URL de produção
UPDATE public.document_signatures 
SET verification_url = REPLACE(verification_url, 'http://localhost:3000', 'https://trackdoc.com.br')
WHERE verification_url LIKE '%localhost:3000%';

-- 4. Atualizar qr_code_data substituindo localhost pela URL de produção
UPDATE public.document_signatures 
SET qr_code_data = REPLACE(qr_code_data, 'http://localhost:3000', 'https://trackdoc.com.br')
WHERE qr_code_data LIKE '%localhost:3000%';

-- 5. Verificar se as atualizações foram aplicadas
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN verification_url LIKE '%localhost%' THEN 1 END) as still_with_localhost,
    COUNT(CASE WHEN verification_url LIKE '%trackdoc.com.br%' THEN 1 END) as with_production_url
FROM public.document_signatures 
WHERE verification_url IS NOT NULL;

-- 6. Mostrar exemplos de URLs corrigidas
SELECT 
    id,
    title,
    verification_code,
    verification_url,
    created_at
FROM public.document_signatures 
WHERE verification_url LIKE '%trackdoc.com.br%'
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Verificar se há outros campos que podem conter localhost
SELECT 
    'signature_url' as field_name,
    COUNT(*) as records_with_localhost
FROM public.document_signatures 
WHERE signature_url LIKE '%localhost%'

UNION ALL

SELECT 
    'qr_code_data' as field_name,
    COUNT(*) as records_with_localhost
FROM public.document_signatures 
WHERE qr_code_data LIKE '%localhost%';