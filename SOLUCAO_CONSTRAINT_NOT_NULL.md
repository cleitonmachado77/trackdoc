# 🔧 SOLUÇÃO - Constraint NOT NULL em documents.author_id

## ❌ NOVO PROBLEMA IDENTIFICADO

Após tentar executar o script de limpeza, encontramos outro erro:

```
ERROR: 23502: null value in column "author_id" of relation "documents" violates not-null constraint
```

### 🔍 **CAUSA RAIZ:**
A coluna `documents.author_id` tem uma constraint **NOT NULL**, mas estamos tentando definir como NULL para registros órfãos.

## ✅ SOLUÇÃO CRIADA

### **Script Robusto**: `database/fix-foreign-keys-robust.sql`

Este script resolve o problema em **3 etapas**:

#### **1. Ajustar Constraints NOT NULL**
```sql
-- Remove constraint NOT NULL problemáticas
ALTER TABLE documents ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE document_versions ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE approval_requests ALTER COLUMN approver_id DROP NOT NULL;
```

#### **2. Limpar Referências Órfãs**
```sql
-- Agora pode definir como NULL sem erro
UPDATE documents 
SET author_id = NULL
WHERE author_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = author_id);
```

#### **3. Aplicar Foreign Keys**
```sql
-- Criar foreign keys com ON DELETE SET NULL
ALTER TABLE documents 
ADD CONSTRAINT documents_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
```

## 🚀 COMO EXECUTAR

### **SOLUÇÃO COMPLETA (Recomendada):**
```sql
-- Execute este script robusto que resolve tudo
\i database/fix-foreign-keys-robust.sql
```

### **OU copie e cole o conteúdo no Supabase SQL Editor**

## 📊 BENEFÍCIOS DA SOLUÇÃO ROBUSTA

### ✅ **Flexibilidade:**
- `author_id` pode ser NULL (documentos sem autor definido)
- `approver_id` pode ser NULL (aprovações sem aprovador)
- Preserva dados importantes

### ✅ **Integridade:**
- Foreign keys funcionando corretamente
- Cascatas configuradas adequadamente
- Referências sempre válidas

### ✅ **Robustez:**
- Trata constraints NOT NULL automaticamente
- Verifica existência de tabelas antes de alterar
- Relatórios detalhados do processo

## 🎯 O QUE ACONTECERÁ

### **Constraints Removidas:**
- `documents.author_id` NOT NULL → pode ser NULL
- `document_versions.author_id` NOT NULL → pode ser NULL  
- `approval_requests.approver_id` NOT NULL → pode ser NULL

### **Dados Preservados:**
- Documentos mantidos (author_id vira NULL se órfão)
- Versões de documentos mantidas
- Logs de auditoria mantidos

### **Dados Limpos:**
- Assinaturas órfãs removidas
- Conversas de chat órfãs removidas
- Participantes de chat órfãos removidos

## 📋 APÓS EXECUÇÃO

### **Verificar Resultado:**
```sql
\i database/test-after-fix.sql
```

### **Testar Criação de Usuários:**
1. Acesse `/register`
2. Crie usuário individual
3. Crie usuário de entidade
4. Confirme que login funciona

---

**Status**: ✅ Solução robusta criada  
**Próxima ação**: Executar `database/fix-foreign-keys-robust.sql`