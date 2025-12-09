# ⚡ EXECUTAR AGORA - Corrigir Frontend

## 🎯 Problema
Subscription criada no banco ✅ mas frontend não mostra ❌

## 🔧 Solução Rápida

Execute **2 SQLs** no Supabase:

---

### 1️⃣ Corrigir Função RPC

**Arquivo:** `migrations/fix_rpc_get_subscription.sql`

1. Abra: https://supabase.com/dashboard/project/[seu-projeto]/sql
2. Copie TODO o arquivo `migrations/fix_rpc_get_subscription.sql`
3. Cole e clique **RUN**

**Deve ver:**
```
CREATE FUNCTION ✅
Teste retorna dados do Pedro ✅
```

---

### 2️⃣ Corrigir Permissões

**Arquivo:** `migrations/fix_rls_subscriptions.sql`

1. No mesmo SQL Editor
2. Copie TODO o arquivo `migrations/fix_rls_subscriptions.sql`
3. Cole e clique **RUN**

**Deve ver:**
```
3 políticas criadas ✅
Subscription visível ✅
```

---

## ✅ Validar

1. **Limpe cache:** Ctrl+Shift+Delete
2. **Logout e login** como Pedro
3. **Vá em:** Minha Conta → Plano
4. **Deve aparecer:** Plano Básico Ativo ✅

---

## 🚨 Se não funcionar

Me envie:
1. Mensagem de erro do SQL (se houver)
2. Erro no console do navegador (F12)
3. Screenshot da página

---

**Tempo:** 3 minutos  
**Dificuldade:** Fácil
