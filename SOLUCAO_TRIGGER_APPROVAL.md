# Solução para o Problema do Campo "Aprovação Obrigatória"

## 🐛 Problema Específico

**Sintoma:** Ao alterar o campo "Aprovação Obrigatória" (approval_required), a página recarrega e redireciona para o dashboard, mesmo após a correção do `revalidatePath`.

**Causa Identificada:** Existe um trigger `trigger_update_documents_on_type_change` no banco de dados que monitora alterações nos campos `retention_period` e `approval_required`. Quando `approval_required` é alterado, esse trigger executa operações que podem causar redirecionamento.

## 🔍 Análise Técnica

### Trigger Problemático:
```sql
CREATE TRIGGER trigger_update_documents_on_type_change
    AFTER UPDATE ON document_types
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_on_type_change();
```

### Comportamento:
- ✅ **retention_period:** Funciona normalmente
- ❌ **approval_required:** Causa redirecionamento

### Possível Causa:
O trigger pode estar executando operações mais complexas quando `approval_required` é alterado, possivelmente atualizando muitos documentos ou causando cascata de operações.

## ✅ Soluções Implementadas

### 1. **Proteção no Frontend**
```typescript
// Prevenir navegação durante atualização
const preventNavigation = (e: BeforeUnloadEvent) => {
  e.preventDefault()
  e.returnValue = ''
}

window.addEventListener('beforeunload', preventNavigation)

// Bloquear botão voltar do navegador
const handlePopState = (e: PopStateEvent) => {
  e.preventDefault()
  window.history.pushState(null, '', window.location.href)
}
```

### 2. **Delay para Triggers**
```typescript
// Aguardar triggers do banco terminarem
if (typeData.approvalRequired !== undefined || typeData.retentionPeriod !== undefined) {
  await new Promise(resolve => setTimeout(resolve, 200))
}
```

### 3. **Estado de Proteção**
```typescript
const [isUpdating, setIsUpdating] = useState(false)

// Usar durante operações críticas
setIsUpdating(true)
// ... operação ...
setIsUpdating(false)
```

## 🛠️ Soluções no Banco de Dados

### Opção 1: Desabilitar Trigger (Temporário)
```sql
-- CUIDADO: Isso desabilita a sincronização automática
DROP TRIGGER IF EXISTS trigger_update_documents_on_type_change ON document_types;
```

### Opção 2: Modificar Trigger (Recomendado)
```sql
-- Criar trigger mais específico que não cause problemas
CREATE OR REPLACE FUNCTION update_documents_on_type_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Só atualizar retention_period (que funciona)
    IF (OLD.retention_period IS DISTINCT FROM NEW.retention_period) THEN
        UPDATE documents 
        SET 
            retention_period = NEW.retention_period,
            retention_end_date = CASE 
                WHEN NEW.retention_period > 0 THEN 
                    created_at + (NEW.retention_period || ' months')::INTERVAL
                ELSE NULL 
            END,
            updated_at = NOW()
        WHERE document_type_id = NEW.id;
    END IF;
    
    -- Para approval_required, não fazer operações pesadas
    -- (deixar para a aplicação gerenciar)
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Opção 3: Trigger Separado
```sql
-- Criar trigger apenas para retention_period
CREATE TRIGGER trigger_update_documents_retention_only
    AFTER UPDATE OF retention_period ON document_types
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_retention_only();
```

## 🧪 Como Testar

### 1. **Teste com Proteção Frontend**
1. Ir para `/admin/document-types`
2. Editar um tipo de documento
3. Alterar "Aprovação Obrigatória"
4. Verificar se permanece na página

### 2. **Teste de Trigger (SQL)**
```sql
-- Executar no Supabase SQL Editor
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_documents_on_type_change';

-- Testar atualização manual
UPDATE document_types 
SET approval_required = NOT approval_required 
WHERE id = 'seu-tipo-id-aqui';
```

## 📋 Arquivos Modificados

### Frontend:
- ✅ `app/components/admin/document-type-management.tsx`
  - Adicionado proteção contra navegação
  - Delay para aguardar triggers
  - Estado de proteção durante atualizações

### Scripts SQL:
- ✅ `sql/investigar_trigger_approval.sql` - Investigação
- ✅ `sql/solucao_trigger_approval.sql` - Soluções para o banco

## 🎯 Recomendação

### Solução Imediata:
1. **Usar a proteção do frontend** (já implementada)
2. **Testar se resolve o problema**

### Solução Definitiva:
1. **Executar investigação SQL** para entender o trigger
2. **Modificar ou desabilitar o trigger** se necessário
3. **Implementar lógica de sincronização** na aplicação se o trigger for removido

## ⚠️ Considerações

### Se Desabilitar o Trigger:
- ✅ **Problema resolvido** imediatamente
- ❌ **Perda de sincronização** automática entre tipos e documentos
- 🔄 **Necessário implementar** sincronização manual na aplicação

### Se Manter o Trigger:
- ✅ **Sincronização automática** mantida
- ❌ **Problema pode persistir** dependendo da implementação
- 🔄 **Necessário modificar** a lógica do trigger

## 🚀 Próximos Passos

1. **Testar a proteção frontend** implementada
2. **Se ainda houver problema:** Executar investigação SQL
3. **Decidir entre:** Modificar trigger vs. Desabilitar trigger
4. **Implementar solução definitiva** no banco de dados
5. **Monitorar comportamento** após correção

## ✅ Status Atual

**PROTEÇÃO FRONTEND IMPLEMENTADA** ✅

A solução de proteção no frontend foi implementada. Se o problema persistir, será necessário intervir no trigger do banco de dados.