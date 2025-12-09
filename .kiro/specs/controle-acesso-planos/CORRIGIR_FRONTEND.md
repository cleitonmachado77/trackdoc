# 🔧 CORRIGIR FRONTEND - Subscription Não Aparece

## 🎯 Problema

A subscription foi criada com sucesso no banco de dados, mas o frontend não está mostrando as informações.

**Sintomas:**
- ✅ Subscription existe no banco (confirmado pelo INSERT)
- ❌ Página "Minha Conta → Plano" mostra erro: "Erro ao carregar informações da assinatura: Erro desconhecido"
- ❌ Painel Admin mostra "0 usuários" em todos os planos

## 🔍 Causa Raiz

O frontend usa uma função RPC `get_user_active_subscription()` que pode estar:
1. Desatualizada ou não existir
2. Bloqueada por permissões RLS (Row Level Security)

## ✅ Solução em 2 Passos

### PASSO 1: Corrigir Função RPC

**Arquivo:** `migrations/fix_rpc_get_subscription.sql`

**Execute no Supabase SQL Editor:**

1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql
2. Copie **TODO** o conteúdo de `migrations/fix_rpc_get_subscription.sql`
3. Cole no editor
4. Clique em **RUN**

**Resultado esperado:**
```
DROP FUNCTION
CREATE FUNCTION

=== FUNÇÃO CRIADA ===
routine_name: get_user_active_subscription
routine_type: FUNCTION

=== TESTE COM USUÁRIO PEDRO ===
id: dd4e468e-c594-4ad8-bbce-cf7fd3f9c304
user_id: f7f5b07d-ef74-4808-9855-9b7ecf03fa79
plan_name: Básico
plan_type: basico
plan_price: 149.00
status: active
current_users: 1
max_usuarios: 15
```

---

### PASSO 2: Corrigir Permissões RLS

**Arquivo:** `migrations/fix_rls_subscriptions.sql`

**Execute no Supabase SQL Editor:**

1. No mesmo SQL Editor
2. Copie **TODO** o conteúdo de `migrations/fix_rls_subscriptions.sql`
3. Cole no editor
4. Clique em **RUN**

**Resultado esperado:**
```
ALTER TABLE (RLS habilitado)

=== POLÍTICAS CRIADAS ===
- users_view_own_subscriptions
- everyone_view_active_plans
- admins_view_all_subscriptions

=== TESTE DE ACESSO ===
Subscription do Pedro visível
Planos ativos visíveis
```

---

## 🧪 Validação

Após executar os 2 SQLs:

### 1. Testar no Navegador

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Faça logout e login novamente** como Pedro
3. **Vá em:** Minha Conta → Plano
4. **Deve aparecer:**
   - ✅ Plano Básico Ativo
   - ✅ 1 de 15 usuários utilizados (6%)
   - ✅ 0 GB de 10 GB utilizados (0%)
   - ✅ Barra de progresso verde
   - ✅ 5 funcionalidades habilitadas

### 2. Testar no Painel Admin

1. **Faça login como admin**
2. **Vá em:** Painel de Administração
3. **Aba "Visão Geral"** deve mostrar:
   - ✅ Básico: 1 usuário
   - ✅ Profissional: 0 usuários
   - ✅ Enterprise: 0 usuários

4. **Aba "Usuários"** deve mostrar:
   - ✅ Pedro Machado
   - ✅ Plano: Básico
   - ✅ Status: Ativo

---

## 🔍 Troubleshooting

### Erro: "function get_user_active_subscription does not exist"

**Causa:** Função não foi criada

**Solução:**
1. Execute novamente `fix_rpc_get_subscription.sql`
2. Verifique se não há erros de sintaxe

### Erro: "permission denied for function get_user_active_subscription"

**Causa:** Permissões RLS bloqueando acesso

**Solução:**
1. Execute `fix_rls_subscriptions.sql`
2. Verifique se as políticas foram criadas

### Frontend ainda mostra erro

**Causa:** Cache do navegador ou sessão antiga

**Solução:**
1. Limpe cache do navegador (Ctrl+Shift+Delete)
2. Feche todas as abas do sistema
3. Abra em aba anônima/privada
4. Faça login novamente

### Painel Admin não mostra usuários

**Causa:** Query do painel pode estar usando outra função

**Solução:**
1. Abra o console do navegador (F12)
2. Vá na aba "Network"
3. Recarregue a página
4. Procure por erros em vermelho
5. Me envie a mensagem de erro

---

## 📊 Verificação Manual no Banco

Se ainda houver problemas, execute este SQL para verificar:

```sql
-- Verificar subscription do Pedro
SELECT 
  s.id,
  s.user_id,
  s.plan_name,
  s.status,
  s.current_users,
  s.current_storage_gb,
  p.name as plan_name_from_plans,
  p.max_users,
  p.max_storage_gb
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- Testar função RPC
SELECT * FROM get_user_active_subscription('f7f5b07d-ef74-4808-9855-9b7ecf03fa79');

-- Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('subscriptions', 'plans')
ORDER BY tablename, policyname;
```

---

## 🎯 Checklist de Execução

- [ ] Executei `fix_rpc_get_subscription.sql`
- [ ] Vi a mensagem "CREATE FUNCTION"
- [ ] Teste da função retornou dados do Pedro
- [ ] Executei `fix_rls_subscriptions.sql`
- [ ] Vi 3 políticas criadas
- [ ] Limpei cache do navegador
- [ ] Fiz logout e login novamente
- [ ] Página "Minha Conta → Plano" mostra Plano Básico
- [ ] Painel Admin mostra 1 usuário no Básico
- [ ] Pronto para enviar para GitHub

---

## 📝 Arquivos Envolvidos

| Arquivo | O que faz |
|---------|-----------|
| `migrations/fix_rpc_get_subscription.sql` | Recria função RPC usada pelo frontend |
| `migrations/fix_rls_subscriptions.sql` | Configura permissões de acesso |
| `lib/hooks/useSubscription.ts` | Hook que usa a função RPC |
| `components/subscription/SubscriptionManager.tsx` | Componente que mostra o plano |

---

**Última atualização:** 2024-12-09  
**Status:** Pronto para executar  
**Tempo estimado:** 5 minutos
