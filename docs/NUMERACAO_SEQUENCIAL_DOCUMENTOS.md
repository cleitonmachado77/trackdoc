# Numeração Sequencial de Documentos

## Visão Geral

O sistema foi atualizado para gerar números de identificação sequenciais para documentos, substituindo o formato anterior `PREFIX-ANO-XXX` por um formato numérico simples com 6 dígitos: `000001`, `000002`, `000003`, etc.

## Mudanças Implementadas

### 1. Banco de Dados

#### Nova Tabela: `document_sequences`
Controla a sequência de numeração por entidade:
- `entity_id`: Referência à entidade
- `last_number`: Último número usado
- Cada entidade tem sua própria sequência independente

#### Função: `get_next_document_number(p_entity_id UUID)`
- Retorna o próximo número sequencial para uma entidade
- Thread-safe: usa `INSERT ... ON CONFLICT` para evitar duplicatas
- Incrementa automaticamente o contador

#### Trigger: `generate_document_number()`
- Executado automaticamente ao inserir um novo documento
- Gera o `document_number` no formato `000001`, `000002`, etc.
- Só gera se o documento tiver `entity_id` e não tiver `document_number` já definido

### 2. Código da Aplicação

#### Hooks (`hooks/use-documents.ts`)
- Removida a geração manual de `document_number`
- O número é gerado automaticamente pelo banco ao inserir o documento
- O campo `document_number` retornado pelo banco é usado diretamente

#### Componentes
- **`document-editor.tsx`**: Removida função `getNextDocumentNumber()`
- **`document-modal.tsx`**: Removida função `getNextDocumentNumber()` e useEffect relacionado
- Ambos agora mostram mensagem "Será gerado automaticamente" antes de salvar

## Como Aplicar as Mudanças

### 1. Aplicar Migration

Execute a migration no Supabase:

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor no Dashboard do Supabase
# Cole o conteúdo de: supabase/migrations/20251110_add_sequential_document_numbers.sql
```

### 2. Migrar Documentos Existentes (Opcional)

Se você tem documentos existentes e quer renumerá-los sequencialmente:

```bash
# Execute o script via SQL Editor no Dashboard do Supabase
# Cole o conteúdo de: scripts/migrate-document-numbers.sql
```

**Atenção**: Este script irá renumerar TODOS os documentos existentes. Faça backup antes!

### 3. Testar

1. Crie um novo documento
2. Verifique que o `document_number` foi gerado automaticamente
3. Crie outro documento da mesma entidade
4. Verifique que o número é sequencial (ex: se o primeiro foi `000001`, o segundo será `000002`)

## Formato dos Números

- **Formato**: 6 dígitos com zeros à esquerda
- **Exemplos**: `000001`, `000002`, `000123`, `001234`, `999999`
- **Sequência**: Independente por entidade
- **Reinício**: Não reinicia por ano ou tipo de documento

## Vantagens

1. **Simplicidade**: Números fáceis de ler e lembrar
2. **Unicidade**: Cada documento tem um número único dentro da entidade
3. **Automático**: Não requer lógica no frontend
4. **Thread-safe**: Evita duplicatas mesmo com múltiplas inserções simultâneas
5. **Escalável**: Suporta até 999.999 documentos por entidade

## Comportamento Especial

- **Documentos sem entidade**: Não recebem número automático (campo fica vazio)
- **Número manual**: Se você fornecer um `document_number` ao criar o documento, ele será mantido
- **Sequência por entidade**: Cada entidade tem sua própria sequência independente

## Rollback

Se precisar reverter as mudanças:

```sql
-- 1. Remover trigger
DROP TRIGGER IF EXISTS trigger_generate_document_number ON documents;

-- 2. Remover funções
DROP FUNCTION IF EXISTS generate_document_number();
DROP FUNCTION IF EXISTS get_next_document_number(UUID);

-- 3. Remover tabela
DROP TABLE IF EXISTS document_sequences;
```

## Suporte

Para dúvidas ou problemas, consulte:
- Migration: `supabase/migrations/20251110_add_sequential_document_numbers.sql`
- Script de migração: `scripts/migrate-document-numbers.sql`
- Hook principal: `hooks/use-documents.ts`
