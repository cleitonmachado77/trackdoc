# ⚡ EXECUTAR ESTES 3 SQLs NO SUPABASE

## 🎯 Ordem de Execução

Execute **nesta ordem** no Supabase SQL Editor:

---

## 1️⃣ DIAGNÓSTICO (Opcional mas Recomendado)

**Arquivo:** `migrations/diagnostico_completo.sql`

**O que faz:** Mostra o estado atual do banco (planos, usuários, subscriptions)

**Como executar:**
1. Abra: https://supabase.com/dashboard/project/[seu-projeto]/sql
2. Copie TODO o conteúdo de `migrations/diagnostico_completo.sql`
3. Cole e clique em **RUN**
4. Anote os resultados

---

## 2️⃣ CRIAR SUBSCRIPTION DO PEDRO (Obrigatório)

**Arquivo:** `migrations/create_subscription_pedro_v2.sql`

**O que faz:** Cria subscription com Plano Básico para o Pedro

**Como executar:**
1. No mesmo SQL Editor
2. Copie TODO o conteúdo de `migrations/create_subscription_pedro_v2.sql`
3. Cole e clique em **RUN**

**Resultado esperado:**
```
NOTICE: ✅ Subscription criada com sucesso!
```

E uma tabela mostrando:
- plan_name: Básico
- plan_price: 149.00
- current_users: 1
- max_users: 15

---

## 3️⃣ CRIAR TRIGGER AUTOMÁTICO (Obrigatório)

**Arquivo:** `migrations/auto_create_subscription_trigger_v2.sql`

**O que faz:** Cria trigger para criar subscription automaticamente em novos usuários

**Como executar:**
1. No mesmo SQL Editor
2. Copie TODO o conteúdo de `migrations/auto_create_subscription_trigger_v2.sql`
3. Cole e clique em **RUN**

**Resultado esperado:**
```
CREATE FUNCTION
CREATE TRIGGER
```

---

## ✅ Validação Final

Após executar os 3 SQLs:

1. **Faça login como Pedro:** `diariosolovorex@gmail.com`
2. **Vá em:** Minha Conta → Plano
3. **Deve aparecer:**
   - ✅ Plano Básico Ativo
   - ✅ 1 de 15 usuários
   - ✅ 0 GB de 10 GB

---

## 🚨 Se Der Erro

### Erro: "Plano Básico não encontrado"
**Solução:** Execute primeiro `migrations/update_plans_config.sql`

### Erro: "Usuário já possui subscription"
**Solução:** Tudo certo! Pule para o SQL 3

### Outro erro
**Solução:** Copie a mensagem completa e me envie

---

## 📦 Depois de Validar

Quando tudo estiver funcionando:

```bash
git add .
git commit -m "fix: criar subscription automática para novos usuários"
git push origin main
```

---

**Última atualização:** 2024-12-09  
**Tempo estimado:** 5 minutos  
**Dificuldade:** Fácil (copiar e colar)
