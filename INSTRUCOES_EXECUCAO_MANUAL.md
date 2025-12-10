# 📋 Instruções para Execução Manual da Correção

## 🎯 Problema
O script automático não conseguiu executar a migração porque o Supabase não possui uma função `exec` disponível via RPC. Precisamos executar manualmente.

## ✅ Solução: Execução Manual

### Passo 1: Acessar o SQL Editor do Supabase
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto TrackDoc
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Executar a Migração
1. Abra o arquivo `migrations/fix_super_admin_usage_counters.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** para executar

### Passo 3: Verificar se Funcionou
Execute esta query para verificar se as funções foram criadas:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_user_storage_usage',
    'check_user_plan_limits',
    'update_subscription_counters',
    'can_upload_file'
  )
ORDER BY routine_name;
```

Você deve ver 4 funções listadas.

### Passo 4: Testar uma Função
Execute este teste com um usuário real (substitua o UUID):

```sql
-- Substitua 'seu-user-id-aqui' pelo ID de um usuário real
SELECT * FROM calculate_user_storage_usage('seu-user-id-aqui');
```

### Passo 5: Atualizar Contadores Existentes
Execute esta query para recalcular todos os contadores baseado nos dados reais:

```sql
UPDATE subscriptions 
SET current_storage_gb = COALESCE(doc_stats.storage_gb, 0),
    updated_at = NOW()
FROM (
  SELECT 
    d.created_by as user_id,
    SUM(d.file_size) / (1024.0 * 1024.0 * 1024.0) as storage_gb
  FROM documents d
  WHERE d.status != 'deleted'
    AND d.created_by IS NOT NULL
  GROUP BY d.created_by
) doc_stats
WHERE subscriptions.user_id = doc_stats.user_id
  AND subscriptions.status = 'active';
```

## 🔍 Verificação Final

### 1. Verificar Funções Criadas
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%storage%' 
   OR routine_name LIKE '%limit%';
```

### 2. Verificar Trigger
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_storage_counters';
```

### 3. Testar com Usuário Real
```sql
-- Buscar um usuário para teste
SELECT id, email, full_name FROM profiles LIMIT 1;

-- Usar o ID do usuário encontrado
SELECT * FROM check_user_plan_limits('id-do-usuario-aqui');
```

## 🎉 Após a Execução

1. **Acesse o painel super-admin**: `/super-admin`
2. **Verifique a nova aba "Limites"**
3. **Confirme os contadores na aba "Usuários"**
4. **Teste upload de arquivos** (se possível)

## ⚠️ Se Houver Erros

### Erro: "function already exists"
- Normal se executar novamente
- As funções usam `CREATE OR REPLACE`

### Erro: "permission denied"
- Verifique se está usando uma conta com permissões de admin
- Use o SQL Editor como proprietário do projeto

### Erro: "table does not exist"
- Verifique se as tabelas `documents`, `subscriptions`, `plans` existem
- Execute `\dt` para listar tabelas

## 📞 Suporte

Se encontrar problemas:
1. Copie a mensagem de erro completa
2. Verifique se todas as tabelas necessárias existem
3. Confirme que está executando como admin do projeto
4. Entre em contato com suporte técnico se necessário

## 🔄 Rollback (se necessário)

Para reverter as mudanças:

```sql
-- Remover funções
DROP FUNCTION IF EXISTS calculate_user_storage_usage(UUID);
DROP FUNCTION IF EXISTS check_user_plan_limits(UUID);
DROP FUNCTION IF EXISTS update_subscription_counters(UUID);
DROP FUNCTION IF EXISTS can_upload_file(UUID, BIGINT);

-- Remover trigger
DROP TRIGGER IF EXISTS trigger_update_storage_counters ON documents;
DROP FUNCTION IF EXISTS trigger_update_storage_counters();
```