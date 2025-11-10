# Guia de Instalação - Numeração Sequencial

## Passo a Passo

### 1. Aplicar a Migration no Supabase

Você tem duas opções:

#### Opção A: Via Supabase CLI (Recomendado)

```bash
# Certifique-se de estar na raiz do projeto
cd seu-projeto

# Aplicar a migration
supabase db push
```

#### Opção B: Via Dashboard do Supabase

1. Acesse o Dashboard do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase/migrations/20251110_add_sequential_document_numbers.sql`
6. Cole no editor
7. Clique em **Run** (ou pressione Ctrl+Enter)

### 2. Verificar a Instalação

Execute esta query no SQL Editor para verificar se tudo foi criado:

```sql
-- Verificar se a tabela foi criada
SELECT * FROM document_sequences LIMIT 1;

-- Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'get_next_document_number';

-- Verificar se o trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_generate_document_number';
```

Se todas as queries retornarem resultados (ou não derem erro), a instalação foi bem-sucedida!

### 3. Testar a Funcionalidade

1. Acesse sua aplicação
2. Crie um novo documento
3. Após salvar, verifique que o campo "Número" foi preenchido automaticamente com um valor como `000001`
4. Crie outro documento
5. Verifique que o número é sequencial (ex: `000002`)

### 4. Migrar Documentos Existentes (Opcional)

**⚠️ ATENÇÃO**: Este passo irá renumerar TODOS os documentos existentes. Faça backup antes!

Se você tem documentos existentes e quer renumerá-los:

1. Acesse o SQL Editor no Dashboard do Supabase
2. Copie o conteúdo do arquivo `scripts/migrate-document-numbers.sql`
3. Cole no editor
4. Clique em **Run**
5. Aguarde a mensagem de conclusão

O script irá:
- Renumerar todos os documentos por entidade
- Ordenar por data de criação (documentos mais antigos recebem números menores)
- Atualizar a tabela `document_sequences` com os últimos números usados

### 5. Verificar Resultados

Após a migração, execute:

```sql
-- Ver quantos documentos cada entidade tem
SELECT 
  e.name as entidade,
  ds.last_number as ultimo_numero_usado,
  COUNT(d.id) as total_documentos
FROM document_sequences ds
JOIN entities e ON e.id = ds.entity_id
LEFT JOIN documents d ON d.entity_id = ds.entity_id
GROUP BY e.name, ds.last_number
ORDER BY e.name;

-- Ver alguns documentos com seus novos números
SELECT 
  document_number,
  title,
  created_at
FROM documents
WHERE entity_id IS NOT NULL
ORDER BY document_number
LIMIT 10;
```

## Troubleshooting

### Erro: "relation document_sequences does not exist"

A migration não foi aplicada. Volte ao Passo 1.

### Erro: "function get_next_document_number does not exist"

A migration foi aplicada parcialmente. Execute novamente o SQL da migration.

### Documentos não estão recebendo números

Verifique:
1. O documento tem `entity_id` definido?
2. O trigger está ativo? Execute:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_generate_document_number';
   ```

### Números duplicados

Isso não deveria acontecer devido ao `INSERT ... ON CONFLICT`. Se acontecer:
1. Verifique se há múltiplas instâncias da aplicação rodando
2. Execute:
   ```sql
   -- Resetar sequências baseado nos números existentes
   UPDATE document_sequences ds
   SET last_number = (
     SELECT COALESCE(MAX(CAST(document_number AS INTEGER)), 0)
     FROM documents
     WHERE entity_id = ds.entity_id
     AND document_number ~ '^[0-9]+$'
   );
   ```

## Rollback

Se precisar reverter:

```sql
-- Remover trigger
DROP TRIGGER IF EXISTS trigger_generate_document_number ON documents;

-- Remover funções
DROP FUNCTION IF EXISTS generate_document_number();
DROP FUNCTION IF EXISTS get_next_document_number(UUID);

-- Remover tabela
DROP TABLE IF EXISTS document_sequences;
```

Depois, reverta os commits no código da aplicação.

## Suporte

Consulte a documentação completa em: `docs/NUMERACAO_SEQUENCIAL_DOCUMENTOS.md`
