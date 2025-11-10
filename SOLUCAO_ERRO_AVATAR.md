# Solução: Erro ao Fazer Upload de Avatar

## Problema Identificado

Erro: `StorageApiError: new row violates row-level security policy`

## Causa

O código estava tentando fazer upload para o caminho `avatars/${fileName}`, mas as políticas RLS (Row Level Security) do Supabase esperam que o caminho seja `${user_id}/${fileName}`.

## Correções Aplicadas

### 1. Código de Upload (app/minha-conta/page.tsx)

**Antes:**
```typescript
const filePath = `avatars/${fileName}`
```

**Depois:**
```typescript
const filePath = `${user?.id}/${fileName}`
```

### 2. Código de Remoção (app/minha-conta/page.tsx)

**Antes:**
```typescript
await supabase.storage
  .from('avatars')
  .remove([`avatars/${fileName}`])
```

**Depois:**
```typescript
const urlParts = profile.avatar_url.split('/avatars/')
if (urlParts.length > 1) {
  const filePath = urlParts[1]
  await supabase.storage
    .from('avatars')
    .remove([filePath])
}
```

## Como Testar

1. Recarregue a página (F5)
2. Vá em **Minha Conta**
3. Clique em **Alterar Foto**
4. Selecione uma imagem
5. O upload deve funcionar sem erros

## Se Ainda Houver Problemas

Execute o script SQL no Supabase Dashboard:

1. Acesse **SQL Editor** no Supabase
2. Execute o arquivo: `sql/fix_avatars_bucket_policies.sql`

Este script irá:
- Recriar as políticas RLS corretas
- Verificar se o bucket está configurado corretamente
- Listar as políticas criadas para validação

## Estrutura de Pastas no Bucket

```
avatars/
├── {user_id_1}/
│   └── avatar-{timestamp}.jpg
├── {user_id_2}/
│   └── avatar-{timestamp}.png
└── {user_id_3}/
    └── avatar-{timestamp}.webp
```

Cada usuário tem sua própria pasta identificada pelo `user_id`, garantindo isolamento e segurança.

## Políticas RLS Aplicadas

1. **INSERT**: Usuário só pode fazer upload na sua própria pasta
2. **UPDATE**: Usuário só pode atualizar arquivos na sua própria pasta
3. **DELETE**: Usuário só pode deletar arquivos na sua própria pasta
4. **SELECT**: Qualquer pessoa pode visualizar avatares (público)

## Validação das Políticas

Para verificar se as políticas estão corretas, execute no SQL Editor:

```sql
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%avatar%';
```

Você deve ver 4 políticas:
- Users can upload their own avatars (INSERT)
- Users can update their own avatars (UPDATE)
- Users can delete their own avatars (DELETE)
- Anyone can view avatars (SELECT)
