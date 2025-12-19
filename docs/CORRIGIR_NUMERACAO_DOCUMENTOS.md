# Correção da Numeração Sequencial de Documentos

## Problema Identificado

Os documentos estão exibindo códigos aleatórios (ex: `#TMP-001765718965`) ao invés de números sequenciais (ex: `#000001`, `#000002`).

**Causa**: As funções e triggers do banco de dados para numeração sequencial não foram aplicados.

## Solução

### 1. Aplicar Migration no Supabase

**Opção A - Via Supabase Dashboard:**
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Copie e cole o conteúdo do arquivo `scripts/apply-sequential-numbering.sql`
5. Clique em "Run" para executar

**Opção B - Via Supabase CLI (se configurado):**
```bash
supabase db push
```

### 2. Verificar se foi Aplicado Corretamente

Após executar o script, você deve ver uma saída similar a:

```
NOTICE: Entidade 12345678-1234-1234-1234-123456789012 processada: 15 documentos numerados
NOTICE: Entidade 87654321-4321-4321-4321-210987654321 processada: 8 documentos numerados

status                                    | registros
------------------------------------------|----------
Tabela document_sequences criada          | 2
Documentos com números sequenciais        | 23
Documentos sem números (entity_id nulo)   | 0
Trigger ativo                            | 1
```

### 3. Testar a Funcionalidade

1. **Teste de Criação**: Faça upload de um novo documento
2. **Verificar Número**: O documento deve receber um número sequencial (ex: `#000024`)
3. **Teste de Sequência**: Faça upload de outro documento e verifique se recebe o próximo número (`#000025`)

## O que o Script Faz

### 1. **Cria Infraestrutura**
- ✅ Tabela `document_sequences` (se não existir)
- ✅ Função `get_next_document_number()` (thread-safe)
- ✅ Função `generate_document_number()` (trigger function)
- ✅ Trigger `trigger_generate_document_number`

### 2. **Corrige Documentos Existentes**
- ✅ Atualiza documentos sem `document_number`
- ✅ Gera números sequenciais baseados na data de criação
- ✅ Atualiza tabela de sequências com último número usado
- ✅ Processa apenas documentos com `entity_id`

### 3. **Garante Funcionamento Futuro**
- ✅ Novos documentos recebem números automaticamente
- ✅ Sequência independente por entidade
- ✅ Formato: 6 dígitos com zeros à esquerda (`000001`)

## Comportamento Após Correção

### ✅ **Documentos Novos**
- Recebem número sequencial automaticamente
- Formato: `#000001`, `#000002`, `#000003`, etc.
- Cada entidade tem sua própria sequência

### ✅ **Documentos Existentes**
- Números são gerados baseados na data de criação
- Mantém ordem cronológica
- Documentos mais antigos recebem números menores

### ✅ **Documentos sem Entidade**
- Usuários individuais: não recebem número automático
- Campo `document_number` fica vazio (comportamento esperado)

## Verificação Manual

Se quiser verificar manualmente no banco:

```sql
-- Verificar documentos com números sequenciais
SELECT 
  title, 
  document_number, 
  created_at,
  entity_id
FROM documents 
WHERE document_number IS NOT NULL 
ORDER BY entity_id, document_number;

-- Verificar sequências por entidade
SELECT 
  ds.entity_id,
  e.name as entity_name,
  ds.last_number,
  ds.updated_at
FROM document_sequences ds
LEFT JOIN entities e ON ds.entity_id = e.id
ORDER BY ds.last_number DESC;

-- Verificar se trigger está ativo
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_document_number';
```

## Troubleshooting

### Problema: Script não executa
- **Causa**: Permissões insuficientes
- **Solução**: Execute como superuser ou owner do banco

### Problema: Documentos ainda sem número
- **Causa**: Documentos não têm `entity_id`
- **Solução**: Isso é esperado para usuários individuais

### Problema: Números duplicados
- **Causa**: Execução múltipla do script
- **Solução**: O script é idempotente, pode ser executado múltiplas vezes

### Problema: Trigger não funciona
- **Causa**: Erro na criação do trigger
- **Solução**: Verificar logs do Supabase e reexecutar script

## Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase Dashboard
2. Execute as queries de verificação manual
3. Reexecute o script (é seguro)
4. Entre em contato com o suporte técnico