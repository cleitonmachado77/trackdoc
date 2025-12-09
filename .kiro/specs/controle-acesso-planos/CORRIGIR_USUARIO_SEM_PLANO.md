# 🔧 CORRIGIR USUÁRIO SEM PLANO

## 🎯 Problema Identificado

O usuário **Pedro Machado** (`diariosolovorex@gmail.com`) foi criado mas não tem uma subscription (plano) atribuída.

**Causa:** Não existe um mecanismo automático para criar subscriptions quando novos usuários são criados.

## ✅ Solução em 3 Passos

### PASSO 0: Investigar Estrutura da Tabela (IMPORTANTE!)

**Arquivo:** `migrations/investigate_subscriptions_table.sql`

**Executar PRIMEIRO no Supabase SQL Editor:**

Copie e cole **TODO** o conteúdo do arquivo `migrations/investigate_subscriptions_table.sql`

**O que faz:**
- Mostra TODOS os campos da tabela subscriptions
- Mostra quais campos são obrigatórios (NOT NULL)
- Mostra um exemplo de subscription existente
- Lista os planos disponíveis

**IMPORTANTE:** Anote os resultados, especialmente:
- Quais campos têm `is_nullable = NO` (são obrigatórios)
- Se existe algum campo `plan_name` ou similar

---

### PASSO 1: Criar Subscription para o Usuário Pedro

**Arquivo:** `migrations/create_subscription_safe.sql` ⭐ **RECOMENDADO**

**Executar no Supabase SQL Editor:**

Copie e cole **TODO** o conteúdo do arquivo `migrations/create_subscription_safe.sql`

**Por que este script é melhor:**
- ✅ Detecta automaticamente se a tabela tem campo `plan_name`
- ✅ Preenche `plan_name` se necessário (evita erro NOT NULL)
- ✅ Verifica a estrutura da tabela antes de inserir
- ✅ Mostra os planos disponíveis
- ✅ Verifica se já existe subscription antes de criar
- ✅ Funciona com qualquer estrutura de tabela

**Resultado esperado:**
```
INSERT 1
```

**Verificar:**
```sql
SELECT 
  s.id,
  s.status,
  s.current_users,
  s.current_storage_gb,
  p.name as plan_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';
```

**Deve retornar:**
- status: active
- current_users: 1
- current_storage_gb: 0
- plan_name: Básico

---

### PASSO 2: Criar Trigger para Futuros Usuários

**Arquivo:** `migrations/auto_create_subscription_trigger.sql`

**Executar no Supabase SQL Editor:**

Copie e cole **TODO** o conteúdo do arquivo `migrations/auto_create_subscription_trigger.sql`

**O que faz:**
- Cria uma função `auto_create_subscription()`
- Cria um trigger que executa após INSERT em `profiles`
- Automaticamente cria uma subscription com Plano Básico para novos usuários

**Resultado esperado:**
```
CREATE FUNCTION
CREATE TRIGGER
```

**Verificar:**
```sql
-- Ver se o trigger foi criado
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_subscription';
```

---

## 🧪 Testar o Trigger

Após executar o PASSO 2, crie um usuário de teste:

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
  s.status,
  pl.name as plan_name
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE p.email = 'teste.trigger@example.com';
```

**Resultado esperado:**
- full_name: Teste Trigger
- email: teste.trigger@example.com
- status: active
- plan_name: Básico

---

## 📋 Checklist de Execução

- [ ] 1. Executar `create_subscription_for_user.sql` para o Pedro
- [ ] 2. Verificar que a subscription foi criada
- [ ] 3. Executar `auto_create_subscription_trigger.sql`
- [ ] 4. Verificar que o trigger foi criado
- [ ] 5. Testar criando um usuário de teste
- [ ] 6. Verificar que o usuário de teste tem subscription automática
- [ ] 7. Fazer login com o Pedro e verificar a página de Plano

---

## 🎨 Resultado Final

Após executar os 2 passos:

✅ **Pedro terá:**
- Plano Básico ativo
- 15 usuários disponíveis
- 10 GB de armazenamento
- Acesso a 5 funcionalidades

✅ **Novos usuários terão:**
- Subscription criada automaticamente
- Plano Básico por padrão
- Sem necessidade de intervenção manual

---

## ⚙️ Configuração do Plano Padrão

Se quiser mudar o plano padrão para novos usuários, edite a função:

```sql
CREATE OR REPLACE FUNCTION auto_create_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_default_plan_type VARCHAR := 'basico'; -- MUDAR AQUI
BEGIN
  -- resto do código...
```

**Opções:**
- `'basico'` - Plano Básico (padrão)
- `'profissional'` - Plano Profissional
- `'enterprise'` - Plano Enterprise

---

## 🔍 Troubleshooting

### Erro: "Plano padrão não encontrado"

**Causa:** Não existe um plano ativo com o tipo especificado

**Solução:** Verificar se os planos foram criados:
```sql
SELECT id, name, type, is_active 
FROM plans 
WHERE interval = 'monthly';
```

Se não houver planos, execute primeiro:
- `migrations/update_plans_config.sql`

### Subscription não aparece na página

**Causa:** Cache do navegador ou erro no hook

**Solução:**
1. Fazer logout e login novamente
2. Limpar cache do navegador
3. Verificar console do navegador para erros

### Trigger não está funcionando

**Causa:** Trigger não foi criado ou foi desabilitado

**Solução:**
```sql
-- Verificar triggers
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- Recriar trigger se necessário
-- Execute novamente: auto_create_subscription_trigger.sql
```

---

## 📊 Monitoramento

Para ver todos os usuários e seus planos:

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
ORDER BY p.created_at DESC;
```

---

**Última atualização:** 2024-12-09
**Status:** Pronto para executar
