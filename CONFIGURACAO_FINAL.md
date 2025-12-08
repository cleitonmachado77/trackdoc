# ✅ Configuração Final - Tudo Pronto para Usar!

## 🎉 Status: PRONTO PARA EXECUTAR!

Tenho todas as informações necessárias:
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ Price IDs dos 4 planos
- ✅ Product IDs do Stripe
- ✅ Todos os arquivos criados

## 🚀 Execute Agora (15 minutos)

### PASSO 1: Verificar .env.local (1 min)

Confirme que seu `.env.local` tem:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_...  # Vamos configurar no passo 3

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dhdeyznmncgukexofcxy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZGV5em5tbmNndWtleG9mY3h5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI5OTEzOSwiZXhwIjoyMDcxODc1MTM5fQ.7y9-cVetIXYyJT1-gzY6pceMoH-QvLtzwqbXqjOrQhU

# URLs
NEXT_PUBLIC_APP_URL=https://www.trackdoc.app.br
```

### PASSO 2: Executar SQL (2 min)

1. Abra: https://supabase.com/dashboard/project/dhdeyznmncgukexofcxy/sql
2. Cole o conteúdo de **`SQL_ATUALIZAR_PRICE_IDS.sql`**
3. Clique em **"Run"**
4. Verifique o resultado:
   - Deve mostrar 4 planos
   - Todos com `stripe_price_id` preenchido

### PASSO 3: Configurar Webhook (5 min)

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
# Instalar Stripe CLI (se necessário)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escutar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copie o webhook secret** que aparece (começa com `whsec_`) e adicione no `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_copiado_aqui
```

**Reinicie a aplicação** (Ctrl+C e `npm run dev` novamente)

### PASSO 4: Adicionar Código no Site Institucional (5 min)

1. Abra o arquivo: **`site-institucional-codigo.html`**
2. Copie o **CSS** para seu arquivo de estilos
3. Copie o **JavaScript** para antes do `</body>`
4. Adicione os **IDs** aos botões dos planos:
   - `id="btn-plano-basico"`
   - `id="btn-plano-profissional"`
   - `id="btn-plano-enterprise"`

**Ou use o HTML completo fornecido como exemplo**

### PASSO 5: Testar! (5 min)

#### A. Testar Checkout

1. Acesse: https://www.trackdoc.com.br/#precos
2. Clique em **"Começar agora"** (qualquer plano)
3. Deve redirecionar para Stripe Checkout
4. Preencha:
   - **Cartão**: `4242 4242 4242 4242`
   - **Data**: `12/34`
   - **CVC**: `123`
   - **CEP**: `12345-678`
5. Clique em **"Assinar"**

#### B. Verificar Registro

1. Após pagamento, deve ir para: `trackdoc.app.br/register?session_id=xxx`
2. Deve mostrar: **"✓ Pagamento confirmado!"**
3. Preencha o formulário:
   - Nome completo
   - Email (já preenchido)
   - Senha
   - Confirmar senha
4. Clique em **"Criar Conta"**
5. Deve redirecionar para `/login`

#### C. Verificar Login e Plano

1. Faça login com as credenciais criadas
2. Acesse: `/minha-conta`
3. Clique na aba **"Plano"**
4. Deve mostrar:
   - ✅ Nome do plano
   - ✅ Status: Trial
   - ✅ 14 dias restantes
   - ✅ Uso de recursos
   - ✅ Funcionalidades incluídas

## 🎯 Seus Planos Configurados

| Plano | Preço | Price ID | Status |
|-------|-------|----------|--------|
| **Gratuito (Trial)** | R$ 0 | price_1Saode9dhzvo9jaq7Y6rHXMg | ✅ |
| **Básico** | R$ 149 | price_1SZXBt9dhzvo9jaq2gH6ncQW | ✅ |
| **Profissional** | R$ 349 | price_1SZXCK9dhzvo9jaqDyRdF66a | ✅ |
| **Enterprise** | R$ 649 | price_1SZXCz9dhzvo9jaqMVpEeIYf | ✅ |

## 📊 Fluxo Completo

```
1. trackdoc.com.br/#precos
   ↓ Usuário clica "Começar agora"
   
2. API: /api/stripe/create-checkout-public
   ↓ Busca plano no banco (com Price ID)
   ↓ Cria sessão do Stripe
   
3. Stripe Checkout
   ↓ Usuário paga com cartão
   ↓ Stripe processa pagamento
   
4. trackdoc.app.br/register?session_id=xxx
   ↓ API: /api/stripe/verify-session
   ↓ Valida pagamento ✓
   ↓ Mostra "Pagamento confirmado!"
   
5. Usuário preenche formulário
   ↓ API: /api/auth/register-with-subscription
   ↓ Cria usuário no Supabase Auth
   ↓ Cria perfil
   ↓ Cria subscription com trial de 14 dias
   
6. Redireciona para /login
   ↓ Usuário faz login
   
7. middleware.ts verifica subscription
   ↓ Status: trial
   ↓ Trial end: 14 dias no futuro
   ↓ ✓ Permite acesso
   
8. Após 14 dias
   ↓ middleware.ts verifica
   ↓ Trial expirado!
   ↓ Redireciona para /trial-expired
```

## 🧪 Testar Bloqueio de Trial

Depois de criar uma conta, teste o bloqueio:

```sql
-- No Supabase SQL Editor
-- Expirar trial manualmente
UPDATE subscriptions 
SET trial_end_date = NOW() - INTERVAL '1 day'
WHERE user_id = 'seu-user-id';

-- Fazer logout e login novamente
-- Deve redirecionar para /trial-expired
```

## ✅ Checklist Final

- [ ] `.env.local` configurado com todas as variáveis
- [ ] SQL executado no Supabase
- [ ] 4 planos com Price IDs verificados
- [ ] Webhook configurado (Stripe CLI rodando)
- [ ] Código adicionado no site institucional
- [ ] Testado checkout do site
- [ ] Testado registro com pagamento
- [ ] Testado login
- [ ] Verificado plano em "Minha Conta"
- [ ] Testado bloqueio de trial expirado

## 🎉 Resultado Final

Após completar todos os passos, você terá:

✅ **Site institucional** com checkout funcionando
✅ **Pagamento via Stripe** antes do registro
✅ **Registro automático** após pagamento confirmado
✅ **Trial de 14 dias** para todos os planos
✅ **Bloqueio automático** quando trial expirar
✅ **Página "Minha Conta"** com detalhes do plano
✅ **4 planos configurados** (Gratuito, Básico, Profissional, Enterprise)
✅ **Sistema completo** de subscriptions

## 🆘 Problemas Comuns

### Erro: "Plano não encontrado"
**Solução**: Execute o SQL novamente

### Erro: "Pagamento não confirmado"
**Solução**: Verifique se o webhook está rodando

### Checkout não redireciona
**Solução**: Verifique se `NEXT_PUBLIC_APP_URL` está correto

### CORS Error no site institucional
**Solução**: A API já está configurada, verifique se a URL está correta

## 📞 Suporte

Se tiver algum problema:
1. Verifique os logs do console (F12)
2. Verifique os logs do terminal
3. Verifique os logs do Stripe CLI
4. Consulte a documentação em `docs/`

## 🎯 Próximos Passos (Opcional)

Depois que tudo estiver funcionando:

1. **Proteger funcionalidades específicas** com `FeatureGate`
2. **Adicionar notificações** de trial expirando
3. **Criar página de pricing** na aplicação
4. **Configurar emails** transacionais
5. **Deploy em produção**

---

**Tempo estimado**: 15-20 minutos
**Dificuldade**: Fácil (tudo está pronto!)
**Resultado**: Sistema completo funcionando! 🚀

---

**Comece agora**: Execute o SQL e teste! 🎉
