-- Adicionar colunas que estão faltando na tabela documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retention_period INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS retention_end_date TIMESTAMP WITH TIME ZONE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_documents_approval_required 
ON public.documents (approval_required) 
WHERE approval_required = true;

CREATE INDEX IF NOT EXISTS idx_documents_retention_end_date 
ON public.documents (retention_end_date) 
WHERE retention_end_date IS NOT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN public.documents.approval_required 
IS 'Indica se o documento requer aprovação antes de ser publicado';

COMMENT ON COLUMN public.documents.retention_period 
IS 'Período de retenção do documento em meses';

COMMENT ON COLUMN public.documents.retention_end_date 
IS 'Data de expiração do documento baseada no período de retenção';

-- Atualizar documentos existentes baseado no tipo de documento
UPDATE public.documents 
SET approval_required = COALESCE(
  (SELECT dt.approval_required 
   FROM document_types dt 
   WHERE dt.id = documents.document_type_id), 
  false
),
retention_period = COALESCE(
  (SELECT dt.retention_period 
   FROM document_types dt 
   WHERE dt.id = documents.document_type_id), 
  24
)
WHERE approval_required IS NULL OR retention_period IS NULL;