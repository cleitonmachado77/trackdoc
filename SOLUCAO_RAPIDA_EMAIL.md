# 🚀 Solução Rápida: Email Não Enviado em Produção

## ⚡ Problema
Status "Aguardando Envio de Email" - email não chega na caixa de entrada.

## ✅ Solução (5 minutos)

### PASSO 1: Configure Gmail SMTP no Supabase

1. **Acesse**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Vá em**: Authentication > Settings > SMTP Settings
3. **Configure**:
   ```
   Enable custom SMTP: ✅ Ativado
   Host: smtp.gmail.com
   Port: 587
   User: seuemail@gmail.com
   Pass: [senha de app do Gmail]
   ```

### PASSO 2: Gere Senha de App no Gmail

1. **Acesse**: [Google Account Security](https://myaccount.google.com/security)
2. **Ative**: "Verificação em duas etapas" (se não estiver ativo)
3. **Vá em**: "Senhas de app"
4. **Gere**: Nova senha de app para "Email"
5. **Use**: Esta senha no campo "Pass" do Supabase (não sua senha normal!)

### PASSO 3: Configure URLs no Supabase

1. **No Supabase**: Authentication > URL Configuration
2. **Site URL**: `https://seudominio.com`
3. **Redirect URLs**: 
   ```
   https://seudominio.com/auth/callback
   https://seudominio.com/confirm-email
   ```

### PASSO 4: Teste

1. **Na sua aplicação**: Crie um novo usuário
2. **Verifique**: Se o email chegou na caixa de entrada
3. **Confirme**: Clique no link do email
4. **Valide**: Status muda para "Ativo"

## 🎯 Resultado Esperado

- ✅ Email enviado automaticamente
- ✅ Usuário recebe link de confirmação
- ✅ Status muda para "Ativo" após confirmação
- ✅ Sistema funciona perfeitamente

## 🆘 Se Não Funcionar

### Erro: "Authentication failed"
- **Causa**: Senha incorreta
- **Solução**: Use senha de app, não sua senha normal do Gmail

### Erro: "Connection refused"
- **Causa**: Configurações incorretas
- **Solução**: Verifique host (smtp.gmail.com) e porta (587)

### Email vai para spam
- **Solução**: Configure SPF record no seu domínio:
  ```
  v=spf1 include:_spf.google.com ~all
  ```

## 📋 Checklist Final

- [ ] SMTP configurado no Supabase
- [ ] Senha de app do Gmail gerada
- [ ] URLs configuradas corretamente
- [ ] Teste realizado com sucesso
- [ ] Email chegou na caixa de entrada

---

**💡 Esta é a solução mais rápida e eficaz. Gmail SMTP resolve 95% dos casos!**