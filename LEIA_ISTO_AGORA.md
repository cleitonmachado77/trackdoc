# 🚨 LEIA ISTO AGORA - Correção Urgente

## ❌ PROBLEMA

Você clicou em "Lançar Pagamento" mas nada mudou. O contador continua igual.

## ✅ SOLUÇÃO

Execute 1 SQL no Supabase e o problema será resolvido.

---

## 🚀 PASSO A PASSO (5 MINUTOS)

### 1. Abra o Supabase SQL Editor
- Acesse: https://supabase.com/dashboard
- Vá para seu projeto
- Clique em "SQL Editor" no menu lateral

### 2. Execute o SQL de Correção
- Abra o arquivo: `migrations/fix_rls_subscriptions_update.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor
- Clique em "Run" (ou pressione Ctrl+Enter)

### 3. Verifique o Resultado
Você deve ver algo como:
```
=== POLÍTICAS APÓS CRIAÇÃO ===
super_admins_update_subscriptions
admins_update_entity_subscriptions
system_update_subscriptions
```

### 4. Teste no Frontend
1. Recarregue a página do Super Admin (F5)
2. Vá para aba "Pagamentos"
3. Clique em "Lançar Pagamento" no usuário Pedro
4. Confirme o pagamento

### 5. Verifique que Funcionou
- ✅ Contador deve mostrar "30 dias restantes"
- ✅ Badge deve mudar para 🟢 "Pago"
- ✅ Data de vencimento: ~09/01/2025

---

## 📁 ARQUIVOS IMPORTANTES

### Para Executar:
- **migrations/fix_rls_subscriptions_update.sql** ← EXECUTE ESTE

### Para Entender:
- **.kiro/specs/controle-acesso-planos/RESUMO_PROBLEMA_PAGAMENTOS.md** ← Explicação simples
- **.kiro/specs/controle-acesso-planos/EXECUTAR_AGORA_CORRECAO.md** ← Guia detalhado
- **.kiro/specs/controle-acesso-planos/CORRIGIR_UPDATE_PAGAMENTOS.md** ← Documentação técnica

### Para Diagnosticar (Opcional):
- **migrations/diagnostico_pagamentos.sql** ← Ver estado atual

---

## 🤔 O QUE ACONTECEU?

**Problema:** Row Level Security (RLS) do Supabase estava bloqueando a atualização.

**Causa:** Só tínhamos políticas de LEITURA, faltavam políticas de ATUALIZAÇÃO.

**Solução:** Adicionar políticas que permitem Super Admins atualizarem subscriptions.

---

## 🆘 SE NÃO FUNCIONAR

1. Verifique se você é Super Admin:
   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```
   - Deve retornar `role = 'super_admin'`

2. Verifique se as políticas foram criadas:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'subscriptions' AND cmd = 'UPDATE';
   ```
   - Deve retornar 3 políticas

3. Limpe o cache do navegador (Ctrl+Shift+Delete)

4. Faça hard refresh (Ctrl+F5)

---

## ✅ DEPOIS DE CORRIGIR

1. Teste com o usuário Pedro
2. Verifique que o contador atualiza
3. Teste com outros usuários (se houver)
4. Marque como resolvido

---

## 📞 PRECISA DE AJUDA?

Leia os arquivos na ordem:
1. `RESUMO_PROBLEMA_PAGAMENTOS.md` (explicação simples)
2. `EXECUTAR_AGORA_CORRECAO.md` (passo a passo detalhado)
3. `CORRIGIR_UPDATE_PAGAMENTOS.md` (documentação técnica)

---

**Tempo estimado:** 5 minutos  
**Dificuldade:** Baixa (só executar 1 SQL)  
**Impacto:** Alto (resolve problema crítico)  

🚀 **EXECUTE AGORA!**
