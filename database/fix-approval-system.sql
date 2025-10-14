-- Script para corrigir o sistema de aprovações
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a foreign key de document_id existe
DO $$
BEGIN
    -- Adicionar foreign key de document_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'approval_requests_document_id_fkey'
        AND table_name = 'approval_requests'
    ) THEN
        ALTER TABLE public.approval_requests 
        ADD CONSTRAINT approval_requests_document_id_fkey 
        FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key approval_requests_document_id_fkey adicionada';
    ELSE
        RAISE NOTICE '✅ Foreign key approval_requests_document_id_fkey já existe';
    END IF;
END $$;

-- 2. Verificar se as colunas necessárias existem na tabela documents
DO $$
BEGIN
    -- Verificar se a coluna author_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'author_id'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN author_id UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ Coluna author_id adicionada à tabela documents';
    ELSE
        RAISE NOTICE '✅ Coluna author_id já existe na tabela documents';
    END IF;
    
    -- Verificar se a coluna created_by existe (para compatibilidade)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ Coluna created_by adicionada à tabela documents';
    ELSE
        RAISE NOTICE '✅ Coluna created_by já existe na tabela documents';
    END IF;
END $$;

-- 3. Atualizar as políticas RLS para approval_requests
DROP POLICY IF EXISTS "Users can view approval requests they're involved in" ON public.approval_requests;
CREATE POLICY "Users can view approval requests they're involved in" ON public.approval_requests
  FOR SELECT USING (
    approver_id = auth.uid() OR 
    document_id IN (
      SELECT id FROM public.documents 
      WHERE created_by = auth.uid() OR author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert approval requests for their documents" ON public.approval_requests;
CREATE POLICY "Users can insert approval requests for their documents" ON public.approval_requests
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT id FROM public.documents 
      WHERE created_by = auth.uid() OR author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Approvers can update their approval requests" ON public.approval_requests;
CREATE POLICY "Approvers can update their approval requests" ON public.approval_requests
  FOR UPDATE USING (approver_id = auth.uid());

-- 4. Atualizar as políticas RLS para documents para incluir aprovadores
DROP POLICY IF EXISTS "Users can view documents they're involved in" ON public.documents;
CREATE POLICY "Users can view documents they're involved in" ON public.documents
  FOR SELECT USING (
    created_by = auth.uid() OR 
    author_id = auth.uid() OR
    id IN (SELECT document_id FROM public.approval_requests WHERE approver_id = auth.uid())
  );

-- 5. Verificar se a tabela notifications tem as colunas corretas
DO $$
BEGIN
    -- Verificar se a coluna recipients existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'recipients'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN recipients TEXT[];
        RAISE NOTICE '✅ Coluna recipients adicionada à tabela notifications';
    ELSE
        RAISE NOTICE '✅ Coluna recipients já existe na tabela notifications';
    END IF;
    
    -- Verificar se a coluna channels existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'channels'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN channels TEXT[];
        RAISE NOTICE '✅ Coluna channels adicionada à tabela notifications';
    ELSE
        RAISE NOTICE '✅ Coluna channels já existe na tabela notifications';
    END IF;
    
    -- Verificar se a coluna status existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE '✅ Coluna status adicionada à tabela notifications';
    ELSE
        RAISE NOTICE '✅ Coluna status já existe na tabela notifications';
    END IF;
    
    -- Verificar se a coluna priority existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
        RAISE NOTICE '✅ Coluna priority adicionada à tabela notifications';
    ELSE
        RAISE NOTICE '✅ Coluna priority já existe na tabela notifications';
    END IF;
    
    -- Verificar se a coluna created_by existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ Coluna created_by adicionada à tabela notifications';
    ELSE
        RAISE NOTICE '✅ Coluna created_by já existe na tabela notifications';
    END IF;
END $$;

-- 6. Criar função para enviar notificações de aprovação
CREATE OR REPLACE FUNCTION notify_approval_request()
RETURNS TRIGGER AS $$
DECLARE
    doc_title TEXT;
    doc_author_email TEXT;
    approver_email TEXT;
    approver_name TEXT;
BEGIN
    -- Buscar informações do documento
    SELECT d.title, p.email INTO doc_title, doc_author_email
    FROM documents d
    JOIN profiles p ON (d.author_id = p.id OR d.created_by = p.id)
    WHERE d.id = NEW.document_id;
    
    -- Buscar informações do aprovador
    SELECT p.email, p.full_name INTO approver_email, approver_name
    FROM profiles p
    WHERE p.id = NEW.approver_id;
    
    -- Inserir notificação para o aprovador
    IF approver_email IS NOT NULL THEN
        INSERT INTO notifications (
            title,
            message,
            type,
            priority,
            recipients,
            channels,
            status,
            created_by,
            user_id
        ) VALUES (
            'Documento pendente de aprovação',
            'O documento "' || COALESCE(doc_title, 'Sem título') || '" foi enviado para sua aprovação.',
            'warning',
            'high',
            ARRAY[approver_email],
            ARRAY['email'],
            'sent',
            (SELECT author_id FROM documents WHERE id = NEW.document_id),
            NEW.approver_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para notificações automáticas
DROP TRIGGER IF EXISTS trigger_notify_approval_request ON approval_requests;
CREATE TRIGGER trigger_notify_approval_request
    AFTER INSERT ON approval_requests
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_approval_request();

-- 8. Criar função para notificar quando aprovação é processada
CREATE OR REPLACE FUNCTION notify_approval_processed()
RETURNS TRIGGER AS $$
DECLARE
    doc_title TEXT;
    doc_author_id UUID;
    doc_author_email TEXT;
    approver_name TEXT;
BEGIN
    -- Só processar se o status mudou para approved ou rejected
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        -- Buscar informações do documento
        SELECT d.title, COALESCE(d.author_id, d.created_by), p.email 
        INTO doc_title, doc_author_id, doc_author_email
        FROM documents d
        LEFT JOIN profiles p ON (COALESCE(d.author_id, d.created_by) = p.id)
        WHERE d.id = NEW.document_id;
        
        -- Buscar nome do aprovador
        SELECT p.full_name INTO approver_name
        FROM profiles p
        WHERE p.id = NEW.approver_id;
        
        -- Inserir notificação para o autor
        IF doc_author_email IS NOT NULL THEN
            INSERT INTO notifications (
                title,
                message,
                type,
                priority,
                recipients,
                channels,
                status,
                created_by,
                user_id
            ) VALUES (
                CASE WHEN NEW.status = 'approved' THEN 'Documento Aprovado' ELSE 'Documento Rejeitado' END,
                'Seu documento "' || COALESCE(doc_title, 'Sem título') || '" foi ' || 
                CASE WHEN NEW.status = 'approved' THEN 'aprovado' ELSE 'rejeitado' END ||
                ' por ' || COALESCE(approver_name, 'Aprovador') ||
                CASE WHEN NEW.comments IS NOT NULL THEN '. Comentários: ' || NEW.comments ELSE '.' END,
                CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END,
                CASE WHEN NEW.status = 'approved' THEN 'medium' ELSE 'high' END,
                ARRAY[doc_author_email],
                ARRAY['email'],
                'sent',
                NEW.approver_id,
                doc_author_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar trigger para notificar processamento de aprovação
DROP TRIGGER IF EXISTS trigger_notify_approval_processed ON approval_requests;
CREATE TRIGGER trigger_notify_approval_processed
    AFTER UPDATE ON approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_approval_processed();

-- 10. Verificar dados de teste
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DO SISTEMA DE APROVAÇÕES ===';
    
    -- Contar approval_requests
    RAISE NOTICE 'Total de approval_requests: %', (SELECT COUNT(*) FROM approval_requests);
    RAISE NOTICE 'Approval_requests pendentes: %', (SELECT COUNT(*) FROM approval_requests WHERE status = 'pending');
    
    -- Contar documentos
    RAISE NOTICE 'Total de documentos: %', (SELECT COUNT(*) FROM documents);
    RAISE NOTICE 'Documentos pending_approval: %', (SELECT COUNT(*) FROM documents WHERE status = 'pending_approval');
    
    -- Contar notificações
    RAISE NOTICE 'Total de notificações: %', (SELECT COUNT(*) FROM notifications);
    
    -- Contar profiles
    RAISE NOTICE 'Total de profiles: %', (SELECT COUNT(*) FROM profiles);
    
    RAISE NOTICE '=== FIM DA VERIFICAÇÃO ===';
END $$;

RAISE NOTICE '✅ Sistema de aprovações corrigido com sucesso!';