# 🚀 Guia Rápido - Confirmação de Email para Usuários de Entidades

## Para Administradores

### Como Criar um Novo Usuário

1. **Acesse o Gerenciador**
   - Vá em: `Administração → Usuários`

2. **Clique em "Cadastrar Usuário"**
   - Preencha os dados:
     - Nome Completo *
     - Email *
     - Senha *
     - Função (Usuário, Gerente, Admin, Visualizador)
     - Telefone (opcional)
     - Cargo (opcional)

3. **Clique em "Cadastrar Usuário"**
   - ✅ Sistema cria o usuário
   - ✅ Email de confirmação é enviado automaticamente
   - ✅ Usuário aparece com badge "Aguardando confirmação"

4. **Aguarde a Confirmação**
   - O novo usuário receberá um email
   - Após clicar no link, o status mudará para "Ativo"
   - Então ele poderá fazer login

### Identificando Status dos Usuários

#### Badge Verde "Ativo"
- ✅ Email confirmado
- ✅ Pode fazer login
- ✅ Acesso completo

#### Badge Laranja "Inativo" + Badge Amarelo "Aguardando confirmação"
- ⏳ Email ainda não confirmado
- ❌ Não pode fazer login
- 📧 Precisa clicar no link do email

### Reenviar Email de Confirmação (Futuro)
```
Em breve: Botão "Reenviar Email" para usuários inativos
```

## Para Novos Usuários

### Como Confirmar seu Email

1. **Verifique sua Caixa de Entrada**
   - Procure por email de "TrackDoc" ou "Supabase"
   - Verifique também a pasta de SPAM

2. **Clique no Link de Confirmação**
   - O link é válido por 24 horas
   - Você será redirecionado automaticamente

3. **Aguarde o Redirecionamento**
   - Você verá uma mensagem de sucesso
   - Será redirecionado para a página de login

4. **Faça Login**
   - Use o email e senha fornecidos pelo administrador
   - Acesse a plataforma normalmente

### Problemas Comuns

#### "Não recebi o email"
1. Verifique a pasta de SPAM
2. Aguarde alguns minutos
3. Contate o administrador para reenviar

#### "Link expirado"
1. O link expira em 24 horas
2. Contate o administrador para reenviar
3. Use o novo link recebido

#### "Erro ao fazer login"
1. Confirme que clicou no link do email
2. Verifique se está usando o email correto
3. Verifique se a senha está correta
4. Contate o administrador se o problema persistir

## Fluxo Visual

```
┌─────────────────────────────────────────────────────────────┐
│  1. Admin cria usuário                                      │
│     ↓                                                       │
│  2. Sistema envia email automaticamente                    │
│     ↓                                                       │
│  3. Usuário recebe email                                   │
│     ↓                                                       │
│  4. Usuário clica no link                                  │
│     ↓                                                       │
│  5. Email confirmado automaticamente                       │
│     ↓                                                       │
│  6. Status muda para "Ativo"                              │
│     ↓                                                       │
│  7. Usuário pode fazer login                              │
└─────────────────────────────────────────────────────────────┘
```

## Segurança

### ✅ O que está protegido

- **Email Único**: Não é possível criar dois usuários com o mesmo email
- **Confirmação Obrigatória**: Usuário não pode logar sem confirmar
- **Link Temporário**: Link de confirmação expira em 24 horas
- **Validação Automática**: Sistema valida em múltiplas camadas

### ⚠️ Boas Práticas

1. **Use emails corporativos** para usuários da empresa
2. **Não compartilhe senhas** - cada usuário deve ter a sua
3. **Confirme emails rapidamente** - links expiram em 24h
4. **Mantenha emails atualizados** - para recuperação de senha

## Mensagens do Sistema

### Ao Criar Usuário
```
✅ Usuário [Nome] criado com sucesso! 
   Um email de confirmação foi enviado para [email]. 
   O usuário poderá fazer login após confirmar o email.
```

### Ao Confirmar Email
```
✅ Email confirmado com sucesso! Você já pode fazer login.
```

### Ao Tentar Login sem Confirmar
```
❌ Email não confirmado. 
   Verifique sua caixa de entrada e clique no link de confirmação.
```

### Email Duplicado
```
❌ Este email já está cadastrado no sistema
```

## Suporte

### Para Administradores
- Verifique a lista de usuários regularmente
- Monitore usuários "Aguardando confirmação"
- Contate suporte se emails não estiverem sendo enviados

### Para Usuários
- Contate o administrador da sua entidade
- Forneça seu email cadastrado
- Descreva o problema claramente

---

**Dúvidas?** Entre em contato com o suporte técnico.
