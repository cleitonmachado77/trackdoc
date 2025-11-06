# Correção do Erro "invalid_code"

## Problema Identificado

❌ **Erro**: `error=invalid_code` na URL de confirmação
❌ **Causa**: Código de confirmação sendo rejeitado pelo Supabase
❌ **Resultado**: Usuário não consegue confirmar email

## Análise dos Logs

```
🔧 Parâmetros recebidos: code=false, confirmed=null, error=invalid_code
🔧 URL completa: https://www.trackdoc.app.br/confirm-email/?error=invalid_code
❌ Erro na URL detectado: invalid_code
```

**Diagnóstico**: O callback está falhando ao processar o código e redirecionando com erro.

## Possíveis Causas

### 1. **Código Expirado**
- Links de confirmação têm tempo limitado
- Usuário pode ter demorado para clicar

### 2. **Código Já Usado**
- Usuário clicou múltiplas vezes no link
- Código foi processado anteriormente

### 3. **Problema no PKCE Flow**
- Falta de code_verifier
- Configuração incorreta do Supabase

### 4. **Configuração de URL**
- URL de callback incorreta no Supabase
- Redirecionamento malformado

## Soluções Implementadas

### 1. **Callback Melhorado**

**Antes**:
```typescript
const { data, error } = await supabase.auth.exchangeCodeForSession(code)
if (!error && data.session) {
  // sucesso
} else {
  return NextResponse.redirect(`${baseUrl}/confirm-email?error=invalid_code`)
}
```

**Agora**:
```typescript
const { data, error } = await supabase.auth.exchangeCodeForSession(code)
if (!error && data.session) {
  // sucesso
} else {
  // Tentar método alternativo
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session?.user) {
    return NextResponse.redirect(`${baseUrl}/confirm-email?confirmed=true`)
  }
  // Fallback para cliente
  return NextResponse.redirect(`${baseUrl}/confirm-email?code=${code}&callback_failed=true`)
}
```

### 2. **Processamento no Cliente (Fallback)**

Se o callback falhar, o cliente tenta processar:

```typescript
if (code && callbackFailed === 'true') {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (!error && data.session) {
    // Ativar usuário no cliente
  }
}
```

### 3. **Mensagens de Erro Específicas**

```typescript
switch (errorFromUrl) {
  case 'invalid_code':
    errorMessage = 'Código de confirmação inválido ou expirado.'
    break
  case 'processing_failed':
    errorMessage = 'Falha no processamento. Tente fazer login.'
    break
  // ...
}
```

### 4. **Logs Detalhados**

- Logs no servidor (callback)
- Logs no cliente (página de confirmação)
- Detalhes de erro específicos

## Fluxo Corrigido

### **Cenário 1 - Sucesso no Servidor**
```
Link → Callback → Código processado → Usuário ativado → confirmed=true&activated=true
```

### **Cenário 2 - Fallback no Cliente**
```
Link → Callback falha → code=123&callback_failed=true → Cliente processa → Sucesso
```

### **Cenário 3 - Erro Definitivo**
```
Link → Callback falha → Cliente falha → Erro específico com instruções
```

## Verificações Necessárias

### **No Supabase Dashboard:**

1. **Authentication → URL Configuration**
   - Site URL: `https://www.trackdoc.app.br`
   - Redirect URLs: `https://www.trackdoc.app.br/auth/callback`

2. **Authentication → Settings**
   - Confirm email: Enabled
   - Email templates: Verificar se URL está correta

### **No Código:**

1. **Variáveis de ambiente**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://dhdeyznmncgukexofcxy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

2. **URL de redirecionamento no registro**
   ```typescript
   emailRedirectTo: 'https://www.trackdoc.app.br/auth/callback'
   ```

## Teste da Correção

1. **Registrar nova conta**
2. **Clicar no link imediatamente** (código fresco)
3. **Verificar logs na página**
4. **Confirmar se mostra sucesso**

## Próximos Passos

Se ainda houver erro:

1. **Verificar configuração do Supabase**
2. **Testar com código fresco** (novo registro)
3. **Verificar se usuário já está confirmado** no banco
4. **Analisar logs detalhados** do callback

## Resultado Esperado

✅ **Callback processa código com sucesso**
✅ **Ou fallback no cliente funciona**
✅ **Mensagens de erro específicas e úteis**
✅ **Logs detalhados para debug**