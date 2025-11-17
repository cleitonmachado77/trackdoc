# 📋 Passo a Passo - Validação de Email Duplicado

## ✅ O que foi feito automaticamente

Os seguintes arquivos já foram modificados e estão prontos:

1. ✅ `app/register/page.tsx` - Validação no formulário de registro
2. ✅ `app/components/simple-auth-context.tsx` - Validação no contexto de autenticação
3. ✅ `supabase/migrations/20250117_add_unique_email_constraint.sql` - Migration criada
4. ✅ `APLICAR_VALIDACAO_EMAIL.sql` - Script SQL pronto para executar

## 🚀 O que você precisa fazer

### PASSO 1: Aplicar a validação no banco de dados

#### Opção A: Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione seu projeto TrackDoc

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Ou acesse diretamente: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql`

3. **Execute o script:**
   - Clique em "New Query"
   - Abra o arquivo `APLICAR_VALIDACAO_EMAIL.sql` no seu editor
   - Copie TODO o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" (ou pressione Ctrl+Enter)

4. **Verifique o resultado:**
   - Se aparecer "Success. No rows returned", está correto! ✅
   - Se aparecer algum erro, leia a mensagem e me avise

#### Opção B: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
cd seu-projeto
supabase db push
```

### PASSO 2: Testar a validação

#### Teste 1: Verificar se há duplicatas atuais

Execute no SQL Editor:

```sql
SELECT 
  LOWER(email) as email,
  COUNT(*) as quantidade
FROM profiles
WHERE email IS NOT NULL
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
```

**Resultado esperado:** Nenhuma linha (sem duplicatas)

#### Teste 2: Tentar criar email duplicado

1. Acesse sua aplicação: `/register`
2. Tente criar uma conta com um email que já existe
3. **Resultado esperado:** Mensagem de erro "Este email já está cadastrado. Faça login ou use outro email."

#### Teste 3: Verificar case-insensitive

1. Se você tem uma conta com "teste@email.com"
2. Tente criar com "TESTE@EMAIL.COM"
3. **Resultado esperado:** Mesmo erro de email duplicado

### PASSO 3: Verificar se tudo está funcionando

Execute no SQL Editor:

```sql
-- Verificar índice único
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles' 
AND indexname = 'idx_profiles_email_unique';

-- Verificar função de validação
SELECT proname
FROM pg_proc
WHERE proname = 'validate_unique_email';

-- Verificar trigger
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'validate_email_before_insert';
```

**Resultado esperado:** 
- 1 linha para o índice
- 1 linha para a função
- 1 linha para o trigger

## 🎯 Checklist Final

Marque cada item conforme completar:

- [ ] Executei o script SQL no Supabase Dashboard
- [ ] Verifiquei que não há duplicatas no banco
- [ ] Testei criar conta com email novo (funcionou)
- [ ] Testei criar conta com email existente (mostrou erro)
- [ ] Testei com maiúsculas/minúsculas (mostrou erro)
- [ ] Verifiquei que índice, função e trigger foram criados

## ❓ Problemas Comuns

### Erro: "relation profiles does not exist"
**Solução:** A tabela profiles não existe. Execute primeiro as migrations básicas do sistema.

### Erro: "permission denied"
**Solução:** Você precisa ter permissões de admin no Supabase. Use o SQL Editor do Dashboard.

### Erro ao criar conta: "Email rate limit exceeded"
**Solução:** Aguarde alguns minutos. O Supabase limita tentativas de registro.

### Validação não está funcionando
**Solução:** 
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login novamente
3. Verifique se o script SQL foi executado com sucesso

## 📞 Precisa de Ajuda?

Se encontrar algum problema:

1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Leia o arquivo `VALIDACAO_EMAIL_DUPLICADO.md` para mais detalhes
4. Me avise qual erro está aparecendo

## 🎉 Pronto!

Após completar todos os passos, seu sistema estará **100% protegido** contra emails duplicados!

**Camadas de proteção ativas:**
- ✅ Validação no formulário (UX)
- ✅ Validação no código (Segurança)
- ✅ Validação no Supabase Auth (Nativo)
- ✅ Constraint no banco de dados (Definitivo)

**É impossível criar contas duplicadas!** 🔒
