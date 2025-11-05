# Send Signup Email - Edge Function

## Descrição
Edge Function para envio de emails de cadastro como fallback quando o SMTP do Supabase não está configurado.

## Como usar

### 1. Deploy da função
```bash
supabase functions deploy send-signup-email
```

### 2. Configurar secrets (se necessário)
```bash
supabase secrets set SUPABASE_URL=https://seuprojetoid.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 3. Chamar a função
```javascript
const { data, error } = await supabase.functions.invoke('send-signup-email', {
  body: {
    email: 'usuario@email.com',
    full_name: 'Nome do Usuário',
    password: 'senha123',
    entity_name: 'Nome da Entidade',
    role: 'Usuário',
    app_url: 'https://seudominio.com'
  }
})
```

## Parâmetros

- `email` (obrigatório): Email do destinatário
- `full_name` (obrigatório): Nome completo do usuário
- `password` (obrigatório): Senha temporária
- `entity_name` (opcional): Nome da entidade
- `role` (opcional): Cargo do usuário
- `app_url` (obrigatório): URL base da aplicação

## Resposta

```json
{
  "success": true,
  "message": "Template de email preparado com sucesso",
  "method": "template_generation",
  "confirmation_url": "https://seudominio.com/auth/callback?token_hash=...",
  "email_template": "HTML do email...",
  "recipient": "usuario@email.com"
}
```

## Nota

Esta função atualmente apenas gera o template HTML do email. Para envio real, integre com:
- SendGrid
- Mailgun
- Resend
- Ou outro provedor de email

## Solução Principal

**Recomendação**: Configure SMTP no Supabase Dashboard em vez de usar esta Edge Function. É mais simples e eficaz.

Veja: `SOLUCAO_RAPIDA_EMAIL.md` no root do projeto.