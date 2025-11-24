# Como aplicar a migration de soft delete

## Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `migrations/add_deleted_at_to_profiles.sql`
6. Clique em **Run** para executar

## Opção 2: Via CLI do Supabase

Se você tem o Supabase CLI instalado:

```bash
supabase db push
```

## Verificar se a migration foi aplicada

Execute esta query no SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'deleted_at';
```

Se retornar uma linha, a coluna foi criada com sucesso!

## O que a migration faz

1. Adiciona a coluna `deleted_at` (TIMESTAMPTZ) na tabela `profiles`
2. Cria um índice para melhorar performance de queries
3. Atualiza o status de usuários já excluídos (se houver)

## Como funciona o soft delete

- Quando um usuário é "excluído", o campo `deleted_at` é preenchido com a data/hora atual
- O status é alterado para 'deleted'
- O usuário não aparece mais nas listagens do frontend
- Todos os dados históricos são mantidos para rastreabilidade
- Documentos, aprovações e outras ações do usuário permanecem intactos
