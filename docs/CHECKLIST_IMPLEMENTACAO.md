# ✅ Checklist de Implementação - Sistema de Planos

Use este checklist para acompanhar a implementação do sistema de planos.

## 📦 Fase 1: Instalação e Configuração

### Dependências
- [ ] Instalar Stripe: `npm install stripe @stripe/stripe-js`
- [ ] Instalar date-fns: `npm install date-fns`
- [ ] Executar script de verificação: `node scripts/setup-subscriptions.js`

### Variáveis de Ambiente
- [ ] Adicionar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no `.env.local`
- [ ] Adicionar `STRIPE_SECRET_KEY` no `.env.local`
- [ ] Adicionar `STRIPE_WEBHOOK_SECRET` no `.env.local`
- [ ] Adicionar `NEXT_PUBLIC_APP_URL` no `.env.local`
- [ ] Verificar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Banco de Dados
- [ ] Abrir Supabase Dashboard
- [ ] Ir em SQL Editor
- [ ] Executar migration `migrations/001_create_plans_and_subscriptions.sql`
- [ ] Verificar se tabelas foram criadas: `plans` e `subscriptions`
- [ ] Verificar se os 3 planos foram inseridos
- [ ] Testar função RPC: `SELECT * FROM get_user_active_subscription('user-id')`

## 💳 Fase 2: Configuração do Stripe

### Criar Produtos
- [ ] Acessar https://dashboard.stripe.com/products
- [ ] Criar produto "Básico" - R$ 149/mês
- [ ] Criar produto "Profissional" - R$ 349/mês
- [ ] Criar produto "Enterprise" - R$ 599/mês
- [ ] Copiar `price_id` de cada produto

### Atualizar Banco de Dados
- [ ] Executar SQL para atualizar `stripe_price_id` do plano Básico
- [ ] Executar SQL para atualizar `stripe_price_id` do plano Profissional
- [ ] Executar SQL para atualizar `stripe_price_id` do plano Enterprise
- [ ] Verificar: `SELECT name, stripe_price_id FROM plans`

### Configurar Webhook
- [ ] **Desenvolvimento**: Instalar Stripe CLI
- [ ] **Desenvolvimento**: Executar `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] **Desenvolvimento**: Copiar webhook secret e adicionar no `.env.local`
- [ ] **Produção**: Adicionar endpoint no Dashboard do Stripe
- [ ] **Produção**: Selecionar eventos necessários
- [ ] **Produção**: Copiar webhook secret

## 🧪 Fase 3: Testes

### Testar Criação de Trial
- [ ] Abrir SQL Editor do Supabase
- [ ] Executar: `SELECT create_trial_subscription('seu-user-id', 'profissional')`
- [ ] Verificar se subscription foi criada
- [ ] Verificar se status é 'trial'
- [ ] Verificar se trial_end_date está 14 dias no futuro

### Testar Hooks
- [ ] Criar página de teste com `useSubscription`
- [ ] Verificar se dados da subscription são carregados
- [ ] Verificar se `isTrialActive` funciona
- [ ] Verificar se `daysUntilTrialEnd` está correto
- [ ] Testar `useFeatureAccess` com diferentes features

### Testar FeatureGate
- [ ] Criar página de teste com `FeatureGate`
- [ ] Testar com usuário sem subscription (deve bloquear)
- [ ] Testar com usuário com trial (deve permitir se feature incluída)
- [ ] Testar com usuário com plano ativo (deve permitir se feature incluída)
- [ ] Verificar se mensagem de upgrade aparece

### Testar Checkout
- [ ] Acessar `/pricing`
- [ ] Clicar em "Começar agora" em um plano
- [ ] Verificar se redireciona para Stripe Checkout
- [ ] Usar cartão de teste: `4242 4242 4242 4242`
- [ ] Completar pagamento
- [ ] Verificar se webhook foi recebido
- [ ] Verificar se subscription foi atualizada no banco
- [ ] Verificar se `stripe_customer_id` e `stripe_subscription_id` foram salvos

### Testar Portal do Cliente
- [ ] Acessar "Minha Conta" > aba "Plano"
- [ ] Clicar em "Gerenciar Pagamento"
- [ ] Verificar se redireciona para Stripe Customer Portal
- [ ] Testar cancelamento de assinatura
- [ ] Verificar se webhook de cancelamento foi recebido
- [ ] Verificar se status mudou para 'canceled'

## 🎨 Fase 4: Integração na Aplicação

### Página "Minha Conta"
- [x] Adicionar aba "Plano" (já implementado)
- [x] Integrar `SubscriptionManager` (já implementado)
- [ ] Testar exibição de informações do plano
- [ ] Testar exibição de uso de recursos
- [ ] Testar botões de ação

### Página de Pricing
- [ ] Criar ou atualizar página `/pricing`
- [ ] Usar componente `PlanCard` para exibir planos
- [ ] Implementar lógica de seleção de plano
- [ ] Integrar com API de checkout
- [ ] Adicionar indicador de plano atual
- [ ] Adicionar badge "Mais popular" no plano Profissional

### Proteger Funcionalidades
- [ ] Adicionar `FeatureGate` na Biblioteca Pública
- [ ] Adicionar `FeatureGate` na Assinatura Eletrônica Simples
- [ ] Adicionar `FeatureGate` na Assinatura Eletrônica Múltipla
- [ ] Adicionar `FeatureGate` no Chat Nativo
- [ ] Adicionar `FeatureGate` na Auditoria Completa
- [ ] Adicionar `FeatureGate` no Backup Automático
- [ ] Adicionar verificação de limites (usuários e armazenamento)

### Trial Automático
- [ ] Identificar onde usuários são criados (registro)
- [ ] Adicionar chamada para `createTrialSubscription` após criar usuário
- [ ] Testar criação de novo usuário
- [ ] Verificar se trial é criado automaticamente
- [ ] Verificar se usuário tem acesso às funcionalidades do trial

### Notificações
- [ ] Criar componente de notificação de trial expirando
- [ ] Adicionar no layout principal ou dashboard
- [ ] Mostrar apenas quando faltam 3 dias ou menos
- [ ] Adicionar botão para escolher plano
- [ ] Testar com diferentes datas de expiração

## 🚀 Fase 5: Produção

### Preparação
- [ ] Revisar todas as variáveis de ambiente
- [ ] Configurar Stripe em modo produção
- [ ] Atualizar `stripe_price_id` com IDs de produção
- [ ] Configurar webhook de produção
- [ ] Testar webhook de produção
- [ ] Revisar políticas de RLS no Supabase

### Deploy
- [ ] Fazer deploy da aplicação
- [ ] Verificar se variáveis de ambiente estão configuradas
- [ ] Testar fluxo completo em produção
- [ ] Testar checkout com cartão real (pequeno valor)
- [ ] Verificar se webhooks estão funcionando
- [ ] Monitorar logs do Stripe

### Documentação
- [ ] Documentar processo de onboarding de novos usuários
- [ ] Documentar processo de upgrade/downgrade
- [ ] Documentar processo de cancelamento
- [ ] Criar FAQ para usuários
- [ ] Criar guia de troubleshooting para equipe

## 📊 Fase 6: Monitoramento

### Métricas
- [ ] Configurar tracking de conversões de trial
- [ ] Configurar tracking de upgrades
- [ ] Configurar tracking de cancelamentos
- [ ] Configurar alertas de falhas de pagamento
- [ ] Configurar dashboard de métricas

### Manutenção
- [ ] Configurar job para verificar trials expirados
- [ ] Configurar job para enviar emails de lembrete
- [ ] Configurar job para limpar subscriptions antigas
- [ ] Configurar backup do banco de dados
- [ ] Documentar processo de suporte

## ✨ Melhorias Futuras

### Funcionalidades Adicionais
- [ ] Adicionar planos anuais (com desconto)
- [ ] Adicionar cupons de desconto
- [ ] Adicionar programa de afiliados
- [ ] Adicionar upgrade/downgrade instantâneo
- [ ] Adicionar histórico de pagamentos
- [ ] Adicionar notas fiscais automáticas

### UX
- [ ] Adicionar tour guiado para novos usuários
- [ ] Adicionar comparação de planos interativa
- [ ] Adicionar calculadora de ROI
- [ ] Adicionar depoimentos de clientes
- [ ] Adicionar FAQ na página de pricing

### Otimizações
- [ ] Implementar cache de subscriptions
- [ ] Otimizar queries do banco
- [ ] Adicionar loading states em todos os componentes
- [ ] Implementar retry automático para webhooks
- [ ] Adicionar logs estruturados

---

## 📝 Notas

- Marque cada item conforme for completando
- Documente problemas encontrados
- Mantenha este checklist atualizado
- Compartilhe com a equipe

**Data de início**: ___/___/______
**Data de conclusão**: ___/___/______
**Responsável**: _________________
