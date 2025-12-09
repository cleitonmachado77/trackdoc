# 🚀 EXECUTAR AGORA - SQLs Corrigidos

## ✅ Status

- ✅ SQL 2 (Funções de contador) - **EXECUTADO COM SUCESSO**
- ⚠️ SQL 1 (Atualização de planos) - **CORRIGIDO, PRONTO PARA EXECUTAR**
- 🆕 SQL 3 (Correção da função RPC) - **NOVO, EXECUTAR TAMBÉM**

## 📋 Ordem de Execução

### 1️⃣ Atualizar Configuração dos Planos

**Arquivo:** `migrations/update_plans_config.sql`

**Status:** ✅ CORRIGIDO - Agora usa os nomes corretos dos campos

**O que foi corrigido:**
- ❌ `max_usuarios` → ✅ `max_users`
- ❌ `armazenamento_gb` → ✅ `max_storage_gb`
- ❌ `price` → ✅ `price_monthly`

**Executar no Supabase SQL Editor:**
```sql
-- Copiar e colar todo o conteúdo de:
migrations/update_plans_config.sql
```

**Resultado esperado:**
```
UPDATE 1  (Plano Básico atualizado)
UPDATE 1  (Plano Profissional atualizado)
UPDATE 1  (Plano Enterprise atualizado)

Seguido de uma tabela mostrando:
- Básico: biblioteca_publica = true, max_users = 15
- Profissional: biblioteca_publica = true, max_users = 50
- Enterprise: biblioteca_publica = true, max_users = 70
```

---

### 2️⃣ Corrigir Função RPC

**Arquivo:** `migrations/fix_rpc_function.sql`

**Status:** 🆕 NOVO - Necessário para compatibilidade

**O que faz:**
- Atualiza a função `get_user_active_subscription`
- Mapeia os campos novos para os nomes esperados pelo hook
- Mantém compatibilidade com o código TypeScript

**Executar no Supabase SQL Editor:**
```sql
-- Copiar e colar todo o conteúdo de:
migrations/fix_rpc_function.sql
```

**Resultado esperado:**
```
CREATE FUNCTION

Seguido de:
routine_name: get_user_active_subscription
routine_type: FUNCTION
```

---

### 3️⃣ Validar Configuração

**Executar no terminal:**
```bash
npx tsx scripts/test-plans-config.ts
```

**Resultado esperado:**
```
==========================================================
TESTE DE CONFIGURAÇÃO DOS PLANOS
==========================================================

✅ 3 planos encontrados

📋 Básico (basico)
   Preço: R$ 149/mês
   Status: ✅ Ativo

   Limites:
   ✅ Usuários: 15 (esperado: 15)
   ✅ Armazenamento: 10 GB (esperado: 10 GB)
   💰 Usuário adicional: R$ 2.9
   💰 Armazenamento extra: R$ 0.49/GB

   Funcionalidades: 5/11 habilitadas
   ✅ biblioteca_publica: SIM (esperado: SIM)
   ✅ assinatura_eletronica_simples: NÃO (esperado: NÃO)
   ✅ chat_nativo: NÃO (esperado: NÃO)

   ✅ PLANO BÁSICO OK!

------------------------------------------------------------

📋 Profissional (profissional)
   Preço: R$ 349/mês
   Status: ✅ Ativo

   Limites:
   ✅ Usuários: 50 (esperado: 50)
   ✅ Armazenamento: 50 GB (esperado: 50 GB)

   Funcionalidades: 6/11 habilitadas
   ✅ biblioteca_publica: SIM (esperado: SIM)
   ✅ assinatura_eletronica_simples: SIM (esperado: SIM)
   ✅ chat_nativo: NÃO (esperado: NÃO)

   ✅ PLANO PROFISSIONAL OK!

------------------------------------------------------------

📋 Enterprise (enterprise)
   Preço: R$ 599/mês
   Status: ✅ Ativo

   Limites:
   ✅ Usuários: 70 (esperado: 70)
   ✅ Armazenamento: 120 GB (esperado: 120 GB)

   Funcionalidades: 11/11 habilitadas
   ✅ biblioteca_publica: SIM (esperado: SIM)
   ✅ assinatura_eletronica_simples: SIM (esperado: SIM)
   ✅ assinatura_eletronica_multipla: SIM (esperado: SIM)
   ✅ chat_nativo: SIM (esperado: SIM)
   ✅ auditoria_completa: SIM (esperado: SIM)

   ✅ PLANO ENTERPRISE OK!

------------------------------------------------------------

==========================================================
✅ TODOS OS PLANOS ESTÃO CONFIGURADOS CORRETAMENTE!
==========================================================
```

---

## 🔍 Verificação Manual (Opcional)

Se quiser verificar diretamente no banco:

```sql
-- Ver configuração dos planos
SELECT 
  name,
  type,
  price_monthly,
  max_users,
  max_storage_gb,
  features->>'biblioteca_publica' as biblioteca_publica,
  features->>'assinatura_eletronica_simples' as assinatura_simples,
  features->>'chat_nativo' as chat_nativo
FROM plans
WHERE interval = 'monthly'
ORDER BY 
  CASE type
    WHEN 'basico' THEN 1
    WHEN 'profissional' THEN 2
    WHEN 'enterprise' THEN 3
  END;
```

**Resultado esperado:**

| name | type | price_monthly | max_users | max_storage_gb | biblioteca_publica | assinatura_simples | chat_nativo |
|------|------|---------------|-----------|----------------|-------------------|-------------------|-------------|
| Básico | basico | 149.00 | 15 | 10 | true | false | false |
| Profissional | profissional | 349.00 | 50 | 50 | true | true | false |
| Enterprise | enterprise | 599.00 | 70 | 120 | true | true | true |

---

## ❓ Troubleshooting

### Erro: "column max_usuarios does not exist"

**Causa:** Executou o SQL antigo antes da correção

**Solução:** Execute o SQL corrigido (`migrations/update_plans_config.sql`)

### Erro: "function get_user_active_subscription does not exist"

**Causa:** Função RPC não foi criada ou precisa ser atualizada

**Solução:** Execute `migrations/fix_rpc_function.sql`

### Script de teste falha

**Causa:** Planos não foram atualizados ou função RPC não foi corrigida

**Solução:** 
1. Execute SQL 1 (update_plans_config.sql)
2. Execute SQL 3 (fix_rpc_function.sql)
3. Execute o teste novamente

---

## ✅ Checklist de Execução

- [ ] 1. Executar `migrations/update_plans_config.sql`
- [ ] 2. Executar `migrations/fix_rpc_function.sql`
- [ ] 3. Executar `npx tsx scripts/test-plans-config.ts`
- [ ] 4. Verificar que todos os planos estão OK
- [ ] 5. Testar componentes no dashboard

---

## 🎯 Próximos Passos

Após executar com sucesso:

1. **Testar componentes:**
   - Adicionar `<LimitAlert>` no dashboard
   - Testar `<FeatureGate>` em funcionalidades
   - Testar `<LimitGuard>` em ações

2. **Continuar implementação:**
   - Fase 4: Validação Backend
   - Fase 5: Contadores automáticos
   - Fase 6: Mensagens e alertas

---

**Última atualização:** 2024-12-09
**Status:** ✅ Pronto para executar
