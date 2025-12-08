# 🚀 Comandos para Enviar ao GitHub

## 📋 Arquivos Criados (Total: 30+ arquivos)

### APIs (3 novas)
- app/api/stripe/create-checkout-public/route.ts
- app/api/stripe/verify-session/route.ts
- app/api/auth/register-with-subscription/route.ts

### Páginas (4 novas)
- app/register/page.tsx
- app/subscription-expired/page.tsx
- app/trial-expired/page.tsx
- middleware.ts

### Migrations e SQL
- migrations/002_adapt_existing_plans_safe.sql
- SQL_ATUALIZAR_PRICE_IDS.sql

### Documentação (15+ arquivos)
- docs/ARQUITETURA_DOIS_DOMINIOS.md
- docs/INTEGRACAO_STRIPE_COMPLETA.md
- docs/MIGRACAO_TABELAS_EXISTENTES.md
- docs/RESOLVER_ERRO_FUNCAO.md
- INSTRUCOES_PARA_TRACKDOC_COM_BR.md
- GUIA_FINAL_IMPLEMENTACAO.md
- CONFIGURACAO_FINAL.md
- CUSTOMER_PORTAL_STRIPE.md
- E mais...

### Componentes e Libs
- components/subscription/FeatureGate.tsx
- components/subscription/PlanCard.tsx
- components/subscription/SubscriptionManager.tsx
- lib/hooks/useSubscription.ts
- lib/hooks/useFeatureAccess.ts
- lib/stripe/server.ts (atualizado)
- lib/subscription-utils.ts (atualizado)

### Outros
- types/subscription.ts
- scripts/configure-stripe.js
- site-institucional-codigo.html

---

## 🔧 Comandos Git

Execute estes comandos no terminal:

```bash
# 1. Ver status dos arquivos
git status

# 2. Adicionar todos os arquivos novos
git add .

# 3. Fazer commit
git commit -m "feat: Sistema completo de planos e assinaturas com Stripe

- Implementado sistema de dois domínios (trackdoc.com.br + trackdoc.app.br)
- Pagamento antes do registro via Stripe Payment Links
- Trial de 14 dias automático
- 4 planos configurados (Gratuito, Básico, Profissional, Enterprise)
- Bloqueio automático via middleware quando trial/subscription expira
- Customer Portal do Stripe integrado
- APIs públicas para checkout sem autenticação
- Páginas de erro (trial-expired, subscription-expired)
- Webhook do Stripe para sincronização automática
- Documentação completa (30+ arquivos)
- Migration para adaptar tabelas existentes
- Componentes React reutilizáveis (FeatureGate, PlanCard, SubscriptionManager)
- Hooks personalizados (useSubscription, useFeatureAccess)
- Integração completa com Payment Links do Stripe"

# 4. Enviar para GitHub
git push origin main
```

---

## 📝 Alternativa: Commit Simples

Se preferir um commit mais curto:

```bash
git add .
git commit -m "feat: Sistema completo de planos e assinaturas com Stripe"
git push origin main
```

---

## 🔍 Verificar Antes de Enviar

```bash
# Ver quais arquivos serão commitados
git status

# Ver diferenças
git diff

# Ver arquivos novos
git ls-files --others --exclude-standard
```

---

## ⚠️ Arquivos Sensíveis

**IMPORTANTE**: Verifique se o `.env.local` NÃO está sendo commitado!

```bash
# Verificar .gitignore
cat .gitignore

# Deve conter:
.env.local
.env*.local
```

Se `.env.local` aparecer no `git status`, adicione ao .gitignore:

```bash
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "chore: adicionar .env.local ao gitignore"
```

---

## 📊 Resumo do Commit

Este commit adiciona:
- ✅ 30+ arquivos novos
- ✅ Sistema completo de subscriptions
- ✅ Integração com Stripe
- ✅ Documentação completa
- ✅ Pronto para produção

---

## 🎯 Após o Push

1. Acesse GitHub e verifique os arquivos
2. Revise o commit
3. Crie uma tag de versão (opcional):

```bash
git tag -a v1.0.0 -m "Sistema de planos e assinaturas v1.0.0"
git push origin v1.0.0
```

---

## ✅ Pronto!

Após executar os comandos, tudo estará no GitHub! 🎉
