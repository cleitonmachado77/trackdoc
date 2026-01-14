-- Script SQL para atualizar templates de assinatura
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Atualizar o valor padrão da coluna para novos registros
ALTER TABLE public.signature_templates 
ALTER COLUMN custom_text 
SET DEFAULT 'Este documento foi assinado digitalmente e pode ser verificado em www.trackdoc.com.br.';

-- PASSO 2: Atualizar todos os registros existentes que ainda usam o texto antigo
UPDATE public.signature_templates 
SET 
  custom_text = 'Este documento foi assinado digitalmente e pode ser verificado em www.trackdoc.com.br.',
  updated_at = NOW()
WHERE custom_text = 'Este documento foi assinado digitalmente com certificado válido.';

-- PASSO 3: Verificar quantos registros foram atualizados
SELECT 
  COUNT(*) as total_templates,
  COUNT(CASE WHEN custom_text = 'Este documento foi assinado digitalmente e pode ser verificado em www.trackdoc.com.br.' THEN 1 END) as templates_with_new_text,
  COUNT(CASE WHEN custom_text = 'Este documento foi assinado digitalmente com certificado válido.' THEN 1 END) as templates_with_old_text
FROM public.signature_templates;

-- PASSO 4: Mostrar alguns exemplos dos templates atualizados
SELECT 
  id,
  user_id,
  custom_text,
  updated_at
FROM public.signature_templates 
WHERE custom_text = 'Este documento foi assinado digitalmente e pode ser verificado em www.trackdoc.com.br.'
LIMIT 5;