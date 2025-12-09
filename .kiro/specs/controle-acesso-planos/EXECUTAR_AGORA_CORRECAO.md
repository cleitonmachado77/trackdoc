# 🚀 EXECUTAR AGORA - Correção de Pagamentos

## ⚡ PASSO A PASSO RÁPIDO

### 1️⃣ Diagnóstico (Opcional)

Execute no Supabase SQL Editor para ver o estado atual:
```sql
-- Copie e execute: migrations/diagnostico_pagamentos.sql
```

Verifique se há políticas de UPDATE na seção "POLÍTICAS RLS".

---

### 2️⃣ Aplicar Correção (OBRIGATÓRIO)

Execute no Supabase SQL Editor:
```sql
-- Copie e execute: migrations/fix_rls_subscriptions_update.sql
```

**O que este SQL faz:**
- ✅ Cria 3 políticas de UPDATE para subscriptions
- ✅ Permite Super Admins atualizarem qualquer subscription
- ✅ Permite Admins atualizarem subscriptions da sua entidade
- ✅ Permite sistema atualizar (triggers)

**Resultado esperado:**
```
=== POLÍTICAS APÓS CRIAÇÃO ===
super_admins_update_subscriptions    | UPDATE
admins_update_entity_subscriptions   | UPDATE
system_update_subscriptions          | UPDATE
```

---

### 3️⃣ Testar no Frontend

1. **Recarregue a página** do Super Admin
2. Vá para aba **"Pagamentos"**
3. Localize o usuário **Pedro Machado**
4. Clique em **"Lançar Pagamento"**
5. Confirme o valor e data
6. Clique em **"Confirmar Pagamento"**

**Resultado esperado:**
- ✅ Toast: "Pagamento Registrado"
- ✅ Contador atualiza: "30 dias restantes"
- ✅ Badge muda: 🟢 "Pago"
- ✅ Data de vencimento: ~09/01/2025

---

### 4️⃣ Verificar Logs do Console

Abra o Console do navegador (F12) e verifique:

```
✅ Logs esperados:
🔄 Processando pagamento...
📝 Atualizando subscription: [id]
✅ Subscription atualizada: [dados]
📅 Campos atualizados: { next_billing_date, end_date, status }
💰 Registrando pagamento...
✅ Pagamento registrado
🔄 Recarregando subscriptions...
✅ Subscriptions recarregadas
```

---

### 5️⃣ Verificar no Banco (Opcional)

Execute no Supabase SQL Editor:
```sql
SELECT 
  id,
  user_id,
  plan_name,
  status,
  next_billing_date,
  end_date,
  EXTRACT(DAY FROM (next_billing_date - CURRENT_TIMESTAMP))::integer as dias_restantes
FROM subscriptions
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';
```

**Resultado esperado:**
- `next_billing_date`: ~2025-01-09
- `end_date`: ~2025-01-09
- `status`: active
- `dias_restantes`: ~30

---

## ✅ CHECKLIST

- [ ] Executar `migrations/fix_rls_subscriptions_update.sql`
- [ ] Verificar que 3 políticas foram criadas
- [ ] Recarregar página do Super Admin
- [ ] Testar lançamento de pagamento
- [ ] Verificar que contador atualiza
- [ ] Verificar que badge muda
- [ ] Verificar logs do console
- [ ] Confirmar no banco de dados

---

## 🐛 SE AINDA NÃO FUNCIONAR

### Problema: Erro de permissão

**Verifique:**
1. Usuário logado é Super Admin?
   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```
   - Deve retornar `role = 'super_admin'`

2. Políticas foram criadas?
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'subscriptions' AND cmd = 'UPDATE';
   ```
   - Deve retornar 3 políticas

### Problema: Campos não existem

**Verifique:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('next_billing_date', 'end_date');
```
- Ambos devem existir

### Problema: Frontend não atualiza

**Soluções:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Fazer hard refresh (Ctrl+F5)
3. Verificar console por erros JavaScript
4. Verificar Network tab por erros de API

---

## 📞 SUPORTE

Se o problema persistir:
1. Copie os logs do console
2. Execute `migrations/diagnostico_pagamentos.sql`
3. Copie os resultados
4. Documente o erro exato

---

## 🎯 PRÓXIMOS PASSOS APÓS CORREÇÃO

1. ✅ Testar com múltiplos usuários
2. ✅ Verificar cálculo de dias restantes
3. ✅ Testar filtros e busca
4. ✅ Testar envio de lembretes
5. ✅ Documentar processo para equipe
6. 🚀 Enviar para GitHub

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Baixa  
**Impacto:** Alto (resolve problema crítico)
