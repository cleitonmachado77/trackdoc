# 📋 Estrutura Real das Tabelas - Análise Completa

## 🏢 Tabela `entities`

### Campos Disponíveis:
- `id` (uuid, PK, auto-generated)
- `name` (text, NOT NULL) - Nome da entidade
- `legal_name` (text, nullable) - Razão social
- `cnpj` (text, nullable, unique) - CNPJ da empresa
- `email` (text, NOT NULL) - Email da entidade
- `phone` (text, nullable) - Telefone
- `address` (jsonb, nullable) - Endereço estruturado
- `logo_url` (text, nullable) - URL do logo
- `status` (text, default 'active') - Status: active, inactive, suspended
- `subscription_plan_id` (uuid, nullable) - FK para plans
- `max_users` (integer, default 5) - Máximo de usuários
- `current_users` (integer, default 0) - Usuários atuais
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())
- `admin_user_id` (uuid, nullable) - FK para profiles (admin)
- `type` (text, default 'company') - Tipo: company, organization, individual
- `description` (text, nullable) - Descrição

### Constraints:
- Status: 'active', 'inactive', 'suspended'
- Type: 'company', 'organization', 'individual'
- CNPJ único
- Admin user FK para profiles

## 👥 Tabela `profiles`

### Campos Disponíveis:
- `id` (uuid, PK) - FK para auth.users
- `full_name` (text, nullable)
- `email` (text, nullable, unique)
- `phone` (text, nullable)
- `company` (text, nullable)
- `role` (text, default 'user') - user, admin, manager, viewer, super_admin
- `status` (text, default 'active') - active, inactive, suspended
- `permissions` (jsonb, default ["read", "write"])
- `avatar_url` (text, nullable)
- `entity_id` (uuid, nullable) - FK para entities
- `department_id` (uuid, nullable)
- `position` (text, nullable)
- `last_login` (timestamp, nullable)
- `registration_type` (text, default 'individual') - individual, entity_admin, entity_user
- `entity_role` (text, default 'user') - user, admin, manager, viewer
- `registration_completed` (boolean, default true)
- `selected_plan_id` (uuid, nullable)
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())

## 📨 Tabela `entity_invitations`

### Campos Disponíveis:
- `id` (uuid, PK, auto-generated)
- `entity_id` (uuid, nullable) - FK para entities
- `email` (text, NOT NULL)
- `role` (text, default 'user') - user, admin, manager, viewer
- `status` (text, default 'pending') - pending, accepted, expired, cancelled
- `invited_by` (uuid, nullable) - FK para profiles
- `token` (text, NOT NULL, unique)
- `expires_at` (timestamp, NOT NULL)
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())
- `accepted_at` (timestamp, nullable)
- `message` (text, nullable)
- `entity_role` (text, nullable) - user, admin, manager, viewer

## 💳 Tabela `entity_subscriptions`

### Campos Disponíveis:
- `id` (uuid, PK, auto-generated)
- `entity_id` (uuid, nullable) - FK para entities
- `plan_id` (uuid, nullable) - FK para plans
- `status` (text, default 'active') - active, canceled, expired, trial
- `current_period_start` (timestamp, nullable)
- `current_period_end` (timestamp, nullable)
- `trial_start` (timestamp, nullable)
- `trial_end` (timestamp, nullable)
- `is_trial` (boolean, default false)
- `auto_renew` (boolean, default true)
- `payment_method_id` (text, nullable)
- `next_billing_date` (timestamp, nullable)
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())
- `expires_at` (timestamp, nullable)

## 🔍 Diferenças Identificadas

### ❌ Campos que estavam sendo usados incorretamente:
1. **`website`** - Não existe na tabela entities
2. **`address`** - É JSONB, não text simples
3. **`email`** - É obrigatório na entities (NOT NULL)

### ✅ Campos que devem ser incluídos:
1. **`legal_name`** - Razão social (importante para empresas)
2. **`cnpj`** - CNPJ da empresa (único)
3. **`email`** - Email da entidade (obrigatório)
4. **`admin_user_id`** - Deve ser definido como o usuário atual

## 🔧 Ajustes Necessários

### 1. Formulário de Criação:
- ✅ Manter: name, type, description, phone
- ❌ Remover: website (não existe)
- ✅ Adicionar: legal_name, cnpj, email
- 🔧 Ajustar: address (JSONB estruturado)

### 2. Validações:
- Email obrigatório
- CNPJ único (se preenchido)
- Type deve ser: company, organization, individual
- Status padrão: active

### 3. Relacionamentos:
- admin_user_id deve ser o usuário atual
- entity_id no profiles deve ser atualizado
- entity_role no profiles deve ser 'admin'