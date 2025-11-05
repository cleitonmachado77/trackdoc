# 📧 Configurar Email em Produção - Guia Completo

## 🚨 Problema
Emails não são enviados em produção, usuários ficam com status "Aguardando Envio de Email".

## 🎯 Solução Rápida (5 minutos)

### PASSO 1: Configurar Supabase Auth

1. **Acesse Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Authentication > Settings**
   - **Site URL**: `https://seudominio.com` (URL da sua hospedagem)
   - **Additional Redirect URLs**: 
     ```
     https://seudominio.com/auth/callback
     https://seudominio.com/confirm-email
     ```

3. **Email Templates**
   - Ative "Enable custom SMTP"
   - Configure um provedor SMTP (veja opções abaixo)

### PASSO 2: Configurar Provedor SMTP (Escolha uma opção)

#### Opção A: Gmail SMTP (Mais Fácil)
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: seuemail@gmail.com
SMTP Pass: sua_senha_de_app (não a senha normal!)
```

**Como gerar senha de app no Gmail:**
1. Vá em Conta Google > Segurança
2. Ative "Verificação em duas etapas"
3. Gere uma "Senha de app"
4. Use essa senha no SMTP

#### Opção B: SendGrid (Recomendado para produção)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: SG.sua_api_key_aqui
```

**Como configurar SendGrid:**
1. Crie conta em: https://sendgrid.com
2. Vá em Settings > API Keys
3. Crie uma API Key
4. Use "apikey" como usuário e a API Key como senha

#### Opção C: Resend (Moderno e fácil)
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: re_sua_api_key_aqui
```

### PASSO 3: Configurar Variáveis de Ambiente

Na sua hospedagem, configure:

```env
NEXT_PUBLIC_APP_URL=https://seudominio.com
NEXT_PUBLIC_SITE_URL=https://seudominio.com
NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### PASSO 4: Testar Configuração

1. **Teste no Supabase Dashboard:**
   - Authentication > Users
   - Clique "Invite User"
   - Veja se o email é enviado

2. **Teste na sua aplicação:**
   - Crie um novo usuário
   - Verifique se o email chega

## 🛠️ Solução Alternativa (Edge Function)

Se ainda não funcionar, use nossa Edge Function de fallback:

### 1. Deploy da Edge Function

```bash
# No terminal do seu projeto
supabase functions deploy send-signup-email
```

### 2. Configurar Secrets

```bash
supabase secrets set SUPABASE_URL=https://seuprojetoid.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 3. Criar Tabela de Fallback

Execute no Supabase SQL Editor:
```sql
-- Cole o conteúdo de: sql/criar_tabela_email_confirmations.sql
```

## 🔧 Troubleshooting

### Problema: "Invalid login credentials"
**Solução**: Verifique se a senha SMTP está correta (use senha de app, não senha normal)

### Problema: "Authentication failed"
**Solução**: 
- Gmail: Ative verificação em duas etapas e use senha de app
- SendGrid: Use "apikey" como usuário
- Resend: Use "resend" como usuário

### Problema: "Connection timeout"
**Solução**: 
- Verifique se a porta está correta (587 ou 465)
- Teste com TLS/SSL habilitado

### Problema: Email vai para spam
**Solução**:
- Configure SPF record: `v=spf1 include:_spf.google.com ~all`
- Configure DKIM no seu provedor
- Use domínio verificado

## 📋 Checklist de Verificação

- [ ] Site URL configurada no Supabase
- [ ] Redirect URLs adicionadas
- [ ] Provedor SMTP configurado e testado
- [ ] Variáveis de ambiente definidas na hospedagem
- [ ] Teste de envio realizado
- [ ] Email chegou na caixa de entrada (não spam)

## 🎯 Resultado Esperado

Após seguir este guia:
- ✅ Emails são enviados automaticamente
- ✅ Usuários recebem link de confirmação
- ✅ Status muda para "Ativo" após confirmação
- ✅ Sistema funciona perfeitamente em produção

## 🆘 Se Nada Funcionar

1. **Verifique logs do Supabase:**
   - Dashboard > Logs > Auth Logs

2. **Use nossa Edge Function:**
   - Já implementada como fallback automático

3. **Contate suporte:**
   - Supabase: https://supabase.com/support
   - Ou implemente provedor próprio de email

---

**💡 Dica**: O Gmail SMTP é a opção mais rápida para testar. Para produção, recomendamos SendGrid ou Resend.