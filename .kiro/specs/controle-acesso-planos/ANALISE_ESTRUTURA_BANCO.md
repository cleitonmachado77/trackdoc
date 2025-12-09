# 🔍 ANÁLISE DA ESTRUTURA DO BANCO DE DADOS

## 📊 Estrutura da Tabela `subscriptions`

Baseado na estrutura real fornecida pelo Supabase:

### Campos Obrigatórios (NOT NULL):
```sql
- id: UUID (PRIMARY KEY, auto-gerado)
- plan_name: TEXT NOT NULL
- plan_price: NUMERIC(10,2) NOT NULL
```

### Campos Opcionais (NULLABLE):
```sql
- user_id: UUID (referência ao usuário)
- plan_id: UUID (referência à tabela plans)
- plan_description: TEXT
- status: TEXT (default: 'active')
- current_period_start: TIMESTAMP WITH TIME ZONE
- current_period_end: TIMESTAMP WITH TIME ZONE
- trial_start_date: TIMESTAMP WITH TIME ZONE
- trial_end_date: TIMESTAMP WITH TIME ZONE
- is_trial: BOOLEAN (default: false)
- features: JSONB
- created_at: TIMESTAMP WITH TIME ZONE (default: now())
- updated_at: TIMESTAMP WITH TIME ZONE (default: now())
- auto_renew: BOOLEAN (default: true)
- payment_method_id: TEXT
- next_billing_date: TIMESTAMP WITH TIME ZONE
- entity_id: UUID (referência à tabela entities)
- current_users: INTEGER (default: 1)
- current_storage_gb: NUMERIC(10,2) (default: 0)
- canceled_at: TIMESTAMP WITH TIME ZONE
- start_date: TIMESTAMP WITH TIME ZONE (default: now())
- end_date: TIMESTAMP WITH TIME ZONE
```

### Constraints:
```sql
- subscriptions_pkey: PRIMARY KEY (id)
- subscriptions_entity_id_fkey: FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL
- subscriptions_plan_id_fkey: FOREIGN KEY (plan_id) REFERENCES plans(id)
- subscriptions_status_check: CHECK (status IN ('active', 'canceled', 'expired', 'trial'))
```

### Triggers:
```sql
- check_subscription_trial_expiration: BEFORE INSERT OR UPDATE
- update_subscriptions_updated_at: BEFORE UPDATE
```

---

## 📊 Estrutura da Tabela `plans`

### Campos:
```sql
- id: UUID (PRIMARY KEY, auto-gerado)
- name: TEXT NOT NULL (UNIQUE)
- description: TEXT
- price_monthly: NUMERIC(10,2) NOT NULL
- price_yearly: NUMERIC(10,2)
- max_users: INTEGER (default: 1)
- max_storage_gb: INTEGER (default: 1)
- max_documents: INTEGER (default: 10)
- trial_days: INTEGER (default: 0)
- is_trial: BOOLEAN (default: false)
- features: JSONB (default: '[]')
- is_active: BOOLEAN (default: true)
- created_at: TIMESTAMP WITH TIME ZONE (default: now())
- updated_at: TIMESTAMP WITH TIME ZONE (default: now())
- type: VARCHAR(50) (ex: 'basico', 'profissional', 'enterprise')
- interval: VARCHAR(20) (default: 'monthly')
- usuario_adicional_preco: NUMERIC(10,2)
- armazenamento_extra_preco: NUMERIC(10,2)
```

### Constraints:
```sql
- plans_pkey: PRIMARY KEY (id)
- plans_name_key: UNIQUE (name)
```

---

## 📊 Estrutura da Tabela `profiles`

### Campos Principais:
```sql
- id: UUID (PRIMARY KEY, referência a auth.users)
- full_name: TEXT
- email: TEXT (UNIQUE)
- phone: TEXT
- company: TEXT
- role: TEXT (default: 'user')
- status: TEXT (default: 'active')
- permissions: JSONB (default: '["read", "write"]')
- avatar_url: TEXT
- entity_id: UUID (referência à entidade)
- department_id: UUID
- position: TEXT
- last_login: TIMESTAMP WITH TIME ZONE
- registration_type: TEXT (default: 'individual')
- entity_role: TEXT (default: 'user')
- registration_completed: BOOLEAN (default: true)
- selected_plan_id: UUID
- created_at: TIMESTAMP WITH TIME ZONE (default: now())
- updated_at: TIMESTAMP WITH TIME ZONE (default: now())
- deleted_at: TIMESTAMP WITH TIME ZONE
```

### Constraints:
```sql
- profiles_pkey: PRIMARY KEY (id)
- profiles_email_unique: UNIQUE (email)
- profiles_email_key: UNIQUE (email)
- profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
- profiles_entity_role_check: CHECK (entity_role IN ('user', 'admin', 'manager', 'viewer'))
- profiles_registration_type_check: CHECK (registration_type IN ('individual', 'entity_admin', 'entity_user'))
- profiles_role_check: CHECK (role IN ('user', 'admin', 'manager', 'viewer', 'super_admin'))
- profiles_status_check: CHECK (status IN ('active', 'inactive', 'suspended', 'pending_confirmation', 'deleted'))
```

### Triggers Existentes:
```sql
- sync_entity_count_on_profile_change: AFTER INSERT OR DELETE OR UPDATE
- trigger_check_email_unique: BEFORE INSERT OR UPDATE OF email
- update_profiles_updated_at: BEFORE UPDATE
- validate_email_before_insert: BEFORE INSERT OR UPDATE OF email
```

---

## ⚠️ Problemas Identificados

### 1. Campos Obrigatórios Não Documentados
**Problema:** A tabela `subscriptions` tem campos `plan_name` e `plan_price` como NOT NULL, mas isso não estava documentado inicialmente.

**Impacto:** Tentativas de INSERT sem esses campos falhavam com erro NOT NULL constraint.

**Solução:** Sempre buscar `name` e `price_monthly` da tabela `plans` e inserir em `plan_name` e `plan_price`.

### 2. Usuários Criados Sem Subscription
**Problema:** Não existe trigger automático para criar subscription quando um novo usuário é criado.

**Impacto:** Usuário Pedro foi criado mas não tem subscription, causando erros no sistema.

**Solução:** Criar trigger `auto_create_subscription` que executa AFTER INSERT em `profiles`.

### 3. Duplicação de Dados
**Problema:** A tabela `subscriptions` armazena `plan_name` e `plan_price` além de ter `plan_id` (foreign key).

**Motivo:** Provavelmente para manter histórico (se o plano mudar, a subscription mantém os valores originais).

**Implicação:** Sempre preencher ambos os campos ao criar subscription.

---

## ✅ Correções Aplicadas

### 1. SQL para Criar Subscription do Pedro
**Arquivo:** `migrations/create_subscription_pedro_v2.sql`

**Mudanças:**
- ✅ Busca `name`, `description`, `price_monthly` e `type` da tabela `plans`
- ✅ Insere em `plan_name`, `plan_description`, `plan_price` na subscription
- ✅ Preenche todos os campos obrigatórios
- ✅ Tratamento de erros robusto
- ✅ Mensagens informativas com emojis

### 2. Trigger Automático
**Arquivo:** `migrations/auto_create_subscription_trigger_v2.sql`

**Mudanças:**
- ✅ Remove trigger/função existente antes de criar (evita conflitos)
- ✅ Busca dados completos do plano
- ✅ Preenche todos os campos obrigatórios
- ✅ Não falha a criação do usuário se houver erro (EXCEPTION handler)
- ✅ Mensagens informativas com emojis

### 3. SQL de Diagnóstico
**Arquivo:** `migrations/diagnostico_completo.sql`

**Funcionalidades:**
- ✅ Mostra estrutura completa da tabela `subscriptions`
- ✅ Lista planos disponíveis
- ✅ Verifica dados do Pedro
- ✅ Verifica se Pedro já tem subscription
- ✅ Lista todos os usuários e suas subscriptions
- ✅ Verifica triggers existentes

---

## 🎯 Próximos Passos

1. **Executar Diagnóstico**
   - Arquivo: `migrations/diagnostico_completo.sql`
   - Objetivo: Verificar estado atual do banco

2. **Criar Subscription do Pedro**
   - Arquivo: `migrations/create_subscription_pedro_v2.sql`
   - Objetivo: Resolver problema do usuário sem plano

3. **Criar Trigger Automático**
   - Arquivo: `migrations/auto_create_subscription_trigger_v2.sql`
   - Objetivo: Prevenir problema em novos usuários

4. **Testar Trigger**
   - Criar usuário de teste
   - Verificar se subscription é criada automaticamente

5. **Validar no Sistema**
   - Login como Pedro
   - Verificar página de Plano
   - Confirmar que tudo está funcionando

6. **Enviar para GitHub**
   - Após validação bem-sucedida
   - Commit com mensagem descritiva

---

## 📝 Lições Aprendidas

1. **Sempre verificar estrutura real do banco** antes de criar SQLs
2. **Campos NOT NULL podem não estar documentados** - usar queries de diagnóstico
3. **Triggers são essenciais** para manter integridade de dados relacionados
4. **Duplicação de dados pode ser intencional** (histórico, auditoria)
5. **Tratamento de erros é crucial** em triggers para não bloquear operações principais

---

**Última atualização:** 2024-12-09  
**Status:** Análise completa - Pronto para executar SQLs corrigidos
