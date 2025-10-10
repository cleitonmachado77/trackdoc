# 🚀 GUIA DE EXECUÇÃO - Correções de Banco e Usuários

## ❌ ERROS CORRIGIDOS

Os erros SQL que você encontrou foram corrigidos:

1. **Erro de sintaxe `RAISE NOTICE`** - Movido para dentro de blocos `DO $$`
2. **Erro de coluna `referenced_table_name`** - Corrigido para usar `constraint_column_usage`

## ✅ ARQUIVOS CORRIGIDOS CRIADOS

### **Scripts SQL Corrigidos:**
- ✅ `database/fix-profiles-structure-minimal.sql` - Versão mínima sem backup
- ✅ `database/fix-foreign-keys-clean-unused.sql` - **Remove tabelas não utilizadas**
- ✅ `database/fix-foreign-keys-complete.sql` - Versão completa com relatórios
- ✅ `database/fix-foreign-keys-robust.sql` - Versão robusta
- ✅ `database/test-after-fix.sql` - Script para testar após correções

### **Script de Teste Corrigido:**
- ✅ `scripts/test-database-connection.js` - Corrigido para evitar colunas inexistentes

## 🎯 COMO EXECUTAR AS CORREÇÕES

### **Passo 1: Testar Conexão**
```bash
node scripts/test-database-connection.js
```

### **Passo 2: Executar Scripts SQL Corrigidos**

**OPÇÃO A - Limpa tabelas não utilizadas (RECOMENDADA para seu caso):**
```sql
-- 1. Corrigir estrutura da tabela profiles
\i database/fix-profiles-structure-minimal.sql

-- 2. Correção com limpeza de tabelas não utilizadas (workflows)
\i database/fix-foreign-keys-clean-unused.sql
```

**OPÇÃO B - Manual com backup:**
```sql
-- 1. Corrigir estrutura da tabela profiles (com backup)
\i database/fix-profiles-structure-simple.sql

-- 2. Limpar referências órfãs
\i database/cleanup-orphaned-references.sql

-- 3. Corrigir foreign keys
\i database/fix-foreign-keys-simple.sql
```

**OPÇÃO C - Desenvolvimento (sem backup):**
```sql
-- 1. Corrigir estrutura da tabela profiles
\i database/fix-profiles-structure-minimal.sql

-- 2. Limpar referências órfãs
\i database/cleanup-orphaned-references.sql

-- 3. Corrigir foreign keys
\i database/fix-foreign-keys-simple.sql
```

### **Passo 3: Verificar Resultados**
```bash
# Testar conexão
node scripts/test-database-connection.js
```

**OU executar teste SQL:**
```sql
-- Executar script de teste
\i database/test-after-fix.sql
```

### **Passo 4: Testar Criação de Usuários**
1. Acesse `/register`
2. Teste criação de usuário individual
3. Teste criação de usuário de entidade
4. Verifique processo de confirmação de email

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

### **1. Backup (Opcional mas Recomendado)**
```sql
-- Fazer backup da tabela profiles atual
CREATE TABLE profiles_backup_manual AS SELECT * FROM profiles;
```

### **2. Executar Correção da Estrutura**
```sql
-- Executar todo o conteúdo de fix-profiles-structure-simple.sql
```

### **3. Executar Correção das Foreign Keys**
```sql  
-- Executar todo o conteúdo de fix-foreign-keys-simple.sql
```

### **4. Verificar Integridade**
```sql
-- Verificar se a tabela foi criada corretamente
SELECT COUNT(*) FROM profiles;

-- Verificar se o trigger existe
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Verificar algumas foreign keys
SELECT constraint_name FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('documents', 'chat_messages', 'audit_logs');
```

## 🔧 PRINCIPAIS MUDANÇAS

### **Tabela Profiles:**
- ✅ ID agora referencia corretamente `auth.users(id)`
- ✅ Campos padronizados com CHECKs
- ✅ Índices otimizados
- ✅ RLS configurado

### **Trigger handle_new_user:**
- ✅ Extrai metadata corretamente
- ✅ Suporta diferentes tipos de usuário
- ✅ Não falha se houver erro (EXCEPTION)
- ✅ Configura `registration_completed` adequadamente

### **Foreign Keys:**
- ✅ Todas padronizadas para `profiles(id)`
- ✅ Cascatas configuradas adequadamente
- ✅ Integridade referencial garantida

## 🎯 BENEFÍCIOS APÓS EXECUÇÃO

### ✅ **Criação de Usuários Funcionando:**
- Usuários individuais criados automaticamente
- Usuários de entidade com setup guiado
- Perfis criados pelo trigger sem conflitos

### ✅ **Integridade de Dados:**
- Foreign keys consistentes
- Referências válidas
- Cascatas funcionando

### ✅ **Código Simplificado:**
- Registro mais robusto
- Menos pontos de falha
- Melhor experiência do usuário

## 🚨 TROUBLESHOOTING

### **Se der erro de permissão:**
```sql
-- Executar como superuser ou service role
SET ROLE postgres;
-- ou usar SUPABASE_SERVICE_ROLE_KEY
```

### **Se alguma tabela não existir:**
```sql
-- Verificar quais tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Se der erro de constraint:**
```sql
-- Remover constraint problemática manualmente
ALTER TABLE nome_tabela DROP CONSTRAINT IF EXISTS nome_constraint;
```

## 📞 PRÓXIMOS PASSOS APÓS EXECUÇÃO

1. **Testar registro de usuário individual**
2. **Testar registro de usuário de entidade**  
3. **Verificar login funcionando**
4. **Testar confirmação de email**
5. **Verificar criação automática de perfis**

---

**Status**: ✅ Scripts corrigidos e prontos para execução  
**Próxima ação**: Executar os scripts SQL simplificados no banco