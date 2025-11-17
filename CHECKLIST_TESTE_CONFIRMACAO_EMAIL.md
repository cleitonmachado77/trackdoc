# ✅ Checklist de Testes - Confirmação de Email

## 🎯 Objetivo
Validar que o sistema de confirmação de email para usuários de entidades está funcionando corretamente.

---

## 📋 Testes Obrigatórios

### 1. ✅ Criar Usuário de Entidade

**Passos:**
1. Faça login como administrador de uma entidade
2. Acesse: `Administração → Usuários`
3. Clique em "Cadastrar Usuário"
4. Preencha os dados:
   - Nome: `Teste Confirmação`
   - Email: `teste@seudominio.com` (use um email real que você tenha acesso)
   - Senha: `teste123`
   - Função: `Usuário`
5. Clique em "Cadastrar Usuário"

**Resultado Esperado:**
- ✅ Mensagem de sucesso: "Usuário Teste Confirmação criado com sucesso! Um email de confirmação foi enviado para teste@seudominio.com. O usuário poderá fazer login após confirmar o email."
- ✅ Usuário aparece na lista com:
  - Badge laranja "Inativo"
  - Badge amarelo "Aguardando confirmação"

---

### 2. ✅ Verificar Email Único

**Passos:**
1. Tente criar outro usuário com o mesmo email
2. Use: `teste@seudominio.com`

**Resultado Esperado:**
- ❌ Erro: "Este email já está cadastrado no sistema"
- ✅ Usuário não é criado

---

### 3. ✅ Tentar Login Sem Confirmar

**Passos:**
1. Faça logout
2. Tente fazer login com:
   - Email: `teste@seudominio.com`
   - Senha: `teste123`

**Resultado Esperado:**
- ❌ Erro: "Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação."
- ✅ Login não é permitido

---

### 4. ✅ Receber Email de Confirmação

**Passos:**
1. Verifique a caixa de entrada do email cadastrado
2. Procure por email de "Supabase" ou "TrackDoc"
3. Verifique também a pasta de SPAM

**Resultado Esperado:**
- ✅ Email recebido com link de confirmação
- ✅ Email contém instruções claras
- ✅ Link está presente e clicável

---

### 5. ✅ Confirmar Email

**Passos:**
1. Abra o email de confirmação
2. Clique no link de confirmação
3. Aguarde o redirecionamento

**Resultado Esperado:**
- ✅ Redirecionamento automático para página de login
- ✅ Mensagem de sucesso: "Email confirmado com sucesso! Você já pode fazer login."
- ✅ Ou redirecionamento para `/confirm-email` com mensagem de sucesso

---

### 6. ✅ Verificar Status Atualizado

**Passos:**
1. Faça login como administrador
2. Acesse: `Administração → Usuários`
3. Procure pelo usuário `Teste Confirmação`

**Resultado Esperado:**
- ✅ Badge verde "Ativo"
- ✅ Badge amarelo "Aguardando confirmação" removido
- ✅ Status mudou de "inactive" para "active"

---

### 7. ✅ Login Após Confirmação

**Passos:**
1. Faça logout
2. Faça login com:
   - Email: `teste@seudominio.com`
   - Senha: `teste123`

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para dashboard
- ✅ Acesso completo à plataforma

---

## 🔍 Testes Adicionais (Opcional)

### 8. ⚙️ Verificar Banco de Dados

**Query SQL:**
```sql
-- Ver usuários aguardando confirmação
SELECT * FROM pending_email_confirmations;

-- Ver perfil do usuário criado
SELECT id, email, full_name, status, entity_id, entity_role 
FROM profiles 
WHERE email = 'teste@seudominio.com';
```

**Resultado Esperado:**
- ✅ Antes da confirmação: status = 'inactive'
- ✅ Após confirmação: status = 'active'

---

### 9. 🔄 Testar Reenvio de Email (API)

**Usando Postman ou cURL:**
```bash
curl -X POST http://localhost:3000/api/resend-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@seudominio.com"}'
```

**Resultado Esperado:**
- ✅ Se inativo: Email reenviado com sucesso
- ✅ Se ativo: Mensagem "Este usuário já confirmou o email e está ativo"

---

### 10. 🔒 Testar Validações

**Teste A: Email Inválido**
- Tente criar usuário com email: `teste@invalido`
- Esperado: ❌ "Formato de email inválido"

**Teste B: Senha Curta**
- Tente criar usuário com senha: `123`
- Esperado: ❌ "A senha deve ter pelo menos 6 caracteres"

**Teste C: Nome Vazio**
- Tente criar usuário sem nome
- Esperado: ❌ "Nome completo é obrigatório"

---

## 📊 Checklist de Validação

Marque cada item após testar:

- [ ] 1. Criar usuário de entidade
- [ ] 2. Verificar email único
- [ ] 3. Tentar login sem confirmar
- [ ] 4. Receber email de confirmação
- [ ] 5. Confirmar email
- [ ] 6. Verificar status atualizado
- [ ] 7. Login após confirmação
- [ ] 8. Verificar banco de dados (opcional)
- [ ] 9. Testar reenvio de email (opcional)
- [ ] 10. Testar validações (opcional)

---

## 🐛 Problemas Comuns e Soluções

### Email não recebido
**Possíveis causas:**
- Configuração SMTP do Supabase
- Email na pasta de SPAM
- Email inválido

**Solução:**
1. Verifique configurações do Supabase Auth
2. Verifique pasta de SPAM
3. Teste com outro email

### Link expirado
**Causa:**
- Link expira em 24 horas

**Solução:**
- Use a API de reenvio de confirmação
- Ou recrie o usuário

### Erro ao ativar usuário
**Possíveis causas:**
- API não encontrada
- Permissões incorretas
- Usuário já ativo

**Solução:**
1. Verifique logs do servidor
2. Verifique status no banco de dados
3. Tente fazer login diretamente

### Status não atualiza
**Causa:**
- Callback não executou corretamente
- API de ativação falhou

**Solução:**
1. Verifique logs do callback
2. Execute manualmente: `UPDATE profiles SET status = 'active' WHERE email = 'teste@seudominio.com'`
3. Tente fazer login

---

## 📝 Logs para Verificar

### No Console do Navegador
```
✅ [createUser] Usuário criado: {...}
✅ [Callback] Código processado com sucesso
✅ [Callback] Usuário ativado
```

### No Terminal do Servidor
```
🔧 [create-entity-user] Validações passaram, criando usuário...
✅ [create-entity-user] Usuário criado no Auth: [user_id]
✅ [create-entity-user] Perfil criado com sucesso
✅ [create-entity-user] Email de confirmação enviado
```

---

## ✅ Critérios de Sucesso

A implementação está funcionando corretamente se:

1. ✅ Usuário é criado com status "inactive"
2. ✅ Email de confirmação é enviado automaticamente
3. ✅ Não é possível criar usuários com email duplicado
4. ✅ Não é possível fazer login sem confirmar email
5. ✅ Após confirmar, status muda para "active"
6. ✅ Após confirmar, login funciona normalmente
7. ✅ Interface mostra badges corretos de status

---

## 🎉 Conclusão

Se todos os testes passaram, a funcionalidade está **100% operacional**!

**Próximos passos:**
- [ ] Testar em produção
- [ ] Monitorar logs de confirmação
- [ ] Adicionar botão de reenvio na interface (futuro)
- [ ] Configurar templates de email personalizados (opcional)

---

**Data do Teste**: ___/___/_____  
**Testado por**: _________________  
**Status**: [ ] Aprovado [ ] Reprovado  
**Observações**: _________________
