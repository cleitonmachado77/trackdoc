# 🎯 Sistema de Planos e Assinaturas - TrackDoc

Sistema completo de gerenciamento de planos com controle de acesso por funcionalidades, período trial de 14 dias e integração com Stripe.

## ✨ Funcionalidades

- ✅ 3 tipos de planos (Básico, Profissional, Enterprise)
- ✅ Período trial de 14 dias grátis
- ✅ Controle de acesso por funcionalidades
- ✅ Gerenciamento de limites (usuários e armazenamento)
- ✅ Integração completa com Stripe
- ✅ Página de gerenciamento na "Minha Conta"
- ✅ Componentes reutilizáveis (FeatureGate, PlanCard, etc.)
- ✅ Hooks personalizados (useSubscription, useFeatureAccess)
- ✅ Webhooks do Stripe configurados
- ✅ Migrations do banco de dados

## 🚀 Instalação Rápida

### 1. Instalar Dependências

```bash
npm install stripe @stripe/stripe-js date-fns
```

### 2. Executar Script de Setup

```bash
node scripts/setup-subscriptions.js
```

Este script irá:
- ✓ Verificar dependências instaladas
- ✓ Verificar variáveis de ambiente
- ✓ Verificar arquivos criados
- ✓ Fornecer próximos passos

### 3. Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Executar Migration

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `migrations/001_create_plans_and_subscriptions.sql`
4. Execute

### 5. Configurar Stripe

Consulte `docs/INSTALACAO_RAPIDA_PLANOS.md` para instruções detalhadas.

## 📁 Estrutura de Arquivos

```
├── types/
│   └── subscription.ts                    # Tipos e constantes
├── migrations/
│   └── 001_create_plans_and_subscriptions.sql  # Schema do banco
├── lib/
│   ├── hooks/
│   │   ├── useSubscription.ts             # Hook de subscription
│   │   └── useFeatureAccess.ts            # Hook de controle de acesso
│   ├── stripe/
│   │   ├── config.ts                      # Configuração
│   │   ├── client.ts                      # Cliente (frontend)
│   │   └── server.ts                      # Servidor (backend)
│   └── subscription-utils.ts              # Utilitários
├── components/subscription/
│   ├── FeatureGate.tsx                    # Bloqueio de funcionalidades
│   ├── PlanCard.tsx                       # Card de plano
│   └── SubscriptionManager.tsx            # Gerenciador de assinatura
├── app/api/stripe/
│   ├── create-checkout-session/route.ts   # Criar checkout
│   ├── create-portal-session/route.ts     # Portal do cliente
│   └── webhook/route.ts                   # Webhook
├── docs/
│   ├── PLANOS_E_SUBSCRIPTIONS.md          # Documentação completa
│   ├── INSTALACAO_RAPIDA_PLANOS.md        # Guia de instalação
│   └── EXEMPLOS_USO.md                    # Exemplos práticos
└── scripts/
    └── setup-subscriptions.js             # Script de setup
```

## 💡 Uso Básico

### Bloquear Funcionalidade

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

<FeatureGate userId={user.id} feature="biblioteca_publica">
  <BibliotecaPublica />
</FeatureGate>
```

### Verificar Acesso

```tsx
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'

const { hasAccess } = useFeatureAccess(user.id, 'chat_nativo')
```

### Exibir Informações do Plano

```tsx
import { useSubscription } from '@/lib/hooks/useSubscription'

const { subscription, isTrialActive, daysUntilTrialEnd } = useSubscription(user.id)
```

## 📊 Planos Disponíveis

### Básico - R$ 149/mês
- 15 usuários
- 10 GB de armazenamento
- Funcionalidades básicas
- Usuário adicional: R$ 2,90
- Armazenamento extra: R$ 0,49/GB

### Profissional - R$ 349/mês
- 50 usuários
- 50 GB de armazenamento
- Biblioteca Pública
- Assinatura eletrônica simples

### Enterprise - R$ 599/mês
- 70 usuários
- 120 GB de armazenamento
- Todas as funcionalidades
- Assinatura eletrônica múltipla
- Chat nativo
- Auditoria completa
- Backup automático
- Suporte dedicado

## 🔧 Configuração Avançada

### Criar Trial Automático no Registro

```typescript
import { createTrialSubscription } from '@/lib/subscription-utils'

const { success } = await createTrialSubscription(userId, 'profissional')
```

### Integrar na Página "Minha Conta"

A aba "Plano" já foi adicionada automaticamente em `app/minha-conta/page.tsx`.

### Proteger Rotas com Middleware

Consulte `docs/EXEMPLOS_USO.md` para exemplos de middleware.

## 📚 Documentação

- **[Documentação Completa](docs/PLANOS_E_SUBSCRIPTIONS.md)** - Guia detalhado do sistema
- **[Instalação Rápida](docs/INSTALACAO_RAPIDA_PLANOS.md)** - Passo a passo de instalação
- **[Exemplos de Uso](docs/EXEMPLOS_USO.md)** - 10+ exemplos práticos

## 🧪 Testes

### Cartões de Teste do Stripe

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

### Testar Webhook Localmente

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🆘 Troubleshooting

### "Tabela plans não existe"
Execute a migration no Supabase SQL Editor.

### "Stripe não carregado"
Verifique se `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está no `.env.local`.

### Webhook não funciona
Use Stripe CLI para desenvolvimento ou configure no Dashboard para produção.

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação em `docs/`
2. Execute o script de verificação: `node scripts/setup-subscriptions.js`
3. Verifique os logs do console

## ✅ Checklist de Implementação

- [x] Estrutura base criada
- [x] Migrations do banco
- [x] Hooks e utilitários
- [x] Componentes de UI
- [x] APIs do Stripe
- [x] Integração na página "Minha Conta"
- [ ] Adicionar trial automático no registro
- [ ] Testar fluxo completo
- [ ] Configurar Stripe em produção
- [ ] Adicionar FeatureGate nas páginas protegidas

## 🎉 Próximos Passos

1. Execute a migration no Supabase
2. Configure produtos no Stripe
3. Configure webhook
4. Teste o fluxo de checkout
5. Adicione FeatureGate nas páginas que precisam de controle de acesso
6. Implemente trial automático no registro de novos usuários

---

**Desenvolvido para TrackDoc** 🚀
