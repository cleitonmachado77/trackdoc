# Solução: Erro ao Adicionar Múltiplos Documentos

## Problema Identificado

O erro ocorre porque a tabela `public_library` no banco de dados está faltando a coluna `category_id`, que é necessária para a funcionalidade de categorias.

## Causa

O código TypeScript está tentando usar `category_id` (UUID), mas o schema original da tabela só tinha a coluna `category` (TEXT). A migração para adicionar `category_id` precisa ser executada.

## Solução

### Opção 1: Executar o Script Completo (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo `sql/create_library_categories.sql` completo

Este script irá:
- Criar a tabela `library_categories`
- Adicionar a coluna `category_id` à tabela `public_library`
- Criar os índices necessários
- Configurar as foreign keys

### Opção 2: Verificação e Correção Manual

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script de verificação: `sql/verify_and_fix_biblioteca.sql`
4. Siga as instruções que aparecerem no resultado

### Opção 3: Adicionar Apenas a Coluna

Se você já tem a tabela `library_categories` criada, execute apenas:

```sql
-- Adicionar coluna category_id
ALTER TABLE public.public_library 
  ADD COLUMN IF NOT EXISTS category_id UUID NULL;

-- Adicionar foreign key
ALTER TABLE public.public_library 
  ADD CONSTRAINT public_library_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES library_categories (id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_public_library_category_id 
  ON public.public_library USING btree (category_id);
```

## Verificação

Após executar a solução, verifique se funcionou:

1. Acesse a página **Biblioteca Pública > Documentos**
2. Clique em **Adicionar Múltiplos**
3. O diálogo deve abrir sem erros
4. Você deve conseguir selecionar uma categoria (se houver categorias criadas)

## Próximos Passos

Depois de corrigir o banco de dados:

1. Recarregue a página no navegador (F5)
2. Teste adicionar múltiplos documentos
3. Se necessário, crie categorias primeiro na aba **Categorias**

## Erros Comuns

### "relation library_categories does not exist"
- **Solução**: Execute o script `sql/create_library_categories.sql` completo

### "column category_id does not exist"
- **Solução**: Execute a Opção 3 acima para adicionar a coluna

### "permission denied"
- **Solução**: Verifique se você está usando uma conexão com permissões de admin no Supabase
