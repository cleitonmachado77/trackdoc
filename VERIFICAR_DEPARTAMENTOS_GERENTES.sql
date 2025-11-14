-- Script para verificar problemas com departamentos e gerentes
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os departamentos e seus gerentes
SELECT 
  d.id,
  d.name as departamento,
  d.manager_id,
  p.full_name as gerente_nome,
  p.email as gerente_email,
  d.status,
  d.entity_id,
  CASE 
    WHEN d.manager_id IS NULL THEN '❌ SEM GERENTE'
    WHEN p.id IS NULL THEN '⚠️ GERENTE NÃO ENCONTRADO'
    ELSE '✅ OK'
  END as status_gerente
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
ORDER BY d.name;

-- 2. Departamentos com manager_id mas sem gerente encontrado
SELECT 
  d.id,
  d.name as departamento,
  d.manager_id,
  '⚠️ PROBLEMA: manager_id existe mas usuário não encontrado' as problema
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
WHERE d.manager_id IS NOT NULL 
  AND p.id IS NULL;

-- 3. Departamentos sem gerente atribuído
SELECT 
  d.id,
  d.name as departamento,
  d.status,
  '⚠️ PROBLEMA: Departamento sem gerente' as problema
FROM departments d
WHERE d.manager_id IS NULL;

-- 4. Verificar se há problemas com a foreign key
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage
WHERE constraint_name = 'departments_manager_id_fkey';

-- 5. Contar departamentos por status de gerente
SELECT 
  CASE 
    WHEN d.manager_id IS NULL THEN 'Sem gerente'
    WHEN p.id IS NULL THEN 'Gerente não encontrado'
    ELSE 'Com gerente'
  END as categoria,
  COUNT(*) as quantidade
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
GROUP BY categoria;

-- 6. Verificar políticas RLS da tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 7. Verificar se há usuários duplicados ou com problemas
SELECT 
  p.id,
  p.full_name,
  p.email,
  COUNT(d.id) as departamentos_gerenciados
FROM profiles p
LEFT JOIN departments d ON p.id = d.manager_id
GROUP BY p.id, p.full_name, p.email
HAVING COUNT(d.id) > 0
ORDER BY departamentos_gerenciados DESC;
