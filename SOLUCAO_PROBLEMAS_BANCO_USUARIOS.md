# 🔧 SOLUÇÃO DEFINITIVA - Problemas de Banco e Usuários

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **Estrutura da Tabela `profiles` Inconsistente**
- ID não referencia corretamente `auth.users(id)`
- Trigger `handle_new_user` não funciona adequadamente
- Criação manual de perfis causa conflitos

### 2. **Foreign Keys Inconsistentes**
- Algumas tabelas referenciam `auth.users(id)`
- Outras referenciam `profiles(id)`
- Causa problemas de integridade referencial

### 3. **Lógica de Criação de Usuários Complexa**
- Código de registro muito complexo
- Múltiplas tentativas de criar o mesmo perfil
- Tratamento de erros inadequado

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. **Correção da Estrutura da Tabela `profiles`**

```sql
-- 1. Corrigir a tabela profiles
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  company TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  permissions JSONB DEFAULT '["read", "write"]',
  avatar_url TEXT,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  position TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  registration_type TEXT,
  entity_role TEXT,
  registration_completed BOOLEAN DEFAULT false,
  selected_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar índices
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_entity_id ON profiles(entity_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_role ON profiles(role);
```

### 2. **Trigger Melhorado para `handle_new_user`**

```sql
-- Função melhorada para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
  user_entity_role TEXT := 'user';
  user_registration_type TEXT := 'individual';
BEGIN
  -- Extrair dados do metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    user_entity_role := COALESCE(NEW.raw_user_meta_data->>'entity_role', 'user');
    user_registration_type := COALESCE(NEW.raw_user_meta_data->>'registration_type', 'individual');
  END IF;

  -- Inserir perfil com dados corretos
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    status,
    entity_role,
    registration_type,
    registration_completed
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    user_role,
    'active',
    user_entity_role,
    user_registration_type,
    CASE 
      WHEN user_registration_type = 'entity_admin' THEN false 
      ELSE true 
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. **Padronização das Foreign Keys**

```sql
-- Corrigir foreign keys para usar profiles(id) consistentemente
ALTER TABLE document_signatures 
DROP CONSTRAINT IF EXISTS document_signatures_user_id_fkey,
ADD CONSTRAINT document_signatures_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE multi_signature_approvals 
DROP CONSTRAINT IF EXISTS multi_signature_approvals_user_id_fkey,
ADD CONSTRAINT multi_signature_approvals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE multi_signature_requests 
DROP CONSTRAINT IF EXISTS multi_signature_requests_requester_id_fkey,
ADD CONSTRAINT multi_signature_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

### 4. **Simplificação do Código de Registro**

```typescript
// Código simplificado para register/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!validateForm()) return

  setIsLoading(true)
  setError("")

  try {
    // 1. Criar usuário com metadata correto
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: registrationType === 'entity' ? 'admin' : 'user',
          entity_role: registrationType === 'entity' ? 'admin' : 'user',
          registration_type: registrationType === 'entity' ? 'entity_admin' : 'individual',
          selected_plan_id: selectedPlanId
        }
      }
    })

    if (error) {
      setError(error.message)
      return
    }

    // 2. Para entidades, criar a entidade após confirmação do email
    if (registrationType === 'entity') {
      // Salvar dados da entidade no localStorage para usar após confirmação
      localStorage.setItem('pendingEntityData', JSON.stringify({
        entityName: formData.entityName,
        entityLegalName: formData.entityLegalName,
        entityCnpj: formData.entityCnpj,
        entityPhone: formData.entityPhone,
        selectedPlanId: selectedPlanId
      }))
    }

    setSuccess("Conta criada com sucesso! Verifique seu email para confirmar.")
    router.push('/confirm-email')

  } catch (err) {
    setError("Erro interno do servidor. Tente novamente.")
  } finally {
    setIsLoading(false)
  }
}
```

### 5. **Políticas RLS Atualizadas**

```sql
-- Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id OR 
  (entity_id IS NOT NULL AND entity_id = (
    SELECT entity_id FROM profiles WHERE id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
```

## 🎯 PRÓXIMOS PASSOS

1. **Executar as correções do banco de dados**
2. **Atualizar o código de registro**
3. **Testar criação de usuários individuais**
4. **Testar criação de usuários de entidade**
5. **Verificar integridade referencial**

## ✅ BENEFÍCIOS DA SOLUÇÃO

- **Consistência**: Todas as foreign keys padronizadas
- **Simplicidade**: Lógica de registro simplificada
- **Confiabilidade**: Trigger robusto para criação de perfis
- **Manutenibilidade**: Código mais limpo e fácil de manter
- **Integridade**: Dados sempre consistentes entre auth.users e profiles