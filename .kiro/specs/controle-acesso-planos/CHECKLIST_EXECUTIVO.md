# ✅ CHECKLIST EXECUTIVO - Controle de Acesso por Planos

## 📋 Visão Geral

**Objetivo:** Implementar controle completo de acesso baseado em planos com limites de usuários e armazenamento.

**Tempo Total:** 14 horas
**Status:** Pronto para implementação
**Prioridade:** Alta

---

## 🎯 REGRAS DOS PLANOS (VALIDAR PRIMEIRO!)

### Plano Básico
- [ ] ✅ 15 usuários
- [ ] ✅ 10 GB de armazenamento
- [ ] ✅ Dashboard gerencial
- [ ] ✅ Upload de documentos
- [ ] ✅ Solicitação de aprovações
- [ ] ✅ Suporte por e-mail
- [ ] ✅ **Biblioteca Pública** (IMPORTANTE!)
- [ ] ❌ Assinatura eletrônica simples
- [ ] ❌ Assinatura eletrônica múltipla
- [ ] ❌ Chat nativo
- [ ] ❌ Auditoria completa
- [ ] ❌ Backup automático
- [ ] ❌ Suporte dedicado

### Plano Profissional
- [ ] ✅ 50 usuários
- [ ] ✅ 50 GB de armazenamento
- [ ] ✅ Todas do Básico +
- [ ] ✅ Assinatura eletrônica simples
- [ ] ❌ Assinatura eletrônica múltipla
- [ ] ❌ Chat nativo
- [ ] ❌ Auditoria completa
- [ ] ❌ Backup automático
- [ ] ❌ Suporte dedicado

### Plano Enterprise
- [ ] ✅ 70 usuários
- [ ] ✅ 120 GB de armazenamento
- [ ] ✅ TODAS as funcionalidades (11 total)

---

## 🚀 FASE 1: Configuração (30 min)

### Banco de Dados
- [ ] Executar `migrations/update_plans_config.sql`
- [ ] Verificar biblioteca_publica = true no Básico
- [ ] Verificar limites: 15, 50, 70
- [ ] Verificar armazenamento: 10, 50, 120 GB

### Validação
```sql
SELECT name, type, 
  features->>'biblioteca_publica' as bib_pub,
  limits->>'max_usuarios' as usuarios
FROM plans;
```

**Resultado esperado:**
- Básico: bib_pub = true, usuarios = 15
- Profissional: bib_pub = true, usuarios = 50
- Enterprise: bib_pub = true, usuarios = 70

---

## 🔧 FASE 2: Hooks (1h 30min)

### useSubscription
- [ ] Adicionar `getRemainingUsers()`
- [ ] Adicionar `getRemainingStorage()`
- [ ] Adicionar `getUsagePercentage(limit)`
- [ ] Adicionar `getCurrentUsage()`
- [ ] Testar cálculos

### useFeatureAccess
- [ ] Adicionar campo `requiredPlan`
- [ ] Adicionar campo `currentPlan`
- [ ] Implementar `getRequiredPlan(feature)`
- [ ] Testar retorno para cada funcionalidade

---

## 🎨 FASE 3: Componentes UI (2h)

### LimitGuard (NOVO)
- [ ] Criar `components/subscription/LimitGuard.tsx`
- [ ] Props: userId, limitType, requiredAmount
- [ ] Bloquear quando limite atingido
- [ ] Exibir mensagem apropriada
- [ ] Testar com usuários e storage

### LimitAlert (NOVO)
- [ ] Criar `components/subscription/LimitAlert.tsx`
- [ ] Props: userId, limitType, showAt
- [ ] Alerta amarelo em 80-89%
- [ ] Alerta vermelho em 90-99%
- [ ] Testar cores e mensagens

### FeatureGate (MELHORAR)
- [ ] Adicionar prop `customMessage`
- [ ] Mostrar plano atual
- [ ] Mostrar plano necessário
- [ ] Melhorar layout da mensagem
- [ ] Testar com todas as funcionalidades

---

## 🔒 FASE 4: Validação Backend (3h)

### Middlewares
- [ ] Criar `lib/middleware/subscription-validation.ts`
- [ ] Implementar `validateFeatureAccess()`
- [ ] Implementar `validateStorageLimit()`
- [ ] Implementar `validateUserLimit()`
- [ ] Testar cada middleware

### Aplicar em Rotas
- [ ] `app/api/documents/upload/route.ts` - Storage
- [ ] `app/api/users/create/route.ts` - User limit
- [ ] `app/api/users/delete/route.ts` - Decrement
- [ ] `app/api/signatures/simple/route.ts` - Feature
- [ ] `app/api/signatures/multiple/route.ts` - Feature
- [ ] `app/api/chat/route.ts` - Feature
- [ ] `app/api/audit/route.ts` - Feature

### Validação
- [ ] Testar retorno HTTP 403
- [ ] Testar mensagens de erro
- [ ] Testar com usuário sem permissão

---

## 🔄 FASE 5: Contadores (2h)

### Funções SQL
- [ ] Executar `migrations/create_counter_functions.sql`
- [ ] Verificar 6 funções criadas
- [ ] Testar cada função manualmente

### Integração
- [ ] Criar `lib/subscription-counters.ts`
- [ ] Implementar `incrementUserCount()`
- [ ] Implementar `decrementUserCount()`
- [ ] Implementar `addStorageUsage()`
- [ ] Implementar `removeStorageUsage()`

### Aplicar
- [ ] Após criar usuário → increment
- [ ] Após remover usuário → decrement
- [ ] Após upload → add storage
- [ ] Após excluir arquivo → remove storage

### Validação
- [ ] Criar usuário e verificar contador
- [ ] Remover usuário e verificar contador
- [ ] Upload e verificar storage
- [ ] Excluir e verificar storage
- [ ] Verificar valores não ficam negativos

---

## 💬 FASE 6: Mensagens (1h 30min)

### Templates
- [ ] Criar `lib/subscription-messages.ts`
- [ ] Implementar `getFeatureBlockedMessage()`
- [ ] Implementar `getUserLimitMessage()`
- [ ] Implementar `getStorageLimitMessage()`
- [ ] Implementar `getStorageWarningMessage()`

### Alertas no Dashboard
- [ ] Adicionar `<LimitAlert>` para storage
- [ ] Adicionar `<LimitAlert>` para users
- [ ] Testar exibição em 80%
- [ ] Testar exibição em 90%

### Toasts
- [ ] Toast ao bloquear funcionalidade
- [ ] Toast ao atingir limite de usuários
- [ ] Toast ao atingir limite de storage
- [ ] Toast ao tentar upload sem espaço

---

## 🧪 FASE 7: Testes (2h 30min)

### Funcionalidades Bloqueadas
- [ ] Básico tenta assinatura simples → BLOQUEAR
- [ ] Básico tenta chat → BLOQUEAR
- [ ] Profissional acessa assinatura simples → PERMITIR
- [ ] Profissional tenta chat → BLOQUEAR
- [ ] Enterprise acessa tudo → PERMITIR

### Limite de Usuários
- [ ] Criar 15 usuários no Básico
- [ ] Alerta em 14 usuários (93%)
- [ ] Tentar criar 16º → BLOQUEAR
- [ ] Remover 1 usuário → Liberar
- [ ] Upgrade para Profissional → Liberar

### Limite de Armazenamento
- [ ] Upload até 8 GB → Alerta amarelo (80%)
- [ ] Upload até 9 GB → Alerta vermelho (90%)
- [ ] Upload até 10 GB → BLOQUEAR
- [ ] Excluir 2 GB → Liberar
- [ ] Tentar upload maior que disponível → BLOQUEAR

### Validação Backend
- [ ] API sem permissão → HTTP 403
- [ ] API upload sem espaço → HTTP 403
- [ ] API criar usuário sem espaço → HTTP 403
- [ ] Verificar JSON de erro correto

### Contadores
- [ ] Criar usuário → current_users++
- [ ] Remover usuário → current_users--
- [ ] Upload → current_storage_gb++
- [ ] Excluir → current_storage_gb--
- [ ] Valores não ficam negativos

---

## 📚 FASE 8: Documentação (1h)

### Documentos
- [ ] `docs/CONTROLE_ACESSO_PLANOS.md`
- [ ] `docs/API_VALIDATION.md`
- [ ] `docs/TROUBLESHOOTING.md`
- [ ] `docs/MENSAGENS_ERRO.md`

### Conteúdo
- [ ] Visão geral do sistema
- [ ] Como usar hooks
- [ ] Como usar componentes
- [ ] Exemplos de código
- [ ] Códigos de erro
- [ ] FAQ

---

## ✅ VALIDAÇÃO FINAL

### Configuração
- [ ] ✅ Planos corretos no banco
- [ ] ✅ Biblioteca Pública no Básico
- [ ] ✅ Limites corretos (15, 50, 70)
- [ ] ✅ Armazenamento correto (10, 50, 120)

### Funcionalidades
- [ ] ✅ Bloqueio funciona corretamente
- [ ] ✅ Mensagens claras e acionáveis
- [ ] ✅ Plano necessário é exibido
- [ ] ✅ Links funcionam

### Limites
- [ ] ✅ Bloqueio ao atingir 100%
- [ ] ✅ Alerta em 80%
- [ ] ✅ Alerta em 90%
- [ ] ✅ Contadores atualizados

### Backend
- [ ] ✅ Validação em todas as rotas
- [ ] ✅ HTTP 403 correto
- [ ] ✅ Mensagens de erro descritivas
- [ ] ✅ Logs de tentativas bloqueadas

### UX
- [ ] ✅ Mensagens amigáveis
- [ ] ✅ Botões de ação presentes
- [ ] ✅ Cores apropriadas (amarelo/vermelho)
- [ ] ✅ Toasts aparecem corretamente

---

## 🚀 DEPLOY

### Pré-Deploy
- [ ] Todos os testes passam
- [ ] Documentação completa
- [ ] Code review aprovado
- [ ] Backup do banco criado

### Deploy
- [ ] Executar migrations em produção
- [ ] Verificar planos em produção
- [ ] Deploy do código
- [ ] Smoke tests

### Pós-Deploy
- [ ] Monitorar logs por 24h
- [ ] Verificar métricas de erro
- [ ] Coletar feedback de usuários
- [ ] Ajustes se necessário

---

## 📊 MÉTRICAS DE SUCESSO

- [ ] ✅ 0 uploads além do limite
- [ ] ✅ 0 usuários criados além do limite
- [ ] ✅ 100% das funcionalidades bloqueadas corretamente
- [ ] ✅ Alertas aparecem em 80% e 90%
- [ ] ✅ Mensagens claras em todos os bloqueios
- [ ] ✅ Validação frontend + backend
- [ ] ✅ Contadores sempre corretos
- [ ] ✅ 0 bugs críticos em produção

---

## 🎯 PRIORIDADES

### 🔴 CRÍTICO (Fazer Primeiro)
1. Fase 1 - Configuração do banco
2. Fase 4 - Validação backend (segurança)
3. Fase 5 - Contadores automáticos

### 🟡 IMPORTANTE (Fazer em Seguida)
4. Fase 2 - Melhorar hooks
5. Fase 3 - Componentes de UI
6. Fase 6 - Mensagens e alertas

### 🟢 NECESSÁRIO (Fazer por Último)
7. Fase 7 - Testes completos
8. Fase 8 - Documentação

---

## 📞 CONTATOS E RECURSOS

### Documentação
- `PLANO_IMPLEMENTACAO.md` - Plano detalhado
- `RESUMO_VISUAL.md` - Visualizações e fluxos
- `COMECE_AQUI.md` - Primeiros passos
- `requirements.md` - Requisitos completos
- `design.md` - Arquitetura e design
- `tasks.md` - Tasks detalhadas

### SQL
- `migrations/update_plans_config.sql`
- `migrations/create_counter_functions.sql`

### Código
- `types/subscription.ts` - ✅ Já corrigido
- `lib/hooks/useSubscription.ts` - Precisa melhorias
- `lib/hooks/useFeatureAccess.ts` - Precisa melhorias
- `components/subscription/FeatureGate.tsx` - Precisa melhorias

---

## ✨ PRONTO PARA COMEÇAR!

**Próximo passo:** Abrir `COMECE_AQUI.md` e executar os 3 primeiros passos (20 minutos)

**Boa implementação! 🚀**
