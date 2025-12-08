# ❓ FAQ - Sistema de Planos e Assinaturas

## 📋 Geral

### O que foi implementado?

Um sistema completo de planos e assinaturas com:
- 3 tipos de planos (Básico, Profissional, Enterprise)
- Período trial de 14 dias grátis
- Controle de acesso por funcionalidades
- Integração com Stripe para pagamentos
- Página de gerenciamento na "Minha Conta"

### Quanto tempo leva para implementar?

- **Setup inicial**: 1-2 dias
- **Integração Stripe**: 2-3 dias
- **UI/UX**: 2-3 dias
- **Controle de acesso**: 3-4 dias
- **Testes e deploy**: 2-3 dias
- **Total**: 10-15 dias úteis

### Quais tecnologias são usadas?

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Pagamentos**: Stripe
- **Autenticação**: Supabase Auth

## 💰 Planos e Preços

### Quais são os planos disponíveis?

1. **Básico** - R$ 149/mês
   - 15 usuários, 10 GB
   - Funcionalidades básicas

2. **Profissional** - R$ 349/mês
   - 50 usuários, 50 GB
   - Biblioteca Pública + Assinatura simples

3. **Enterprise** - R$ 599/mês
   - 70 usuários, 120 GB
   - Todas as funcionalidades

### Como funciona o trial?

- **Duração**: 14 dias
- **Plano**: Profissional (mais popular)
- **Sem cartão**: Não requer pagamento antecipado
- **Conversão**: Usuário escolhe plano ao final

### Posso adicionar usuários extras?

Sim, no plano Básico:
- **Usuário adicional**: R$ 2,90/mês
- **Armazenamento extra**: R$ 0,49/GB/mês

### Como funciona o upgrade/downgrade?

- **Upgrade**: Imediato, cobra diferença proporcional
- **Downgrade**: Aplicado no próximo ciclo de cobrança
- **Gerenciamento**: Via Stripe Customer Portal

## 🔧 Instalação

### Quais dependências preciso instalar?

```bash
npm install stripe @stripe/stripe-js date-fns
```

### Quais variáveis de ambiente são necessárias?

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Como executar a migration?

1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `migrations/001_create_plans_and_subscriptions.sql`
4. Execute

### Como configurar o Stripe?

1. Crie produtos no Dashboard do Stripe
2. Copie os `price_id` de cada produto
3. Atualize a tabela `plans` no Supabase
4. Configure webhook (desenvolvimento ou produção)

Consulte `docs/INSTALACAO_RAPIDA_PLANOS.md` para detalhes.

## 🎯 Uso

### Como bloquear uma funcionalidade?

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

<FeatureGate userId={user.id} feature="biblioteca_publica">
  <BibliotecaPublica />
</FeatureGate>
```

### Como verificar se usuário tem acesso?

```tsx
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'

const { hasAccess } = useFeatureAccess(user.id, 'chat_nativo')

if (!hasAccess) {
  return <UpgradePrompt />
}
```

### Como exibir informações do plano?

```tsx
import { useSubscription } from '@/lib/hooks/useSubscription'

const { subscription, isTrialActive, daysUntilTrialEnd } = useSubscription(user.id)
```

### Como criar trial automático no registro?

```typescript
import { createTrialSubscription } from '@/lib/subscription-utils'

// Após criar usuário
const { success } = await createTrialSubscription(userId, 'profissional')
```

Consulte `docs/EXEMPLOS_USO.md` para mais exemplos.

## 🔒 Segurança

### Os dados estão seguros?

Sim! Implementamos múltiplas camadas de segurança:
- ✅ Row Level Security (RLS) no Supabase
- ✅ Validação de webhooks do Stripe
- ✅ Tokens JWT para autenticação
- ✅ HTTPS obrigatório
- ✅ PCI Compliance via Stripe

### Como funciona a validação de webhooks?

O Stripe assina cada webhook com HMAC SHA256. Verificamos a assinatura antes de processar qualquer evento.

### Usuários podem ver subscriptions de outros?

Não. As políticas de RLS garantem que cada usuário só vê suas próprias subscriptions.

## 🧪 Testes

### Como testar o checkout?

Use cartões de teste do Stripe:
- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

### Como testar webhooks localmente?

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Como criar um trial de teste?

```sql
-- No SQL Editor do Supabase
SELECT create_trial_subscription('user-id-aqui', 'profissional');
```

## 🐛 Troubleshooting

### Erro: "Stripe não carregado"

**Causa**: Variável de ambiente não configurada

**Solução**:
1. Verifique se `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está no `.env.local`
2. Reinicie o servidor: `npm run dev`

### Erro: "Tabela plans não existe"

**Causa**: Migration não foi executada

**Solução**:
1. Abra o Supabase SQL Editor
2. Execute `migrations/001_create_plans_and_subscriptions.sql`

### Webhook não funciona

**Causa**: Endpoint não acessível ou secret incorreto

**Solução**:
1. **Desenvolvimento**: Use Stripe CLI
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. **Produção**: Verifique configuração no Dashboard do Stripe

### Erro: "No active subscription"

**Causa**: Usuário não tem subscription

**Solução**:
1. Crie um trial manualmente:
   ```sql
   SELECT create_trial_subscription('user-id', 'profissional');
   ```
2. Ou complete um checkout de teste

### Subscription não atualiza após pagamento

**Causa**: Webhook não foi recebido ou processado

**Solução**:
1. Verifique logs do Stripe: `stripe logs tail`
2. Verifique se webhook está configurado corretamente
3. Teste manualmente: `stripe trigger checkout.session.completed`

### Erro: "RPC function not found"

**Causa**: Função RPC não foi criada

**Solução**:
Execute a migration completa que inclui as funções RPC.

## 📊 Métricas

### Como ver quantas subscriptions ativas tenho?

```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'trial') as trial
FROM subscriptions;
```

### Como calcular MRR (Monthly Recurring Revenue)?

```sql
SELECT SUM(p.price) as mrr
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active';
```

### Como ver taxa de conversão de trial?

```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'active' AND trial_start_date IS NOT NULL) * 100.0 / 
  COUNT(*) FILTER (WHERE trial_start_date IS NOT NULL) as conversion_rate
FROM subscriptions;
```

Consulte `docs/COMANDOS_UTEIS.md` para mais queries.

## 🚀 Deploy

### Como fazer deploy em produção?

1. Configure variáveis de ambiente de produção
2. Configure Stripe em modo produção
3. Atualize `stripe_price_id` com IDs de produção
4. Configure webhook de produção
5. Faça deploy: `vercel --prod`

### Preciso mudar algo no código para produção?

Não! O código detecta automaticamente o ambiente através das variáveis de ambiente.

### Como configurar webhook em produção?

1. Acesse https://dashboard.stripe.com/webhooks
2. Adicione endpoint: `https://seu-dominio.com/api/stripe/webhook`
3. Selecione eventos necessários
4. Copie o webhook secret
5. Adicione no Vercel: `STRIPE_WEBHOOK_SECRET`

## 💡 Boas Práticas

### Devo criar trial automático para todos os usuários?

**Recomendado**: Sim, aumenta conversão

```typescript
// No registro de usuário
await createTrialSubscription(newUser.id, 'profissional')
```

### Como notificar usuários sobre trial expirando?

Use o componente `TrialExpiringNotice`:

```tsx
import { TrialExpiringNotice } from '@/components/subscription/TrialExpiringNotice'

// No layout ou dashboard
<TrialExpiringNotice userId={user.id} />
```

### Devo bloquear acesso imediatamente após trial expirar?

**Recomendado**: Dar período de graça de 3-7 dias

```typescript
// Modificar lógica em useFeatureAccess
const gracePeriodDays = 3
const isInGracePeriod = daysUntilTrialEnd >= -gracePeriodDays
```

### Como lidar com falhas de pagamento?

1. **Automático**: Stripe tenta reprocessar automaticamente
2. **Notificação**: Envie email ao usuário
3. **Status**: Marque como `past_due`
4. **Bloqueio**: Após 3 tentativas falhadas

### Devo permitir downgrade imediato?

**Recomendado**: Aplicar no próximo ciclo

Isso evita problemas com recursos já utilizados (ex: usuários acima do novo limite).

## 📚 Recursos

### Onde encontro a documentação completa?

- **Completa**: `docs/PLANOS_E_SUBSCRIPTIONS.md`
- **Instalação**: `docs/INSTALACAO_RAPIDA_PLANOS.md`
- **Exemplos**: `docs/EXEMPLOS_USO.md`
- **Comandos**: `docs/COMANDOS_UTEIS.md`
- **Checklist**: `docs/CHECKLIST_IMPLEMENTACAO.md`
- **Arquitetura**: `docs/ARQUITETURA_VISUAL.md`

### Onde encontro exemplos de código?

Consulte `docs/EXEMPLOS_USO.md` com 10+ exemplos práticos.

### Como executar o script de verificação?

```bash
node scripts/setup-subscriptions.js
```

Este script verifica:
- ✓ Dependências instaladas
- ✓ Variáveis de ambiente configuradas
- ✓ Arquivos criados
- ✓ Próximos passos

## 🆘 Suporte

### Onde reportar bugs?

1. Verifique a documentação
2. Execute o script de verificação
3. Consulte os logs
4. Documente o problema com detalhes

### Como contribuir com melhorias?

1. Documente a melhoria proposta
2. Implemente seguindo os padrões existentes
3. Teste extensivamente
4. Atualize a documentação

### Onde encontro ajuda sobre Stripe?

- **Documentação**: https://stripe.com/docs
- **Dashboard**: https://dashboard.stripe.com
- **Suporte**: support@stripe.com

### Onde encontro ajuda sobre Supabase?

- **Documentação**: https://supabase.com/docs
- **Dashboard**: https://app.supabase.com
- **Suporte**: support@supabase.io

---

**Não encontrou sua pergunta?** Consulte a documentação completa em `docs/` ou execute `node scripts/setup-subscriptions.js` para verificar sua instalação.
