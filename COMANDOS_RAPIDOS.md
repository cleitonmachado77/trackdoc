# ⚡ Comandos Rápidos - Execute Agora!

## 🚀 Setup Completo em 3 Comandos

### 1️⃣ Executar SQL (Supabase)
```
Abra: https://supabase.com/dashboard/project/dhdeyznmncgukexofcxy/sql
Cole: SQL_ATUALIZAR_PRICE_IDS.sql
Clique: Run
```

### 2️⃣ Iniciar Aplicação
```bash
npm run dev
```

### 3️⃣ Configurar Webhook (Terminal separado)
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copie o webhook secret e adicione no .env.local**

---

## 🧪 Testar Agora

### Teste 1: Checkout
```
1. Acesse: https://www.trackdoc.com.br/#precos
2. Clique: "Começar agora"
3. Cartão: 4242 4242 4242 4242
4. Data: 12/34
5. CVC: 123
```

### Teste 2: Registro
```
1. Após pagamento → trackdoc.app.br/register
2. Preencher formulário
3. Criar conta
4. Login
```

### Teste 3: Ver Plano
```
1. Login
2. /minha-conta
3. Aba "Plano"
4. Verificar: Trial ativo, 14 dias restantes
```

---

## 🔍 Verificar Configuração

### Ver Planos no Banco
```sql
SELECT name, type, price_monthly, stripe_price_id 
FROM plans 
ORDER BY price_monthly;
```

### Ver Subscriptions
```sql
SELECT 
  s.id,
  s.status,
  s.trial_end_date,
  p.name as plan_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC;
```

### Criar Trial Manual
```sql
SELECT create_trial_subscription('user-id-aqui', 'profissional');
```

### Expirar Trial (Teste)
```sql
UPDATE subscriptions 
SET trial_end_date = NOW() - INTERVAL '1 day'
WHERE user_id = 'user-id-aqui';
```

---

## 📋 Checklist Rápido

```bash
# 1. SQL executado?
✓ 4 planos com Price IDs

# 2. Aplicação rodando?
✓ npm run dev

# 3. Webhook configurado?
✓ stripe listen rodando
✓ webhook secret no .env.local

# 4. Código no site?
✓ JavaScript adicionado
✓ IDs nos botões

# 5. Testado?
✓ Checkout funciona
✓ Registro funciona
✓ Login funciona
✓ Plano aparece
```

---

## 🎯 Seus Price IDs

```
Gratuito:     price_1Saode9dhzvo9jaq7Y6rHXMg
Básico:       price_1SZXBt9dhzvo9jaq2gH6ncQW
Profissional: price_1SZXCK9dhzvo9jaqDyRdF66a
Enterprise:   price_1SZXCz9dhzvo9jaqMVpEeIYf
```

---

## 🆘 Erro? Execute Isso

```bash
# Reiniciar tudo
Ctrl+C (parar aplicação)
npm run dev

# Verificar logs
# Terminal 1: Logs da aplicação
# Terminal 2: Logs do Stripe
stripe logs tail

# Limpar cache
rm -rf .next
npm run dev
```

---

## ✅ Tudo Funcionando?

Se sim, você tem:
- ✅ Checkout do site institucional
- ✅ Registro com pagamento
- ✅ Trial de 14 dias
- ✅ Bloqueio automático
- ✅ Sistema completo!

**Parabéns! 🎉**

---

**Tempo total**: 15 minutos
**Próximo**: Adicionar código no site institucional
