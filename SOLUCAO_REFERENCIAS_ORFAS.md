# 🔧 SOLUÇÃO - Referências Órfãs no Banco de Dados

## ❌ PROBLEMA IDENTIFICADO

Após executar o primeiro script (`fix-profiles-structure-minimal.sql`), o segundo script (`fix-foreign-keys-simple.sql`) falhou com o erro:

```
ERROR: 23503: insert or update on table "document_signatures" violates foreign key constraint "document_signatures_user_id_fkey"
DETAIL: Key (user_id)=(1e4799e6-d473-4ffd-ad43-fb669af58be5) is not present in table "profiles".
```

### 🔍 **CAUSA RAIZ:**
1. A tabela `profiles` foi **recriada do zero** (sem dados antigos)
2. Outras tabelas ainda têm **referências para usuários que não existem mais**
3. Ao tentar criar foreign keys, o PostgreSQL detecta essas **referências órfãs**

## ✅ SOLUÇÕES CRIADAS

### **Solução 1: Script de Limpeza Separado**
**Arquivo**: `database/cleanup-orphaned-references.sql`
- ✅ Remove registros órfãos de todas as tabelas
- ✅ Relatórios detalhados do que foi limpo
- ✅ Preserva dados importantes (define como NULL em vez de deletar)

### **Solução 2: Script Combinado (RECOMENDADA)**
**Arquivo**: `database/fix-foreign-keys-with-cleanup.sql`
- ✅ Limpa referências órfãs automaticamente
- ✅ Aplica foreign keys em seguida
- ✅ Processo em uma única execução

## 🚀 COMO RESOLVER AGORA

### **OPÇÃO RÁPIDA (Recomendada):**
```sql
-- Execute apenas este script (já inclui limpeza)
\i database/fix-foreign-keys-with-cleanup.sql
```

### **OPÇÃO DETALHADA:**
```sql
-- 1. Primeiro limpe as referências órfãs
\i database/cleanup-orphaned-references.sql

-- 2. Depois aplique as foreign keys
\i database/fix-foreign-keys-simple.sql
```

### **VERIFICAR RESULTADO:**
```sql
-- Testar se tudo funcionou
\i database/test-after-fix.sql
```

## 📊 O QUE SERÁ LIMPO

### **Registros Removidos:**
- `document_signatures` com user_id inexistente
- `multi_signature_approvals` com user_id inexistente  
- `multi_signature_requests` com requester_id inexistente
- `chat_conversations` órfãs (e mensagens relacionadas)
- `chat_messages` órfãs

### **Campos Definidos como NULL:**
- `entities.admin_user_id` órfãos
- `documents.author_id` órfãos
- `audit_logs.user_id` órfãos

## 🎯 BENEFÍCIOS DA LIMPEZA

### ✅ **Integridade de Dados:**
- Remove referências inválidas
- Garante consistência do banco
- Evita erros futuros

### ✅ **Performance:**
- Remove dados desnecessários
- Otimiza consultas
- Reduz tamanho do banco

### ✅ **Manutenibilidade:**
- Foreign keys funcionando corretamente
- Cascatas configuradas
- Estrutura limpa e consistente

## 🚨 IMPORTANTE

### **Dados Preservados:**
- Documentos são mantidos (apenas author_id vira NULL)
- Logs de auditoria são mantidos (apenas user_id vira NULL)
- Entidades são mantidas (apenas admin_user_id vira NULL)

### **Dados Removidos:**
- Assinaturas de documentos órfãs
- Conversas de chat órfãs
- Mensagens de chat órfãs

## 📋 PRÓXIMOS PASSOS

1. **Execute o script de limpeza:**
   ```sql
   \i database/fix-foreign-keys-with-cleanup.sql
   ```

2. **Verifique o resultado:**
   ```sql
   \i database/test-after-fix.sql
   ```

3. **Teste criação de usuários:**
   - Acesse `/register`
   - Crie usuário individual
   - Crie usuário de entidade

4. **Confirme que tudo funciona:**
   - Login funcionando
   - Perfis sendo criados automaticamente
   - Sem erros de foreign key

---

**Status**: ✅ Soluções criadas e prontas para execução  
**Próxima ação**: Executar `database/fix-foreign-keys-with-cleanup.sql`