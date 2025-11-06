# Correção Crítica - Status Pendente Até Confirmação

## Problema Crítico Identificado

❌ **Trigger ativando contas imediatamente** - antes da confirmação do email
❌ **Status 'active' no momento do registro** - deveria ser 'pending_email'
❌ **Usuários podem fazer login sem confirmar email** - falha de segurança
❌ **Fluxo de confirmação quebrado** - conta já está ativa

## Análise do Problema

### **Trigger Atual (INCORRETO):**
```sql
INSERT INTO public.profiles (
    status,
    registration_completed,
    permissions
) VALUES (
    'active',           -- ❌ ERRO: Ativo imediatamente
    true,               -- ❌ ERRO: Registro completo sem confirmação
    '["read", "write"]' -- ❌ ERRO: Permissões completas sem confirmação
);
```

### **Fluxo Atual (QUEBRADO):**
```
Registro → Trigger → Status 'active' → Email enviado → Confirmação (inútil)
```

### **Fluxo Correto (IMPLEMENTADO):**
```
Registro → Trigger → Status 'pending_email' → Confirmação → Status 'active'
```

## Solução Implementada

### **1. Trigger de Criação Corrigido**

```sql
-- Determinar status baseado na confirmação
IF NEW.email_confirmed_at IS NOT NULL THEN
    initial_status := 'active';
ELSE
    initial_status := 'pending_email';
END IF;

INSERT INTO public.profiles (
    status,
    permissions,
    registration_completed
) VALUES (
    initial_status,                    -- ✅ Pendente até confirmação
    CASE 
        WHEN initial_status = 'active' THEN '["read", "write"]'::jsonb
        ELSE '[]'::jsonb               -- ✅ Sem permissões até confirmação
    END,
    CASE 
        WHEN initial_status = 'active' THEN true
        ELSE false                     -- ✅ Registro incompleto até confirmação
    END
);
```

### **2. Trigger de Confirmação (NOVO)**

```sql
CREATE TRIGGER handle_email_confirmation_trigger
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_email_confirmation();
```

**Função:**
```sql
-- Ativar perfil quando email for confirmado
UPDATE public.profiles 
SET 
    status = 'active',
    registration_completed = true,
    permissions = '["read", "write"]'::jsonb
WHERE id = NEW.id AND status = 'pending_email';
```

### **3. Correção de Usuários Existentes**

**Desativar usuários ativos sem confirmação:**
```sql
UPDATE public.profiles 
SET status = 'pending_email'
WHERE status = 'active' AND email_confirmed_at IS NULL;
```

**Ativar usuários confirmados mas pendentes:**
```sql
UPDATE public.profiles 
SET status = 'active'
WHERE status = 'pending_email' AND email_confirmed_at IS NOT NULL;
```

## Estados dos Usuários

### **Estado 1: Recém Registrado**
- **auth.users**: `email_confirmed_at = NULL`
- **profiles**: `status = 'pending_email'`
- **Pode fazer login**: ❌ NÃO
- **Tem permissões**: ❌ NÃO

### **Estado 2: Email Confirmado**
- **auth.users**: `email_confirmed_at = '2024-01-01 10:00:00'`
- **profiles**: `status = 'active'` (ativado pelo trigger)
- **Pode fazer login**: ✅ SIM
- **Tem permissões**: ✅ SIM

## Fluxo Corrigido

### **1. Registro**
```
Usuário preenche formulário → Supabase cria usuário → Trigger cria perfil 'pending_email'
```

### **2. Email Enviado**
```
Supabase envia email → Usuário recebe link → Status ainda 'pending_email'
```

### **3. Confirmação**
```
Usuário clica link → Supabase confirma email → Trigger ativa perfil → Status 'active'
```

### **4. Login**
```
Usuário tenta login → Verifica status 'active' → Login permitido
```

## Segurança Melhorada

✅ **Usuários não podem fazer login sem confirmar email**
✅ **Permissões concedidas apenas após confirmação**
✅ **Status reflete corretamente o estado do usuário**
✅ **Fluxo de confirmação tem propósito real**

## Verificação

Execute para verificar o estado:

```sql
SELECT 
    u.email,
    u.email_confirmed_at,
    p.status,
    p.registration_completed,
    p.permissions
FROM auth.users u
JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
```

**Resultado esperado:**
- **Email não confirmado**: `status = 'pending_email'`
- **Email confirmado**: `status = 'active'`

## Resultado

✅ **Fluxo de confirmação restaurado**
✅ **Segurança implementada corretamente**
✅ **Usuários existentes corrigidos**
✅ **Triggers funcionando em sequência**
✅ **Status reflete estado real**

**Esta era a causa raiz de todos os problemas de confirmação!**