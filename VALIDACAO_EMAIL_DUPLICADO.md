# Validação de Email Duplicado - Sistema de Autenticação

## 📋 Resumo

Implementação de validações em múltiplas camadas para garantir que não seja possível criar contas com e-mails já utilizados no sistema.

## 🔒 Camadas de Proteção Implementadas

### 1. **Validação no Frontend (app/register/page.tsx)**

Antes de tentar criar a conta, o sistema verifica se o email já existe:

```typescript
// Verificar se o email já existe no sistema
const { data: existingUsers, error: checkError } = await supabase
  .from('profiles')
  .select('email')
  .eq('email', formData.email.toLowerCase().trim())
  .limit(1)

if (existingUsers && existingUsers.length > 0) {
  setError("Este email já está cadastrado. Faça login ou use outro email.")
  return
}
```

**Benefícios:**
- Feedback imediato ao usuário
- Evita chamadas desnecessárias ao servidor
- Mensagem de erro clara e amigável

### 2. **Validação no Contexto de Autenticação (simple-auth-context.tsx)**

O método `signUp` também valida antes de criar o usuário:

```typescript
// Verificar se o email já existe antes de tentar criar
const { data: existingUsers } = await supabase
  .from('profiles')
  .select('email')
  .eq('email', email.toLowerCase().trim())
  .limit(1)

if (existingUsers && existingUsers.length > 0) {
  return { 
    error: { 
      message: 'Este email já está cadastrado. Faça login ou use outro email.' 
    } 
  }
}
```

**Benefícios:**
- Proteção adicional caso o método seja chamado diretamente
- Tratamento de erros específicos do Supabase Auth
- Mensagens de erro padronizadas

### 3. **Validação na API de Criação de Usuários (create-entity-user/route.ts)**

A API já possui validação para usuários de entidades:

```typescript
// Verificar se email já existe
const { data: existingUsers } = await supabase.auth.admin.listUsers()
const emailExists = existingUsers?.users?.some(user => 
  user.email?.toLowerCase() === email.toLowerCase()
)

if (emailExists) {
  return NextResponse.json(
    { error: 'Este email já está cadastrado no sistema' },
    { status: 400 }
  )
}
```

**Benefícios:**
- Proteção no backend
- Validação usando admin API do Supabase
- Retorno de erro HTTP apropriado

### 4. **Constraint no Banco de Dados (Migration)**

Criada migration para garantir unicidade no nível do banco:

**Arquivo:** `supabase/migrations/20250117_add_unique_email_constraint.sql`

**Implementações:**

1. **Limpeza de duplicatas existentes:**
   - Remove registros duplicados mantendo apenas o mais recente

2. **Índice único case-insensitive:**
   ```sql
   CREATE UNIQUE INDEX idx_profiles_email_unique ON profiles (LOWER(email));
   ```

3. **Função de validação:**
   ```sql
   CREATE OR REPLACE FUNCTION validate_unique_email()
   RETURNS TRIGGER AS $$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM profiles 
       WHERE LOWER(email) = LOWER(NEW.email) 
       AND id != NEW.id
     ) THEN
       RAISE EXCEPTION 'Este email já está cadastrado no sistema';
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **Trigger automático:**
   ```sql
   CREATE TRIGGER validate_email_before_insert
     BEFORE INSERT OR UPDATE OF email ON profiles
     FOR EACH ROW
     EXECUTE FUNCTION validate_unique_email();
   ```

**Benefícios:**
- Proteção definitiva no nível do banco de dados
- Impossível criar duplicatas mesmo com acesso direto ao banco
- Validação case-insensitive (email@test.com = EMAIL@TEST.COM)
- Mensagem de erro clara quando há tentativa de duplicação

## 🎯 Tratamento de Erros

### Mensagens de Erro Implementadas:

1. **Email duplicado:**
   - "Este email já está cadastrado. Faça login ou use outro email."

2. **Rate limit excedido:**
   - "Muitas tentativas de registro. Aguarde alguns minutos e tente novamente."

3. **Email inválido:**
   - "Email inválido. Verifique o endereço de email e tente novamente."

4. **Erro genérico:**
   - "Erro interno do servidor. Tente novamente."

## 📊 Fluxo de Validação

```
Usuário tenta criar conta
        ↓
[1] Validação Frontend
    ├─ Email existe? → Erro: "Email já cadastrado"
    └─ Email não existe → Continua
        ↓
[2] Validação no Contexto Auth
    ├─ Email existe? → Erro: "Email já cadastrado"
    └─ Email não existe → Continua
        ↓
[3] Supabase Auth (signUp)
    ├─ Email existe? → Erro do Supabase
    └─ Email não existe → Continua
        ↓
[4] Trigger no Banco de Dados
    ├─ Email existe? → Exception SQL
    └─ Email não existe → Usuário criado ✅
```

## 🔧 Como Aplicar a Migration

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo do arquivo `20250117_add_unique_email_constraint.sql`
4. Execute a query

### Opção 2: Via Supabase CLI
```bash
supabase db push
```

## ✅ Testes Recomendados

1. **Teste de criação normal:**
   - Criar conta com email novo → Deve funcionar

2. **Teste de email duplicado:**
   - Tentar criar conta com email existente → Deve mostrar erro

3. **Teste case-insensitive:**
   - Criar conta com "test@email.com"
   - Tentar criar com "TEST@EMAIL.COM" → Deve mostrar erro

4. **Teste de atualização:**
   - Atualizar email de um usuário para email de outro → Deve mostrar erro

## 🛡️ Segurança

- ✅ Validação em múltiplas camadas
- ✅ Case-insensitive (evita bypass com maiúsculas/minúsculas)
- ✅ Trim automático (remove espaços)
- ✅ Constraint no banco de dados (proteção definitiva)
- ✅ Mensagens de erro claras sem expor informações sensíveis

## 📝 Notas Importantes

1. **Supabase Auth já possui validação nativa:**
   - O Supabase Auth já impede emails duplicados por padrão
   - As validações adicionais fornecem feedback mais rápido e mensagens melhores

2. **Performance:**
   - A validação no frontend evita chamadas desnecessárias ao servidor
   - O índice único no banco melhora a performance das consultas

3. **Manutenção:**
   - Todas as validações usam `.toLowerCase().trim()` para consistência
   - Mensagens de erro padronizadas em todo o sistema

## 🎉 Resultado Final

O sistema agora possui **4 camadas de proteção** contra emails duplicados:
1. ✅ Validação no formulário de registro
2. ✅ Validação no contexto de autenticação
3. ✅ Validação na API de criação de usuários
4. ✅ Constraint e trigger no banco de dados

**É impossível criar contas com emails duplicados!** 🔒
