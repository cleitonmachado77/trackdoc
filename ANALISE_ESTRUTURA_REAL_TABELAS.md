# 📋 Análise da Estrutura Real das Tabelas

## 🔍 Tabela `profiles` - Campos Disponíveis

### **Campos Confirmados:**
```sql
- id (uuid, PK) ✅
- full_name (text, nullable) ✅
- email (text, nullable, unique) ✅
- phone (text, nullable) ✅
- company (text, nullable) ✅
- role (text, default 'user') ✅
- status (text, default 'active') ✅
- permissions (jsonb, default '["read", "write"]') ✅
- avatar_url (text, nullable) ✅
- entity_id (uuid, nullable) ✅ FK para entities
- department_id (uuid, nullable) ✅
- position (text, nullable) ✅
- last_login (timestamp, nullable) ✅
- registration_type (text, default 'individual') ✅
- entity_role (text, default 'user') ✅
- registration_completed (boolean, default true) ✅
- selected_plan_id (uuid, nullable) ✅
- created_at (timestamp, default now()) ✅
- updated_at (timestamp, default now()) ✅
```

### **Constraints Importantes:**
```sql
- entity_role: 'user', 'admin', 'manager', 'viewer'
- registration_type: 'individual', 'entity_admin', 'entity_user'
- role: 'user', 'admin', 'manager', 'viewer', 'super_admin'
- status: 'active', 'inactive', 'suspended'
```

## 🔍 Tabela `entities` - Campos Disponíveis

### **Campos Confirmados:**
```sql
- id (uuid, PK) ✅
- name (text, NOT NULL) ✅
- legal_name (text, nullable) ✅
- cnpj (text, nullable, unique) ✅
- email (text, NOT NULL) ✅
- phone (text, nullable) ✅
- address (jsonb, nullable) ✅
- logo_url (text, nullable) ✅
- status (text, default 'active') ✅
- subscription_plan_id (uuid, nullable) ✅
- max_users (integer, default 5) ✅
- current_users (integer, default 0) ✅
- created_at (timestamp, default now()) ✅
- updated_at (timestamp, default now()) ✅
- admin_user_id (uuid, nullable) ✅ FK para profiles
- type (text, default 'company') ✅
- description (text, nullable) ✅
```

## ❌ Problemas Identificados no Código

### **1. Campo `department` vs `department_id`**
```typescript
// CÓDIGO ATUAL (INCORRETO)
department: userData.department?.trim() || null

// ESTRUTURA REAL
department_id (uuid, nullable) // É um ID, não texto!
```

### **2. Query com Campos Incorretos**
```typescript
// CÓDIGO ATUAL
.select('id, full_name, email, entity_role, status, created_at')

// PROBLEMA: Todos os campos existem, mas podem estar sendo mal utilizados
```

### **3. Inserção com Campos Incorretos**
```typescript
// CÓDIGO ATUAL (PODE ESTAR INCORRETO)
department: userData.department?.trim() // Deveria ser department_id
```

## 🔧 Correções Necessárias

### **1. Corrigir Query de Busca**
```typescript
// CORRETO - Todos os campos existem
.select(`
  id, 
  full_name, 
  email, 
  entity_role, 
  status, 
  created_at,
  last_login,
  phone,
  department_id,
  position
`)
```

### **2. Corrigir Inserção de Usuário**
```typescript
// CORRETO
{
  id: userId,
  full_name: userData.full_name.trim(),
  email: userData.email.trim().toLowerCase(),
  entity_id: profileData.entity_id,
  entity_role: userData.entity_role,
  status: 'active',
  registration_type: 'entity_user',
  registration_completed: true,
  phone: userData.phone?.trim() || null,
  position: userData.position?.trim() || null,
  // department_id seria um UUID, não texto
  // department_id: null (por enquanto)
}
```

### **3. Interface EntityUser**
```typescript
interface EntityUser {
  id: string
  full_name: string | null
  email: string | null
  entity_role: 'user' | 'admin' | 'manager' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  last_login: string | null
  phone: string | null
  department_id: string | null  // UUID, não texto
  position: string | null
}
```

## 🎯 Plano de Correção

### **Etapa 1: Corrigir Query**
- Usar todos os campos corretos da tabela profiles
- Verificar se todos os campos existem

### **Etapa 2: Corrigir Inserção**
- Usar apenas campos que existem
- Respeitar tipos de dados (UUID vs TEXT)

### **Etapa 3: Corrigir Interface**
- Atualizar tipos TypeScript
- Garantir compatibilidade total

### **Etapa 4: Testar**
- Verificar se query funciona
- Testar inserção de usuário
- Confirmar estatísticas