# 🚀 Início Rápido - 5 Minutos

Comece a usar o sistema de planos em 5 minutos!

## ⚡ Passo 1: Instalar (1 min)

```bash
npm install stripe @stripe/stripe-js date-fns
```

## ⚡ Passo 2: Configurar Ambiente (1 min)

Adicione no `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚡ Passo 3: Executar Migration (1 min)

**IMPORTANTE**: Você já tem tabelas de planos! Use a migration de adaptação:

1. Abra https://app.supabase.com
2. Vá em **SQL Editor**
3. Cole o conteúdo de `migrations/002_adapt_existing_plans.sql`
4. Clique em **Run**

Esta migration **adapta suas tabelas existentes** sem perder dados.

## ⚡ Passo 4: Verificar (1 min)

```bash
node scripts/setup-subscriptions.js
```

Este script verifica se tudo está configurado corretamente.

## ⚡ Passo 5: Testar (1 min)

```bash
# Terminal 1: Iniciar app
npm run dev

# Terminal 2: Escutar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Acesse http://localhost:3000/minha-conta e vá na aba "Plano".

## ✅ Pronto!

Agora você pode:

### 1. Criar um Trial de Teste

No SQL Editor do Supabase:

```sql
SELECT create_trial_subscription('seu-user-id', 'profissional');
```

### 2. Bloquear uma Funcionalidade

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

<FeatureGate userId={user.id} feature="biblioteca_publica">
  <BibliotecaPublica />
</FeatureGate>
```

### 3. Verificar Acesso

```tsx
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'

const { hasAccess } = useFeatureAccess(user.id, 'chat_nativo')
```

## 📚 Próximos Passos

### Configurar Stripe (10 min)

1. Acesse https://dashboard.stripe.com/products
2. Crie 3 produtos (Básico, Profissional, Enterprise)
3. Copie os `price_id`
4. Atualize no Supabase:

```sql
UPDATE plans SET stripe_price_id = 'price_xxx' WHERE type = 'basico';
UPDATE plans SET stripe_price_id = 'price_yyy' WHERE type = 'profissional';
UPDATE plans SET stripe_price_id = 'price_zzz' WHERE type = 'enterprise';
```

### Proteger Funcionalidades (30 min)

Adicione `FeatureGate` nas páginas que precisam de controle de acesso:

```tsx
// app/biblioteca-publica/page.tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

export default function BibliotecaPublicaPage() {
  const { user } = useAuth()
  
  return (
    <FeatureGate userId={user?.id} feature="biblioteca_publica">
      {/* Seu conteúdo aqui */}
    </FeatureGate>
  )
}
```

### Criar Página de Pricing (1 hora)

Consulte `docs/EXEMPLOS_USO.md` para exemplo completo.

## 🆘 Problemas?

### Erro: "Stripe não carregado"
```bash
# Verifique variável de ambiente
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Reinicie o servidor
npm run dev
```

### Erro: "Tabela não existe"
Execute a migration novamente no Supabase SQL Editor.

### Webhook não funciona
```bash
# Use Stripe CLI para desenvolvimento
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 📖 Documentação Completa

- **[README Principal](SISTEMA_PLANOS_README.md)** - Visão geral
- **[Instalação Detalhada](docs/INSTALACAO_RAPIDA_PLANOS.md)** - Passo a passo completo
- **[Exemplos](docs/EXEMPLOS_USO.md)** - 10+ exemplos práticos
- **[FAQ](docs/FAQ.md)** - Perguntas frequentes
- **[Índice](docs/INDEX.md)** - Toda a documentação

## 🎯 Checklist Rápido

- [ ] Dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Migration executada
- [ ] Script de verificação rodado
- [ ] App rodando localmente
- [ ] Webhook escutando
- [ ] Trial de teste criado
- [ ] Aba "Plano" funcionando

## 💡 Dicas

1. **Use o script de verificação** sempre que tiver dúvidas:
   ```bash
   node scripts/setup-subscriptions.js
   ```

2. **Consulte o FAQ** para problemas comuns:
   ```bash
   cat docs/FAQ.md
   ```

3. **Veja exemplos práticos** antes de implementar:
   ```bash
   cat docs/EXEMPLOS_USO.md
   ```

## 🎉 Sucesso!

Você configurou o sistema de planos em 5 minutos! 🚀

Agora explore a documentação completa e implemente as funcionalidades que precisa.

---

**Precisa de ajuda?** Consulte [docs/INDEX.md](docs/INDEX.md) para encontrar o que procura.
