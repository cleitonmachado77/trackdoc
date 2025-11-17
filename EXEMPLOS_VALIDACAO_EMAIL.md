# 💻 Exemplos de Código - Validação de Email

## 📝 Exemplos de Uso

### 1. Validação no Formulário de Registro

```typescript
// app/register/page.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // 1. Validar formato do email
  if (!formData.email.includes("@")) {
    setError("Email inválido")
    return
  }

  // 2. Verificar se email já existe
  const { data: existingUsers } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', formData.email.toLowerCase().trim())
    .limit(1)

  if (existingUsers && existingUsers.length > 0) {
    setError("Este email já está cadastrado. Faça login ou use outro email.")
    return
  }

  // 3. Criar conta
  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password
  })

  if (error) {
    // Tratar erros específicos
    if (error.message.includes("already registered")) {
      setError("Este email já está cadastrado.")
    } else {
      setError(error.message)
    }
  }
}
```

### 2. Validação no Hook de Autenticação

```typescript
// app/components/simple-auth-context.tsx

const signUp = async (email: string, password: string, fullName: string) => {
  // Normalizar email
  const normalizedEmail = email.toLowerCase().trim()

  // Verificar se já existe
  const { data: existingUsers } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', normalizedEmail)
    .limit(1)

  if (existingUsers && existingUsers.length > 0) {
    return { 
      error: { 
        message: 'Este email já está cadastrado.' 
      } 
    }
  }

  // Criar usuário
  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { full_name: fullName }
    }
  })

  return { error }
}
```

### 3. Validação na API (Backend)

```typescript
// app/api/create-entity-user/route.ts

export async function POST(request: Request) {
  const { email, password, full_name } = await request.json()

  // Normalizar email
  const normalizedEmail = email.toLowerCase().trim()

  // Verificar se email já existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const emailExists = existingUsers?.users?.some(user => 
    user.email?.toLowerCase() === normalizedEmail
  )

  if (emailExists) {
    return NextResponse.json(
      { error: 'Este email já está cadastrado no sistema' },
      { status: 400 }
    )
  }

  // Criar usuário
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    user_metadata: { full_name }
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, user: data.user })
}
```

### 4. Validação no Banco de Dados (SQL)

```sql
-- Função de validação
CREATE OR REPLACE FUNCTION validate_unique_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe (case-insensitive)
  IF EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE LOWER(email) = LOWER(NEW.email) 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Este email já está cadastrado no sistema'
      USING ERRCODE = '23505';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER validate_email_before_insert
  BEFORE INSERT OR UPDATE OF email ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_email();
```

## 🧪 Exemplos de Testes

### Teste 1: Email Novo (Deve Funcionar)

```typescript
// test/auth.test.ts

describe('Registro de Usuário', () => {
  it('deve criar conta com email novo', async () => {
    const email = `test-${Date.now()}@example.com`
    
    const { error } = await supabase.auth.signUp({
      email,
      password: 'senha123'
    })

    expect(error).toBeNull()
  })
})
```

### Teste 2: Email Duplicado (Deve Falhar)

```typescript
it('não deve criar conta com email duplicado', async () => {
  const email = 'existing@example.com'
  
  // Primeira tentativa (deve funcionar)
  await supabase.auth.signUp({
    email,
    password: 'senha123'
  })

  // Segunda tentativa (deve falhar)
  const { error } = await supabase.auth.signUp({
    email,
    password: 'senha456'
  })

  expect(error).not.toBeNull()
  expect(error?.message).toContain('already registered')
})
```

### Teste 3: Case-Insensitive (Deve Falhar)

```typescript
it('deve tratar emails como case-insensitive', async () => {
  // Criar com minúsculas
  await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'senha123'
  })

  // Tentar criar com maiúsculas (deve falhar)
  const { error } = await supabase.auth.signUp({
    email: 'TEST@EXAMPLE.COM',
    password: 'senha456'
  })

  expect(error).not.toBeNull()
})
```

## 🔍 Exemplos de Queries SQL

### Verificar Duplicatas

```sql
-- Encontrar emails duplicados
SELECT 
  LOWER(email) as email,
  COUNT(*) as quantidade,
  STRING_AGG(id::text, ', ') as user_ids
FROM profiles
WHERE email IS NOT NULL
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
```

### Limpar Duplicatas

```sql
-- Remover duplicatas (mantém o mais recente)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(email) 
      ORDER BY created_at DESC
    ) as rn
  FROM profiles
  WHERE email IS NOT NULL
)
DELETE FROM profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

### Verificar Validações Ativas

```sql
-- Verificar índice único
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles' 
AND indexname = 'idx_profiles_email_unique';

-- Verificar função
SELECT proname, pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'validate_unique_email';

-- Verificar trigger
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'validate_email_before_insert';
```

## 🎨 Exemplos de UI/UX

### Mensagem de Erro no Formulário

```typescript
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### Feedback Visual

```typescript
const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

const checkEmailAvailability = async (email: string) => {
  setEmailStatus('checking')
  
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email.toLowerCase())
    .limit(1)

  setEmailStatus(data && data.length > 0 ? 'taken' : 'available')
}

// No input
<Input
  type="email"
  onChange={(e) => {
    setFormData({ ...formData, email: e.target.value })
    checkEmailAvailability(e.target.value)
  }}
/>

{emailStatus === 'checking' && <Loader2 className="animate-spin" />}
{emailStatus === 'available' && <CheckCircle className="text-green-500" />}
{emailStatus === 'taken' && <XCircle className="text-red-500" />}
```

## 📊 Exemplos de Logs

### Log de Sucesso

```typescript
console.log('✅ [Auth] Conta criada:', {
  email: user.email,
  id: user.id,
  created_at: user.created_at
})
```

### Log de Erro

```typescript
console.error('❌ [Auth] Email duplicado:', {
  email: formData.email,
  error: 'Email já cadastrado',
  timestamp: new Date().toISOString()
})
```

## 🔐 Exemplos de Segurança

### Normalização de Email

```typescript
function normalizeEmail(email: string): string {
  return email
    .toLowerCase()      // Converter para minúsculas
    .trim()            // Remover espaços
    .replace(/\s+/g, '') // Remover espaços internos
}

// Uso
const normalizedEmail = normalizeEmail(formData.email)
```

### Validação de Formato

```typescript
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Uso
if (!isValidEmail(formData.email)) {
  setError("Formato de email inválido")
  return
}
```

## 🎯 Boas Práticas

1. **Sempre normalizar emails:**
   ```typescript
   const email = formData.email.toLowerCase().trim()
   ```

2. **Validar antes de enviar:**
   ```typescript
   if (!isValidEmail(email)) return
   if (await emailExists(email)) return
   ```

3. **Mensagens claras:**
   ```typescript
   "Este email já está cadastrado. Faça login ou use outro email."
   ```

4. **Tratamento de erros específicos:**
   ```typescript
   if (error.message.includes("already registered")) {
     // Tratar email duplicado
   } else if (error.message.includes("rate limit")) {
     // Tratar rate limit
   }
   ```

5. **Logs informativos:**
   ```typescript
   console.log('🔍 [Auth] Verificando email:', email)
   console.log('✅ [Auth] Email disponível')
   console.log('❌ [Auth] Email já existe')
   ```

## 📚 Referências

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [PostgreSQL Unique Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [React Hook Form Validation](https://react-hook-form.com/get-started#Applyvalidation)
