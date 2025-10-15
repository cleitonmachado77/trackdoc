-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- Habilitar RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas logs de sua entidade
CREATE POLICY "Users can view audit logs from their entity" ON audit_logs
    FOR SELECT USING (
        entity_id IN (
            SELECT entity_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para permitir que usuários insiram logs
CREATE POLICY "Users can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        entity_id IN (
            SELECT entity_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política para administradores da entidade
CREATE POLICY "Entity admins can view all logs" ON audit_logs
    FOR SELECT USING (
        entity_id IN (
            SELECT entity_id FROM profiles 
            WHERE id = auth.uid() 
            AND (entity_role = 'admin' OR role = 'admin')
        )
    );

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Tabela para armazenar logs de auditoria de todas as atividades do sistema';
COMMENT ON COLUMN audit_logs.action IS 'Descrição da ação realizada';
COMMENT ON COLUMN audit_logs.user_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID da entidade onde a ação foi realizada';
COMMENT ON COLUMN audit_logs.resource_type IS 'Tipo do recurso afetado (document, user, approval, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID do recurso específico afetado';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes adicionais da ação em formato JSON';
COMMENT ON COLUMN audit_logs.severity IS 'Nível de severidade do log (info, success, warning, error)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Endereço IP de onde a ação foi realizada';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent do navegador usado';