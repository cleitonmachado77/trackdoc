# Sistema de Planos e Assinaturas - TrackDoc

## 📋 Visão Geral

Sistema completo de gerenciamento de planos com:
- 3 tipos de planos (Básico, Profissional, Enterprise)
- Período trial de 14 dias grátis
- Controle de acesso por funcionalidades
- Integração com Stripe para pagamentos
- Gerenciamento de assinatura na página "Minha Conta"

## 🗂️ Estrutura de Arquivos

```
types/
  └── subscription.ts              # Tipos e constantes dos planos

migrations/
  └── 001_create_plans_and_subscriptions.sql  # Schema do banco

lib/
  ├── hooks/
  │   ├── useSubscription.ts       # Hook para dados da subscription
  │   └── useFeatureAccess.ts      # Hook para controle de acesso
  ├── stripe/
  │   ├── config.ts                # Configuração do Stripe
  │   ├── client.ts                # Cliente Stripe (frontend)
  │   └── server.ts                # Servidor Stripe (backend)
  └── subscription-utils.ts        # Utilitários de subscription

components/subscription/
  ├── FeatureGate.tsx              # Componente para bloquear funcionalidades
  ├── PlanCard.tsx                 # Card de exibição de plano
  └── SubscriptionManager.tsx      # Gerenciador de assinatura

app/api/stripe/
  ├── create-checkout-session/route.ts  # Criar sessão de checkout
  ├── create-portal-session/route.ts    # Portal do cliente
  └── webhook/route.ts                  # Webhook do Stripe
```

## 🚀 Configuração

### 1. Executar Migration no Supabase

Execute o arquivo `migrations/001_create_plans_and_subscriptions.sql` no SQL Editor do Supabase.

Isso irá criar:
- Tabela `plans` com os 3 planos
- Tabela `subscriptions`
- Funções RPC necessárias
- Políticas de segurança (RLS)

### 2. Instalar Dependências do Stripe

```bash
npm install stripe @stripe/stripe-js
```

### 3. Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Produtos no Stripe

1. Acesse o Dashboard do Stripe
2. Crie 3 produtos:
   - **Básico** - R$ 149/mês
   - **Profissional** - R$ 349/mês
   - **Enterprise** - R$ 599/mês

3. Copie os `price_id` de cada produto

4. Atualize a tabela `plans` no Supabase:

```sql
UPDATE plans SET stripe_price_id = 'price_xxx' WHERE type = 'basico';
UPDATE plans SET stripe_price_id = 'price_yyy' WHERE type = 'profissional';
UPDATE plans SET stripe_price_id = 'price_zzz' WHERE type = 'enterprise';
```

### 5. Configurar Webhook do Stripe

1. No Dashboard do Stripe, vá em **Developers > Webhooks**
2. Adicione endpoint: `https://seu-dominio.com/api/stripe/webhook`
3. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copie o `webhook secret` e adicione no `.env.local`

## 📖 Como Usar

### Criar Trial Automático no Registro

```typescript
import { createTrialSubscription } from '@/lib/subscription-utils'

// Após criar usuário
const { success, subscriptionId } = await createTrialSubscription(
  user.id,
  'profissional' // Plano do trial
)
```

### Bloquear Funcionalidades por Plano

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

function BibliotecaPublica() {
  return (
    <FeatureGate userId={user.id} feature="biblioteca_publica">
      {/* Conteúdo da biblioteca pública */}
    </FeatureGate>
  )
}
```

### Verificar Acesso Programaticamente

```tsx
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'

function MyComponent() {
  const { hasAccess, reason } = useFeatureAccess(user.id, 'chat_nativo')
  
  if (!hasAccess) {
    return <UpgradePrompt reason={reason} />
  }
  
  return <ChatNativo />
}
```

### Exibir Informações da Subscription

```tsx
import { useSubscription } from '@/lib/hooks/useSubscription'

function MyAccount() {
  const { subscription, loading, isTrialActive, daysUntilTrialEnd } = useSubscription(user.id)
  
  return (
    <div>
      <h2>Plano: {subscription?.plan?.name}</h2>
      {isTrialActive && <p>Trial expira em {daysUntilTrialEnd} dias</p>}
    </div>
  )
}
```

### Adicionar Aba de Plano em "Minha Conta"

```tsx
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager'

function MinhaContaPage() {
  return (
    <Tabs defaultValue="perfil">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="plano">Plano</TabsTrigger>
      </TabsList>
      
      <TabsContent value="plano">
        <SubscriptionManager userId={user.id} />
      </TabsContent>
    </Tabs>
  )
}
```

## 🎯 Funcionalidades por Plano

### Plano Básico (R$ 149/mês)
- ✅ Até 15 usuários
- ✅ 10 GB de armazenamento
- ✅ Dashboard gerencial
- ✅ Upload de documentos
- ✅ Solicitação de aprovações
- ✅ Suporte por e-mail
- ❌ Biblioteca Pública
- ❌ Assinatura eletrônica
- ❌ Chat nativo
- ❌ Auditoria completa
- ❌ Backup automático
- ❌ Suporte dedicado

**Extras:**
- Usuário adicional: R$ 2,90/usuário
- Armazenamento extra: R$ 0,49/GB

### Plano Profissional (R$ 349/mês)
- ✅ Até 50 usuários
- ✅ 50 GB de armazenamento
- ✅ Todas as funcionalidades do Básico
- ✅ Biblioteca Pública
- ✅ Assinatura eletrônica simples
- ❌ Assinatura eletrônica múltipla
- ❌ Chat nativo
- ❌ Auditoria completa
- ❌ Backup automático
- ❌ Suporte dedicado

### Plano Enterprise (R$ 599/mês)
- ✅ Até 70 usuários
- ✅ 120 GB de armazenamento
- ✅ Todas as funcionalidades
- ✅ Assinatura eletrônica múltipla
- ✅ Chat nativo
- ✅ Auditoria completa
- ✅ Backup automático diário
- ✅ Suporte técnico dedicado

## 🔄 Fluxo de Pagamento

1. Usuário escolhe um plano em `/pricing`
2. Sistema cria sessão de checkout via API
3. Usuário é redirecionado para Stripe Checkout
4. Após pagamento, webhook atualiza subscription
5. Usuário é redirecionado para `/minha-conta?tab=plano&payment=success`

## 🧪 Testes

### Testar Trial
```typescript
// Criar trial para usuário
const result = await createTrialSubscription(userId, 'profissional')
console.log('Trial criado:', result.subscriptionId)
```

### Testar Controle de Acesso
```typescript
// Verificar se usuário tem acesso
const { hasAccess } = useFeatureAccess(userId, 'biblioteca_publica')
console.log('Tem acesso:', hasAccess)
```

### Cartões de Teste do Stripe
- Sucesso: `4242 4242 4242 4242`
- Falha: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## 📝 Próximos Passos

1. ✅ Estrutura base criada
2. ✅ Migrations do banco
3. ✅ Hooks e utilitários
4. ✅ Componentes de UI
5. ✅ APIs do Stripe
6. ⏳ Integrar na página "Minha Conta"
7. ⏳ Adicionar trial automático no registro
8. ⏳ Testar fluxo completo
9. ⏳ Configurar Stripe em produção

## 🆘 Troubleshooting

### Erro: "Tabela plans não existe"
Execute a migration no Supabase SQL Editor.

### Erro: "Stripe não carregado"
Verifique se `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está configurada.

### Webhook não funciona
1. Verifique se o endpoint está acessível
2. Confirme que o `STRIPE_WEBHOOK_SECRET` está correto
3. Teste com Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## 📚 Referências

- [Stripe Docs](https://stripe.com/docs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
