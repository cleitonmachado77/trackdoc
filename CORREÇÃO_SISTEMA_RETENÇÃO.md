# Correção do Sistema de Retenção de Documentos

## Problemas Identificados

### 1. Documentos não são atualizados quando tipo de documento muda
**Problema**: Quando você altera a configuração de retenção de um tipo de documento (por exemplo, de 24 meses para 0 meses), os documentos existentes desse tipo não são atualizados automaticamente. Eles continuam com a configuração antiga.

**Causa**: Não havia um trigger no banco de dados para sincronizar os documentos quando um tipo de documento é alterado.

### 2. Documentos sem tipo ficam bloqueados para exclusão
**Problema**: Documentos que não estão associados a nenhum tipo de documento ficam bloqueados para exclusão, mesmo não tendo restrições de retenção.

**Causa**: A lógica de retenção não considerava documentos sem tipo de documento associado.

### 3. Documentos com retention_period = 0 ainda ficam bloqueados
**Problema**: Mesmo quando um documento tem `retention_period = 0` (sem retenção), ele ainda fica bloqueado para exclusão.

**Causa**: A lógica no frontend não verificava corretamente quando `retention_period = 0`.

## Soluções Implementadas

### 1. Trigger para Atualização Automática
Criado um trigger `trigger_update_documents_on_type_change` que:
- Monitora alterações na tabela `document_types`
- Quando `retention_period` ou `approval_required` são alterados
- Atualiza automaticamente todos os documentos desse tipo
- Recalcula a `retention_end_date` baseada no novo período

### 2. Correção de Documentos Sem Tipo
- Documentos sem `document_type_id` agora têm `retention_period = 0`
- Isso os libera para exclusão imediata
- `retention_end_date` é definida como `NULL`

### 3. Lógica de Retenção Corrigida
Atualizada a lógica no `hooks/use-documents.ts`:
- Documentos sem tipo podem ser excluídos
- Documentos com `retention_period = 0` podem ser excluídos
- Documentos com `retention_period = null` podem ser excluídos

### 4. Sincronização de Documentos Existentes
- Todos os documentos existentes foram sincronizados com seus tipos
- Documentos órfãos (sem tipo) foram liberados para exclusão
- Datas de retenção foram recalculadas corretamente

## Como Aplicar a Correção

### Opção 1: Executar SQL Diretamente (Recomendado)
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o arquivo `scripts/apply-retention-fix.sql`

### Opção 2: Executar Migração
1. Execute a migração: `supabase/migrations/20251029_fix_document_retention_logic.sql`

## Verificação da Correção

Após aplicar a correção, você pode verificar se funcionou:

```sql
-- Verificar estatísticas dos documentos
SELECT 
  COUNT(*) as total_documentos,
  COUNT(CASE WHEN document_type_id IS NOT NULL THEN 1 END) as com_tipo,
  COUNT(CASE WHEN document_type_id IS NULL THEN 1 END) as sem_tipo,
  COUNT(CASE WHEN retention_period > 0 THEN 1 END) as com_retencao,
  COUNT(CASE WHEN retention_period = 0 OR retention_period IS NULL THEN 1 END) as sem_retencao
FROM documents;

-- Verificar se trigger foi criado
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_documents_on_type_change';
```

## Teste da Funcionalidade

Para testar se a correção funcionou:

1. **Teste de Tipo de Documento**:
   - Altere o período de retenção de um tipo de documento
   - Verifique se os documentos desse tipo foram atualizados automaticamente

2. **Teste de Documentos Sem Tipo**:
   - Verifique se documentos sem tipo agora podem ser excluídos
   - Eles devem aparecer com botão de exclusão habilitado

3. **Teste de Retenção Zero**:
   - Configure um tipo com `retention_period = 0`
   - Documentos desse tipo devem poder ser excluídos imediatamente

## Arquivos Modificados

- `supabase/migrations/20251029_fix_document_retention_logic.sql` - Nova migração
- `hooks/use-documents.ts` - Lógica de retenção corrigida
- `scripts/apply-retention-fix.sql` - Script SQL para aplicação manual
- `scripts/fix-document-retention.js` - Script Node.js (alternativo)

## Impacto

✅ **Positivo**:
- Sistema de retenção agora funciona corretamente
- Documentos são atualizados automaticamente quando tipos mudam
- Documentos sem tipo podem ser excluídos
- Performance melhorada com novos índices

⚠️ **Atenção**:
- Documentos que antes estavam "protegidos" por bug agora podem ser excluídos
- Verifique se há documentos importantes que precisam de backup antes da aplicação

## Monitoramento

Após a aplicação, monitore:
- Logs do Supabase para verificar se o trigger está funcionando
- Comportamento da exclusão de documentos na interface
- Performance das consultas de documentos