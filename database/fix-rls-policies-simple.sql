-- ============================================================================
-- CORREÇÃO SIMPLES DAS POLÍTICAS RLS
-- ============================================================================

-- 1. POLÍTICA PERMISSIVA PARA PROFILES
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT TO authenticated
USING (true); -- Temporariamente permissivo para debug

-- 2. POLÍTICA PERMISSIVA PARA DOCUMENTS
DROP POLICY IF EXISTS "Users can view documents" ON documents;
CREATE POLICY "Users can view documents" ON documents
FOR SELECT TO authenticated
USING (true); -- Temporariamente permissivo para debug

-- 3. POLÍTICA PERMISSIVA PARA DEPARTMENTS
DROP POLICY IF EXISTS "Users can view departments" ON departments;
CREATE POLICY "Users can view departments" ON departments
FOR SELECT TO authenticated
USING (true); -- Temporariamente permissivo para debug

-- 4. POLÍTICA PERMISSIVA PARA ENTITIES
DROP POLICY IF EXISTS "Users can view entities" ON entities;
CREATE POLICY "Users can view entities" ON entities
FOR SELECT TO authenticated
USING (true); -- Temporariamente permissivo para debug

-- 5. POLÍTICA PERMISSIVA PARA CATEGORIES
DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories" ON categories
FOR SELECT TO authenticated
USING (true); -- Temporariamente permissivo para debug

-- 6. POLÍTICA PERMISSIVA PARA DOCUMENT_TYPES
DROP POLICY IF EXISTS "Users can view document_types" ON document_types;
CREATE POLICY "Users can view document_types" ON document_types
FOR SELECT TO authenticated
USING (true); -- Temporariamente permissivo para debug

-- 7. POLÍTICA PERMISSIVA PARA APPROVAL_REQUESTS
DROP POLICY IF EXISTS "Users can view approval_requests" ON approval_requests;
CREATE POLICY "Users can view approval_requests" ON approval_requests
FOR SELECT TO authenticated
USING (true); -- Temporariamente permissivo para debug

-- 8. GARANTIR PERMISSÕES BÁSICAS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 9. PERMISSÕES ESPECÍFICAS PARA TABELAS PRINCIPAIS
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON documents TO authenticated;
GRANT SELECT ON entities TO authenticated;
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON document_types TO authenticated;
GRANT SELECT ON approval_requests TO authenticated;