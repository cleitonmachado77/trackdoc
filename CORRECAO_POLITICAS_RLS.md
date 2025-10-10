# 🔧 Correção - Usando Políticas RLS em vez de Função

## ❌ Problema Identificado

**Erro:** `Could not find the function public.create_entity_user_profile(...) in the schema cache`

**Causa:** O código estava tentando usar a função `create_entity_user_profile` que não foi criada no banco, apenas as políticas RLS foram executadas.

## ✅ Solução Implementada

### **Abordagem Escolhida: Políticas RLS**

Em vez de criar uma função no banco, utilizamos as políticas RLS que já foram executadas para permitir que admins de entidade criem perfis para usuários da sua entidade.

### **Políticas RLS Aplicadas:**

```sql
-- Política para INSERT - Permite admin criar perfis para sua entidade
CREATE POLICY "Entity admins can create profiles for their entity users" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = id  -- Próprio usuário
  OR
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile 
    JOIN entities e ON e.admin_user_id = admin_profile.id 
    WHERE admin_profile.id = auth.uid() 
    AND e.id = entity_id
  )
);

-- Política para UPDATE - Permite admin atualizar perfis da sua entidade
CREATE POLICY "Users can update their own profile or entity admins can update entity users" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = id  -- Próprio usuário
  OR 
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile 
    JOIN entities e ON e.admin_user_id = admin_profile.id 
    WHERE admin_profile.id = auth.uid() 
    AND e.id = entity_id
  )
);
```

### **Código Atualizado:**

```typescript
// ❌ ANTES: Tentava usar função inexistente
const { data: profileResult, error: profileError } = await supabase
  .rpc('create_entity_user_profile', { ... })

// ✅ DEPOIS: Usa inserção direta com políticas RLS
const { error: insertError } = await supabase
  .from('profiles')
  .insert([{
    id: authData.user.id,
    full_name: messageData.full_name,
    email: invitationData.email,
    entity_id: invitationData.entity_id,
    entity_role: invitationData.entity_role,
    // ... outros campos
  }])
```

## 🎯 Como as Políticas Funcionam

### **Verificação de Permissão:**

1. **Para o próprio usuário:** `auth.uid() = id`
   - Usuário pode criar/atualizar seu próprio perfil

2. **Para admin de entidade:** 
   ```sql
   EXISTS (
     SELECT 1 
     FROM profiles admin_profile 
     JOIN entities e ON e.admin_user_id = admin_profile.id 
     WHERE admin_profile.id = auth.uid() 
     AND e.id = entity_id
   )
   ```
   - Verifica se usuário logado (`auth.uid()`) é admin de uma entidade
   - Verifica se a entidade do perfil sendo criado é a mesma que ele administra

### **Fluxo de Validação:**

1. **Usuário tenta inserir perfil** na tabela `profiles`
2. **RLS verifica** se `auth.uid() = id` (próprio perfil) ✅
3. **Se não**, verifica se é admin da entidade do perfil ✅
4. **Se sim**, permite a operação ✅
5. **Se não**, bloqueia com erro de RLS ❌

## 📋 Vantagens da Abordagem com Políticas

### **✅ Benefícios:**

- **Nativo do PostgreSQL** - Usa recursos padrão do banco
- **Sem funções customizadas** - Não precisa criar código adicional
- **Segurança robusta** - RLS é testado e confiável
- **Performance** - Otimizado pelo PostgreSQL
- **Auditoria** - Logs automáticos do banco

### **🔒 Segurança:**

- **Verificação automática** - Toda operação é validada
- **Não pode ser bypassed** - Aplicado em nível de banco
- **Granular** - Controle fino sobre permissões
- **Auditável** - Logs de todas as operações

## 🔍 Como Verificar se Está Funcionando

### **1. Verificar Políticas Aplicadas:**
Execute o arquivo `SQL_VERIFICAR_POLITICAS.sql` no Supabase para ver se as políticas foram criadas corretamente.

### **2. Testar Aprovação:**
1. Criar convite via interface
2. Clicar "Aprovar" no convite pendente
3. Verificar logs no console:

```
⚠️ [approveInvitation] Perfil não foi criado pelo trigger, criando com políticas RLS...
✅ [approveInvitation] Perfil criado com políticas RLS
✅ [approveInvitation] Convite aprovado com sucesso!
```

### **3. Verificar no Banco:**
```sql
-- Verificar se perfil foi criado
SELECT id, full_name, email, entity_id, entity_role, status 
FROM profiles 
WHERE email = 'email-do-convite@empresa.com';
```

## 🚨 Possíveis Problemas e Soluções

### **Problema 1: Políticas não aplicadas corretamente**
**Solução:** Execute novamente o `SQL_POLITICA_RLS_PROFILES.sql`

### **Problema 2: RLS não habilitado**
**Solução:** 
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### **Problema 3: Usuário não é admin da entidade**
**Verificação:**
```sql
SELECT 
  p.id as user_id,
  p.full_name,
  e.id as entity_id,
  e.name as entity_name,
  e.admin_user_id
FROM profiles p
LEFT JOIN entities e ON e.admin_user_id = p.id
WHERE p.id = auth.uid();
```

### **Problema 4: Entity_id incorreto**
**Verificação:** Confirmar se o `entity_id` no convite está correto e corresponde a uma entidade onde o usuário logado é admin.

## 📊 Logs Esperados

### **Sucesso:**
```
🔍 [approveInvitation] Aprovando convite: usuario@empresa.com
📋 [approveInvitation] Dados do convite: {...}
🚀 [approveInvitation] Criando usuário real...
✅ [approveInvitation] Usuário criado no auth: uuid-do-usuario
⏳ [approveInvitation] Aguardando trigger criar perfil...
⚠️ [approveInvitation] Perfil não foi criado pelo trigger, criando com políticas RLS...
✅ [approveInvitation] Perfil criado com políticas RLS
✅ [approveInvitation] Convite aprovado com sucesso!
```

### **Erro de Permissão:**
```
❌ [approveInvitation] Erro ao criar perfil: new row violates row-level security policy
```
**Solução:** Verificar se usuário é admin da entidade e se políticas estão corretas.

## 🎯 Resultado Final

### **✅ Benefícios Alcançados:**
- **Sem dependência de funções** customizadas
- **Segurança nativa** do PostgreSQL
- **Código mais simples** e direto
- **Performance otimizada** pelo banco
- **Manutenção facilitada**

### **🚀 Próximos Passos:**
1. Verificar se políticas estão aplicadas (usar SQL_VERIFICAR_POLITICAS.sql)
2. Testar aprovação de convite
3. Confirmar criação do perfil
4. Validar login do usuário

---

## 🎉 Status Final

✅ **CÓDIGO ATUALIZADO PARA USAR POLÍTICAS RLS**  
✅ **SEM DEPENDÊNCIA DE FUNÇÕES CUSTOMIZADAS**  
✅ **SEGURANÇA NATIVA DO POSTGRESQL**  
✅ **PROCESSO SIMPLIFICADO E ROBUSTO**  
✅ **APROVAÇÃO DEVE FUNCIONAR CORRETAMENTE**  

**Teste a aprovação de convites - agora deve funcionar com as políticas RLS!** 🚀