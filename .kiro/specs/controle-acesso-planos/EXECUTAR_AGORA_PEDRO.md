# 🚀 EXECUTAR AGORA - Criar Subscription do Pedro

## ⚠️ IMPORTANTE: Estrutura Real da Tabela Verificada

Baseado na estrutura REAL da tabela `subscriptions`:
- ✅ Campos obrigatórios: `plan_name` (TEXT NOT NULL), `plan_price` (NUMERIC NOT NULL)
- ✅ Campos opcionais: `plan_description`, `plan_id`, `user_id`, `status`, etc.
- ✅ Sem comandos `\echo` (não funcionam no Supabase)
- ✅ Validação completa antes de inserir
- ✅ Tratamento de erros robusto

---

## 📋 PASSO 0: Diagnóstico (RECOMENDADO)

### Arquivo: `migrations/diagnostico_completo.sql`

**Execute PRIMEIRO para verificar o estado atual:**

1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql
2. Copie **TODO** o conteúdo de `migrations/diagnostico_completo.sql`
3. Cole no editor
4. Clique em **RUN**

### ✅ O que este SQL verifica:

- Estrutura completa da tabela `subscriptions`
- Planos disponíveis no banco
- Dados do usuário Pedro
- Se Pedro já tem subscription
- Triggers existentes
- Todos os usuários e suas subscriptions

**Anote os resultados antes de prosseguir!**

---

## 📋 PASSO 1: Criar Subscription do Pedro

### Arquivo: `migrations/create_subscription_pedro_v2.sql` ⭐ **VERSÃO ATUALIZADA**

**Abra o Supabase SQL Editor e execute:**

1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql
2. Copie **TODO** o conteúdo de `migrations/create_subscription_pedro_v2.sql`
3. Cole no editor
4. Clique em **RUN**

### ✅ Resultado Esperado:

Você deve ver mensagens no console:
```
NOTICE: 📋 Plano encontrado: Básico (ID: ...)
NOTICE: 💰 Preço: R$ 149.00
NOTICE: ✅ Subscription criada com sucesso!
NOTICE: 👤 Usuário: f7f5b07d-ef74-4808-9855-9b7ecf03fa79
NOTICE: 📦 Plano: Básico (R$ 149.00)
```

E uma tabela com:
```
status: ✅ SUBSCRIPTION CRIADA COM SUCESSO!
subscription_status: active
current_users: 1
current_storage_gb: 0
plan_name: Básico
plan_type: basico
plan_price: 149.00
max_users: 15
max_storage_gb: 10
is_trial: false
auto_renew: true
```

### ❌ Se der erro:

**Erro: "Plano Básico não encontrado"**
- Execute primeiro: `migrations/update_plans_config.sql`
- Depois execute novamente este SQL

**Erro: "Usuário já possui subscription"**
- Tudo certo! O Pedro já tem subscription
- Pule para o PASSO 2

**Outro erro:**
- Copie a mensagem de erro completa
- Me envie para análise

---

## 📋 PASSO 2: Criar Trigger Automático

### Arquivo: `migrations/auto_create_subscription_trigger_v2.sql` ⭐ **VERSÃO ATUALIZADA**

**Após o PASSO 1 funcionar, execute:**

1. No mesmo Supabase SQL Editor
2. Copie **TODO** o conteúdo de `migrations/auto_create_subscription_trigger_v2.sql`
3. Cole no editor
4. Clique em **RUN**

### ✅ Resultado Esperado:

Você deve ver:
```
DROP TRIGGER (se existia)
DROP FUNCTION (se existia)
CREATE FUNCTION
CREATE TRIGGER
```

E duas tabelas mostrando:
```
=== TRIGGER CRIADO ===
trigger_name: trigger_auto_create_subscription
event_manipulation: INSERT
event_object_table: profiles
action_timing: AFTER

=== FUNÇÃO CRIADA ===
routine_name: auto_create_subscription
routine_type: FUNCTION
data_type: trigger
```

### ❌ Se der erro:

**Erro: "function already exists"**
- Tudo certo! O trigger já existe
- Continue para o PASSO 3

**Outro erro:**
- Copie a mensagem de erro completa
- Me envie para análise

---

## 📋 PASSO 3: Testar o Trigger (Opcional)

**Execute este SQL para testar:**

```sql
-- Criar usuário de teste
INSERT INTO profiles (id, full_name, email, role, status)
VALUES (
  gen_random_uuid(),
  'Teste Trigger',
  'teste.trigger@example.com',
  'user',
  'active'
);

-- Verificar se a subscription foi criada automaticamente
SELECT 
  p.full_name,
  p.email,
  s.status as subscription_status,
  pl.name as plan_name,
  s.current_users,
  s.current_storage_gb
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE p.email = 'teste.trigger@example.com';
```

### ✅ Resultado Esperado:

```
full_name: Teste Trigger
email: teste.trigger@example.com
subscription_status: active
plan_name: Básico
current_users: 1
current_storage_gb: 0
```

Se aparecer isso, o trigger está funcionando! 🎉

---

## 📋 PASSO 4: Verificar no Sistema

1. Faça login como Pedro: `diariosolovorex@gmail.com`
2. Vá em **Minha Conta** → **Plano**
3. Deve aparecer:
   - ✅ Plano Básico Ativo
   - ✅ 1 de 15 usuários utilizados
   - ✅ 0 GB de 10 GB utilizados
   - ✅ 5 funcionalidades habilitadas

---

## 🎯 Resumo dos Arquivos

| Arquivo | O que faz | Quando executar |
|---------|-----------|-----------------|
| `diagnostico_completo.sql` | Verifica estado atual do banco | PRIMEIRO (Passo 0) |
| `create_subscription_pedro_v2.sql` | Cria subscription do Pedro | SEGUNDO (Passo 1) |
| `auto_create_subscription_trigger_v2.sql` | Cria trigger para novos usuários | TERCEIRO (Passo 2) |

### 📝 Arquivos Antigos (NÃO USAR):
- ❌ `create_subscription_pedro.sql` (versão antiga)
- ❌ `auto_create_subscription_trigger.sql` (versão antiga)
- ❌ `create_subscription_safe.sql` (versão antiga)
- ❌ `create_subscription_for_user.sql` (versão antiga)
- ❌ `fix_subscription_simple.sql` (versão antiga)

---

## 📊 Verificar Todos os Usuários

**Para ver todos os usuários e seus planos:**

```sql
SELECT 
  p.full_name,
  p.email,
  p.status as user_status,
  s.status as subscription_status,
  pl.name as plan_name,
  s.current_users,
  s.current_storage_gb
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
LEFT JOIN plans pl ON pl.id = s.plan_id
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## ✅ Checklist Final

- [ ] Executei `create_subscription_pedro.sql` com sucesso
- [ ] Vi a mensagem "Subscription criada!"
- [ ] Executei `auto_create_subscription_trigger.sql` com sucesso
- [ ] Vi "CREATE FUNCTION" e "CREATE TRIGGER"
- [ ] (Opcional) Testei criando usuário de teste
- [ ] Fiz login como Pedro e vi o Plano Básico
- [ ] Pronto para enviar para GitHub

---

**Última atualização:** 2024-12-09  
**Status:** Pronto para executar  
**ID do Pedro:** `f7f5b07d-ef74-4808-9855-9b7ecf03fa79`
