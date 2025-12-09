# 🚀 PLANO DE IMPLEMENTAÇÃO - Controle de Acesso por Planos

## 📋 Status Atual

### ✅ Já Implementado
- ✅ Tipos e interfaces (`types/subscription.ts`)
- ✅ Hook `useSubscription` com métodos básicos
- ✅ Hook `useFeatureAccess` para verificar funcionalidades
- ✅ Componente `FeatureGate` para bloqueio de UI
- ✅ Configuração dos planos (PLAN_CONFIGS)

### ⚠️ Precisa Correção
- ⚠️ Configuração do Plano Básico - `biblioteca_publica` deve ser `true`
- ⚠️ Hook `useSubscription` - faltam métodos de cálculo de limites
- ⚠️ Hook `useFeatureAccess` - falta campo `requiredPlan`
- ⚠️ Componente `FeatureGate` - mensagens precisam ser mais detalhadas

### ❌ Não Implementado
- ❌ Componente `LimitGuard` para verificar limites
- ❌ Componente `LimitAlert` para alertas preventivos (80%, 90%)
- ❌ Middlewares de validação backend
- ❌ Atualização automática de contadores (current_users, current_storage_gb)
- ❌ Sistema de mensagens padronizadas
- ❌ Validação em rotas de API

## 🎯 Regras dos Planos (OFICIAL)

### Plano Básico
- **Usuários:** 15
- **Armazenamento:** 10 GB
- **Funcionalidades Habilitadas:**
  - ✅ Dashboard gerencial
  - ✅ Upload de documentos
  - ✅ Solicitação de aprovações
  - ✅ Suporte por e-mail
  - ✅ Biblioteca Pública
- **Funcionalidades Bloqueadas:**
  - ❌ Assinatura eletrônica simples
  - ❌ Assinatura eletrônica múltipla
  - ❌ Chat nativo
  - ❌ Auditoria completa (logs)
  - ❌ Backup automático diário
  - ❌ Suporte técnico dedicado

### Plano Profissional
- **Usuários:** 50
- **Armazenamento:** 50 GB
- **Funcionalidades Habilitadas:**
  - ✅ Todas do Básico +
  - ✅ Assinatura eletrônica simples
- **Funcionalidades Bloqueadas:**
  - ❌ Assinatura eletrônica múltipla
  - ❌ Chat nativo
  - ❌ Auditoria completa (logs)
  - ❌ Backup automático diário
  - ❌ Suporte técnico dedicado

### Plano Enterprise
- **Usuários:** 70
- **Armazenamento:** 120 GB
- **Funcionalidades:** ✅ Todas habilitadas

## 📝 PLANO DE IMPLEMENTAÇÃO

### FASE 1: Correção da Configuração dos Planos (30 min)

#### Task 1.1: Atualizar banco de dados
**Arquivo:** Criar `migrations/update_plans_config.sql`
**Ação:** Executar SQL para corrigir funcionalidades dos planos

```sql
-- Atualizar Plano Básico
UPDATE plans SET
  features = jsonb_build_object(
    'dashboard_gerencial', true,
    'upload_documentos', true,
    'solicitacao_aprovacoes', true,
    'suporte_email', true,
    'biblioteca_publica', true,
    'assinatura_eletronica_simples', false,
    'assinatura_eletronica_multipla', false,
    'chat_nativo', false,
    'auditoria_completa', false,
    'backup_automatico_diario', false,
    'suporte_tecnico_dedicado', false
  ),
  limits = jsonb_build_object(
    'max_usuarios', 15,
    'armazenamento_gb', 10
  )
WHERE type = 'basico';
```

**Validação:**
- [ ] Executar query de verificação
- [ ] Confirmar que biblioteca_publica = true no Básico
- [ ] Confirmar limites corretos (15, 50, 70 usuários)

### FASE 2: Melhorar Hooks Existentes (1h 30min)

#### Task 2.1: Estender useSubscription
**Arquivo:** `lib/hooks/useSubscription.ts`
**Adicionar métodos:**

```typescript
// Adicionar ao retorno do hook:
getRemainingUsers: () => number
getRemainingStorage: () => number
getUsagePercentage: (limit: 'users' | 'storage') => number
getCurrentUsage: () => { users: number, storage: number }
```

**Implementação:**
```typescript
const getRemainingUsers = (): number => {
  if (!subscription?.plan?.limits) return 0
  return Math.max(0, subscription.plan.limits.max_usuarios - subscription.current_users)
}

const getRemainingStorage = (): number => {
  if (!subscription?.plan?.limits) return 0
  return Math.max(0, subscription.plan.limits.armazenamento_gb - subscription.current_storage_gb)
}

const getUsagePercentage = (limit: 'users' | 'storage'): number => {
  if (!subscription?.plan?.limits) return 0
  
  if (limit === 'users') {
    const max = subscription.plan.limits.max_usuarios
    return max > 0 ? Math.round((subscription.current_users / max) * 100) : 0
  }
  
  if (limit === 'storage') {
    const max = subscription.plan.limits.armazenamento_gb
    return max > 0 ? Math.round((subscription.current_storage_gb / max) * 100) : 0
  }
  
  return 0
}
```

**Validação:**
- [ ] Testar cálculo de usuários restantes
- [ ] Testar cálculo de armazenamento restante
- [ ] Testar percentuais (0%, 50%, 80%, 90%, 100%)

#### Task 2.2: Melhorar useFeatureAccess
**Arquivo:** `lib/hooks/useFeatureAccess.ts`
**Adicionar campo `requiredPlan`:**

```typescript
interface UseFeatureAccessReturn {
  hasAccess: boolean
  loading: boolean
  reason?: 'no_subscription' | 'feature_not_included' | 'trial_expired' | 'subscription_expired'
  showUpgradePrompt: boolean
  requiredPlan?: 'basico' | 'profissional' | 'enterprise' // NOVO
  currentPlan?: 'basico' | 'profissional' | 'enterprise' // NOVO
}
```

**Lógica para determinar plano necessário:**
```typescript
const getRequiredPlan = (feature: keyof PlanFeatures): PlanType | undefined => {
  // Funcionalidades do Básico
  if (['dashboard_gerencial', 'upload_documentos', 'solicitacao_aprovacoes', 
       'suporte_email', 'biblioteca_publica'].includes(feature)) {
    return 'basico'
  }
  
  // Funcionalidades do Profissional
  if (feature === 'assinatura_eletronica_simples') {
    return 'profissional'
  }
  
  // Funcionalidades exclusivas do Enterprise
  if (['assinatura_eletronica_multipla', 'chat_nativo', 'auditoria_completa',
       'backup_automatico_diario', 'suporte_tecnico_dedicado'].includes(feature)) {
    return 'enterprise'
  }
  
  return undefined
}
```

**Validação:**
- [ ] Testar retorno de requiredPlan para cada funcionalidade
- [ ] Verificar currentPlan do usuário

### FASE 3: Criar Novos Componentes de UI (2h)

#### Task 3.1: Criar LimitGuard
**Arquivo:** `components/subscription/LimitGuard.tsx`
**Propósito:** Bloquear ações quando limites são atingidos

```typescript
interface LimitGuardProps {
  userId: string | undefined
  limitType: 'users' | 'storage'
  requiredAmount?: number // Para verificar se há espaço suficiente
  children: ReactNode
  onLimitReached?: () => void
  showAlert?: boolean
}
```

**Comportamento:**
- Verificar se há espaço disponível
- Se limite atingido, não renderizar children
- Exibir mensagem de limite atingido
- Chamar callback onLimitReached se fornecido

**Validação:**
- [ ] Testar bloqueio ao atingir 100% de usuários
- [ ] Testar bloqueio ao atingir 100% de armazenamento
- [ ] Testar com requiredAmount (ex: upload de 2GB quando só tem 1GB)

#### Task 3.2: Criar LimitAlert
**Arquivo:** `components/subscription/LimitAlert.tsx`
**Propósito:** Alertas preventivos em 80% e 90%

```typescript
interface LimitAlertProps {
  userId: string | undefined
  limitType: 'users' | 'storage'
  showAt?: number[] // [80, 90] por padrão
  onClose?: () => void
}
```

**Estilos:**
- 80-89%: Alerta amarelo (warning)
- 90-99%: Alerta vermelho (destructive)
- 100%: Alerta vermelho crítico

**Mensagens:**
```
⚠️ Atenção: Armazenamento em 85%
Você está usando 8.5 GB dos 10 GB disponíveis.
Espaço restante: 1.5 GB
[Gerenciar Arquivos]

🚨 Alerta Crítico: Armazenamento em 95%
Você está usando 9.5 GB dos 10 GB disponíveis.
Espaço restante: 0.5 GB - O limite está próximo!
[Gerenciar Arquivos] [Ver Planos]
```

**Validação:**
- [ ] Testar exibição em 80%
- [ ] Testar exibição em 90%
- [ ] Testar cores e ícones corretos
- [ ] Testar botões de ação

#### Task 3.3: Melhorar FeatureGate
**Arquivo:** `components/subscription/FeatureGate.tsx`
**Melhorias:**

```typescript
interface FeatureGateProps {
  userId: string | undefined
  feature: keyof PlanFeatures
  children: ReactNode
  fallback?: ReactNode
  showAlert?: boolean
  customMessage?: string // NOVO
}
```

**Mensagem melhorada:**
```
🔒 Funcionalidade Bloqueada

A funcionalidade "Assinatura Eletrônica Simples" não está 
disponível no seu plano atual (Básico).

Para ter acesso, é necessário o plano Profissional ou superior.

Plano atual: Básico
Plano necessário: Profissional

[Ver Planos] [Contatar Administrador]
```

**Validação:**
- [ ] Testar exibição de plano atual
- [ ] Testar exibição de plano necessário
- [ ] Testar mensagem customizada
- [ ] Testar links funcionando

### FASE 4: Implementar Validação Backend (3h)

#### Task 4.1: Criar Middlewares de Validação
**Arquivo:** `lib/middleware/subscription-validation.ts`

**Middleware 1: validateFeatureAccess**
```typescript
export async function validateFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<{ allowed: boolean; error?: string; requiredPlan?: string }> {
  const supabase = createServerSupabaseClient()
  
  // Buscar subscription
  const { data: subscription } = await supabase
    .rpc('get_user_active_subscription', { p_user_id: userId })
    .single()
  
  if (!subscription) {
    return {
      allowed: false,
      error: 'NO_ACTIVE_SUBSCRIPTION',
    }
  }
  
  // Verificar funcionalidade
  if (!subscription.plan_features[feature]) {
    return {
      allowed: false,
      error: 'FEATURE_NOT_AVAILABLE',
      requiredPlan: getRequiredPlan(feature),
    }
  }
  
  return { allowed: true }
}
```

**Middleware 2: validateStorageLimit**
```typescript
export async function validateStorageLimit(
  userId: string,
  fileSizeBytes: number
): Promise<{ allowed: boolean; error?: string; available?: number }> {
  const supabase = createServerSupabaseClient()
  
  const { data: subscription } = await supabase
    .rpc('get_user_active_subscription', { p_user_id: userId })
    .single()
  
  if (!subscription) {
    return { allowed: false, error: 'NO_ACTIVE_SUBSCRIPTION' }
  }
  
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024)
  const available = subscription.armazenamento_gb - subscription.current_storage_gb
  
  if (fileSizeGB > available) {
    return {
      allowed: false,
      error: 'STORAGE_LIMIT_EXCEEDED',
      available,
    }
  }
  
  return { allowed: true }
}
```

**Middleware 3: validateUserLimit**
```typescript
export async function validateUserLimit(
  entityId: string
): Promise<{ allowed: boolean; error?: string; available?: number }> {
  const supabase = createServerSupabaseClient()
  
  // Buscar subscription da entidade
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('entity_id', entityId)
    .eq('status', 'active')
    .single()
  
  if (!subscription) {
    return { allowed: false, error: 'NO_ACTIVE_SUBSCRIPTION' }
  }
  
  const available = subscription.plan.limits.max_usuarios - subscription.current_users
  
  if (available <= 0) {
    return {
      allowed: false,
      error: 'USER_LIMIT_EXCEEDED',
      available: 0,
    }
  }
  
  return { allowed: true, available }
}
```

**Validação:**
- [ ] Testar cada middleware isoladamente
- [ ] Testar retorno de erros corretos
- [ ] Testar cálculos de limites

#### Task 4.2: Aplicar Middlewares nas Rotas
**Arquivos a modificar:**

1. **Upload de documentos:** `app/api/documents/upload/route.ts`
```typescript
export async function POST(request: Request) {
  const { userId } = await getSession()
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // VALIDAR ARMAZENAMENTO
  const validation = await validateStorageLimit(userId, file.size)
  if (!validation.allowed) {
    return NextResponse.json(
      { 
        error: validation.error,
        message: 'Limite de armazenamento atingido',
        available: validation.available 
      },
      { status: 403 }
    )
  }
  
  // Continuar com upload...
}
```

2. **Criação de usuários:** `app/api/users/create/route.ts`
```typescript
export async function POST(request: Request) {
  const { entityId } = await request.json()
  
  // VALIDAR LIMITE DE USUÁRIOS
  const validation = await validateUserLimit(entityId)
  if (!validation.allowed) {
    return NextResponse.json(
      { 
        error: validation.error,
        message: 'Limite de usuários atingido',
        available: validation.available 
      },
      { status: 403 }
    )
  }
  
  // Continuar com criação...
}
```

3. **Funcionalidades restritas:**
- `app/api/signatures/simple/route.ts` - Validar assinatura_eletronica_simples
- `app/api/signatures/multiple/route.ts` - Validar assinatura_eletronica_multipla
- `app/api/chat/route.ts` - Validar chat_nativo
- `app/api/audit/route.ts` - Validar auditoria_completa

**Validação:**
- [ ] Testar cada rota com usuário sem permissão
- [ ] Verificar retorno HTTP 403
- [ ] Verificar mensagens de erro corretas

### FASE 5: Atualização Automática de Contadores (2h)

#### Task 5.1: Criar Funções de Atualização
**Arquivo:** `lib/subscription-counters.ts`

```typescript
/**
 * Incrementa contador de usuários da entidade
 */
export async function incrementUserCount(entityId: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  
  await supabase.rpc('increment_user_count', { p_entity_id: entityId })
}

/**
 * Decrementa contador de usuários da entidade
 */
export async function decrementUserCount(entityId: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  
  await supabase.rpc('decrement_user_count', { p_entity_id: entityId })
}

/**
 * Adiciona armazenamento usado
 */
export async function addStorageUsage(
  userId: string, 
  sizeBytes: number
): Promise<void> {
  const supabase = createServerSupabaseClient()
  const sizeGB = sizeBytes / (1024 * 1024 * 1024)
  
  await supabase.rpc('add_storage_usage', { 
    p_user_id: userId,
    p_size_gb: sizeGB 
  })
}

/**
 * Remove armazenamento usado
 */
export async function removeStorageUsage(
  userId: string,
  sizeBytes: number
): Promise<void> {
  const supabase = createServerSupabaseClient()
  const sizeGB = sizeBytes / (1024 * 1024 * 1024)
  
  await supabase.rpc('remove_storage_usage', { 
    p_user_id: userId,
    p_size_gb: sizeGB 
  })
}
```

#### Task 5.2: Criar Funções RPC no Supabase
**Arquivo:** `supabase/migrations/create_counter_functions.sql`

```sql
-- Incrementar contador de usuários
CREATE OR REPLACE FUNCTION increment_user_count(p_entity_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET current_users = current_users + 1,
      updated_at = NOW()
  WHERE entity_id = p_entity_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Decrementar contador de usuários
CREATE OR REPLACE FUNCTION decrement_user_count(p_entity_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET current_users = GREATEST(0, current_users - 1),
      updated_at = NOW()
  WHERE entity_id = p_entity_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Adicionar armazenamento
CREATE OR REPLACE FUNCTION add_storage_usage(
  p_user_id UUID,
  p_size_gb NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET current_storage_gb = current_storage_gb + p_size_gb,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Remover armazenamento
CREATE OR REPLACE FUNCTION remove_storage_usage(
  p_user_id UUID,
  p_size_gb NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET current_storage_gb = GREATEST(0, current_storage_gb - p_size_gb),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;
```

#### Task 5.3: Integrar com Operações
**Locais para integrar:**

1. **Após criar usuário:**
```typescript
// app/api/users/create/route.ts
const newUser = await createUser(data)
await incrementUserCount(entityId)
```

2. **Após remover usuário:**
```typescript
// app/api/users/delete/route.ts
await deleteUser(userId)
await decrementUserCount(entityId)
```

3. **Após upload bem-sucedido:**
```typescript
// app/api/documents/upload/route.ts
const document = await uploadDocument(file)
await addStorageUsage(userId, file.size)
```

4. **Após excluir documento:**
```typescript
// app/api/documents/delete/route.ts
const document = await getDocument(documentId)
await deleteDocument(documentId)
await removeStorageUsage(userId, document.size)
```

**Validação:**
- [ ] Criar usuário e verificar incremento no banco
- [ ] Remover usuário e verificar decremento no banco
- [ ] Upload arquivo e verificar incremento de storage
- [ ] Excluir arquivo e verificar decremento de storage
- [ ] Verificar que valores não ficam negativos

### FASE 6: Sistema de Mensagens e Alertas (1h 30min)

#### Task 6.1: Criar Templates de Mensagens
**Arquivo:** `lib/subscription-messages.ts`

```typescript
import { PlanType, PlanFeatures, FEATURE_LABELS } from '@/types/subscription'

export interface BlockedFeatureMessage {
  title: string
  description: string
  currentPlan: string
  requiredPlan: string
  actions: { label: string; href: string }[]
}

export function getFeatureBlockedMessage(
  feature: keyof PlanFeatures,
  currentPlan: PlanType,
  requiredPlan: PlanType
): BlockedFeatureMessage {
  const featureName = FEATURE_LABELS[feature]
  const planNames = {
    basico: 'Básico',
    profissional: 'Profissional',
    enterprise: 'Enterprise',
  }
  
  return {
    title: '🔒 Funcionalidade Bloqueada',
    description: `A funcionalidade "${featureName}" não está disponível no seu plano atual (${planNames[currentPlan]}).`,
    currentPlan: planNames[currentPlan],
    requiredPlan: planNames[requiredPlan],
    actions: [
      { label: 'Ver Planos', href: '/pricing' },
      { label: 'Contatar Administrador', href: '/support' },
    ],
  }
}

export interface LimitReachedMessage {
  title: string
  description: string
  current: number
  max: number
  percentage: number
  actions: { label: string; href: string }[]
}

export function getUserLimitMessage(
  current: number,
  max: number,
  planName: string
): LimitReachedMessage {
  return {
    title: '⚠️ Limite de Usuários Atingido',
    description: `Sua entidade atingiu o limite de ${max} usuários do Plano ${planName}. Não é possível criar novos usuários.`,
    current,
    max,
    percentage: 100,
    actions: [
      { label: 'Ver Planos', href: '/pricing' },
      { label: 'Contatar Administrador', href: '/support' },
    ],
  }
}

export function getStorageLimitMessage(
  current: number,
  max: number,
  planName: string
): LimitReachedMessage {
  const percentage = Math.round((current / max) * 100)
  
  return {
    title: '💾 Limite de Armazenamento Atingido',
    description: `Você atingiu o limite de ${max} GB do Plano ${planName}. Não é possível fazer upload de novos arquivos.`,
    current,
    max,
    percentage,
    actions: [
      { label: 'Gerenciar Arquivos', href: '/documents' },
      { label: 'Ver Planos', href: '/pricing' },
    ],
  }
}

export function getStorageWarningMessage(
  current: number,
  max: number,
  percentage: number
): LimitReachedMessage {
  const remaining = max - current
  const isCritical = percentage >= 90
  
  return {
    title: isCritical 
      ? '🚨 Alerta Crítico: Armazenamento em ' + percentage + '%'
      : '⚠️ Atenção: Armazenamento em ' + percentage + '%',
    description: `Você está usando ${current.toFixed(2)} GB dos ${max} GB disponíveis. Espaço restante: ${remaining.toFixed(2)} GB${isCritical ? ' - O limite está próximo!' : ''}`,
    current,
    max,
    percentage,
    actions: [
      { label: 'Gerenciar Arquivos', href: '/documents' },
      ...(isCritical ? [{ label: 'Ver Planos', href: '/pricing' }] : []),
    ],
  }
}
```

#### Task 6.2: Integrar Alertas no Dashboard
**Arquivo:** `app/dashboard/page.tsx`

```typescript
import { LimitAlert } from '@/components/subscription/LimitAlert'

export default function DashboardPage() {
  const { user } = useAuth()
  
  return (
    <div>
      {/* Alertas de limite */}
      <LimitAlert userId={user?.id} limitType="storage" showAt={[80, 90]} />
      <LimitAlert userId={user?.id} limitType="users" showAt={[80, 90]} />
      
      {/* Resto do dashboard */}
    </div>
  )
}
```

#### Task 6.3: Adicionar Toasts em Pontos Críticos
**Locais para adicionar toasts:**

1. **Ao tentar acessar funcionalidade bloqueada:**
```typescript
const { hasAccess, reason, requiredPlan } = useFeatureAccess(user.id, 'chat_nativo')

if (!hasAccess) {
  toast({
    title: "Funcionalidade Bloqueada",
    description: `Esta funcionalidade requer o plano ${requiredPlan}`,
    variant: "destructive",
  })
}
```

2. **Ao atingir limite de upload:**
```typescript
try {
  await uploadFile(file)
} catch (error) {
  if (error.code === 'STORAGE_LIMIT_EXCEEDED') {
    toast({
      title: "Limite de Armazenamento Atingido",
      description: `Espaço disponível: ${error.available} GB`,
      variant: "destructive",
    })
  }
}
```

**Validação:**
- [ ] Testar mensagens de funcionalidade bloqueada
- [ ] Testar mensagens de limite atingido
- [ ] Testar alertas preventivos (80%, 90%)
- [ ] Verificar links funcionando
- [ ] Verificar toasts aparecendo corretamente

### FASE 7: Testes e Validação (2h 30min)

#### Task 7.1: Testes de Funcionalidades Bloqueadas

**Cenário 1: Usuário Básico tenta acessar Assinatura Simples**
- [ ] Criar usuário com Plano Básico
- [ ] Tentar acessar página de assinatura eletrônica simples
- [ ] Verificar que FeatureGate bloqueia acesso
- [ ] Verificar mensagem: "requer plano Profissional"
- [ ] Verificar botões "Ver Planos" e "Contatar Admin"

**Cenário 2: Usuário Básico tenta acessar Chat**
- [ ] Criar usuário com Plano Básico
- [ ] Tentar acessar chat nativo
- [ ] Verificar bloqueio
- [ ] Verificar mensagem: "requer plano Enterprise"

**Cenário 3: Usuário Profissional acessa Assinatura Simples**
- [ ] Criar usuário com Plano Profissional
- [ ] Acessar assinatura eletrônica simples
- [ ] Verificar que acesso é permitido
- [ ] Verificar funcionalidade funcionando

**Cenário 4: Usuário Profissional tenta acessar Chat**
- [ ] Tentar acessar chat nativo
- [ ] Verificar bloqueio
- [ ] Verificar mensagem: "requer plano Enterprise"

**Cenário 5: Usuário Enterprise acessa tudo**
- [ ] Criar usuário com Plano Enterprise
- [ ] Acessar todas as funcionalidades
- [ ] Verificar que todas estão disponíveis

#### Task 7.2: Testes de Limite de Usuários

**Cenário 1: Criar usuários até o limite (Básico - 15)**
- [ ] Criar entidade com Plano Básico
- [ ] Criar 13 usuários (sem alerta)
- [ ] Criar 14º usuário (alerta amarelo em 93%)
- [ ] Criar 15º usuário (alerta vermelho em 100%)
- [ ] Tentar criar 16º usuário
- [ ] Verificar bloqueio com mensagem de limite atingido

**Cenário 2: Remover usuário libera espaço**
- [ ] Com 15 usuários, remover 1 usuário
- [ ] Verificar contador atualizado para 14
- [ ] Tentar criar novo usuário
- [ ] Verificar que criação é permitida

**Cenário 3: Upgrade de plano aumenta limite**
- [ ] Com 15 usuários no Básico
- [ ] Fazer upgrade para Profissional (limite 50)
- [ ] Verificar que pode criar mais usuários
- [ ] Criar 16º usuário com sucesso

#### Task 7.3: Testes de Limite de Armazenamento

**Cenário 1: Upload até 80% (Básico - 10 GB)**
- [ ] Fazer upload de arquivos até 8 GB
- [ ] Verificar alerta amarelo: "Armazenamento em 80%"
- [ ] Verificar mensagem mostra espaço restante: 2 GB

**Cenário 2: Upload até 90%**
- [ ] Fazer upload até 9 GB
- [ ] Verificar alerta vermelho: "Alerta Crítico em 90%"
- [ ] Verificar mensagem: "O limite está próximo!"

**Cenário 3: Upload até 100%**
- [ ] Fazer upload até 10 GB
- [ ] Tentar upload adicional
- [ ] Verificar bloqueio
- [ ] Verificar mensagem: "Limite de armazenamento atingido"

**Cenário 4: Excluir arquivo libera espaço**
- [ ] Com 10 GB usado, excluir arquivo de 2 GB
- [ ] Verificar contador atualizado para 8 GB
- [ ] Tentar novo upload
- [ ] Verificar que upload é permitido

**Cenário 5: Upload maior que espaço disponível**
- [ ] Com 9 GB usado (1 GB disponível)
- [ ] Tentar upload de arquivo de 2 GB
- [ ] Verificar bloqueio
- [ ] Verificar mensagem: "Espaço disponível: 1 GB"

#### Task 7.4: Testes de Validação Backend

**Cenário 1: Tentar acessar API sem permissão**
- [ ] Usuário Básico chama API de assinatura simples
- [ ] Verificar retorno HTTP 403
- [ ] Verificar JSON: `{ error: 'FEATURE_NOT_AVAILABLE', requiredPlan: 'profissional' }`

**Cenário 2: Tentar upload além do limite via API**
- [ ] Com 10 GB usado, fazer POST para /api/documents/upload
- [ ] Verificar retorno HTTP 403
- [ ] Verificar JSON: `{ error: 'STORAGE_LIMIT_EXCEEDED', available: 0 }`

**Cenário 3: Tentar criar usuário além do limite via API**
- [ ] Com 15 usuários, fazer POST para /api/users/create
- [ ] Verificar retorno HTTP 403
- [ ] Verificar JSON: `{ error: 'USER_LIMIT_EXCEEDED', available: 0 }`

#### Task 7.5: Testes de Contadores

**Cenário 1: Contador de usuários**
- [ ] Verificar current_users = 0 inicialmente
- [ ] Criar usuário
- [ ] Verificar current_users = 1 no banco
- [ ] Criar mais 2 usuários
- [ ] Verificar current_users = 3
- [ ] Remover 1 usuário
- [ ] Verificar current_users = 2

**Cenário 2: Contador de armazenamento**
- [ ] Verificar current_storage_gb = 0 inicialmente
- [ ] Upload arquivo de 1 GB
- [ ] Verificar current_storage_gb = 1.0 no banco
- [ ] Upload arquivo de 500 MB
- [ ] Verificar current_storage_gb ≈ 1.5
- [ ] Excluir arquivo de 1 GB
- [ ] Verificar current_storage_gb ≈ 0.5

**Cenário 3: Valores não ficam negativos**
- [ ] Com 1 usuário, tentar decrementar 2 vezes
- [ ] Verificar current_users = 0 (não negativo)
- [ ] Com 0.5 GB, tentar remover 1 GB
- [ ] Verificar current_storage_gb = 0 (não negativo)

#### Task 7.6: Checkpoint Final
- [ ] Executar todos os testes acima
- [ ] Documentar bugs encontrados
- [ ] Corrigir bugs críticos
- [ ] Re-testar funcionalidades corrigidas
- [ ] Validar com usuário/stakeholder

### FASE 8: Documentação e Deploy (1h)

#### Task 8.1: Atualizar Documentação
**Arquivos a criar/atualizar:**

1. **docs/CONTROLE_ACESSO_PLANOS.md**
   - Visão geral do sistema
   - Regras dos planos
   - Como usar hooks
   - Como usar componentes
   - Exemplos de código

2. **docs/API_VALIDATION.md**
   - Middlewares disponíveis
   - Como aplicar validação em rotas
   - Códigos de erro
   - Exemplos de resposta

3. **docs/TROUBLESHOOTING.md**
   - Problemas comuns
   - Como resolver cada erro
   - FAQ

#### Task 8.2: Criar Guia de Mensagens
**Arquivo:** `docs/MENSAGENS_ERRO.md`

Documentar:
- Todos os códigos de erro
- Quando cada erro ocorre
- Como resolver
- Screenshots das mensagens

#### Task 8.3: Deploy
- [ ] Executar migrations no banco de produção
- [ ] Verificar que planos estão corretos
- [ ] Deploy do código
- [ ] Smoke tests em produção
- [ ] Monitorar logs por 24h

## 📊 RESUMO DO PLANO

### Tempo Estimado Total: 14 horas

| Fase | Descrição | Tempo |
|------|-----------|-------|
| 1 | Correção da Configuração | 30 min |
| 2 | Melhorar Hooks | 1h 30min |
| 3 | Criar Componentes UI | 2h |
| 4 | Validação Backend | 3h |
| 5 | Atualização de Contadores | 2h |
| 6 | Mensagens e Alertas | 1h 30min |
| 7 | Testes e Validação | 2h 30min |
| 8 | Documentação e Deploy | 1h |

### Prioridades

**🔴 Crítico (Fazer Primeiro):**
1. Fase 1 - Corrigir configuração dos planos
2. Fase 2 - Melhorar hooks existentes
3. Fase 4 - Validação backend (segurança)

**🟡 Importante (Fazer em Seguida):**
4. Fase 3 - Componentes de UI
5. Fase 5 - Atualização de contadores
6. Fase 6 - Mensagens e alertas

**🟢 Necessário (Fazer por Último):**
7. Fase 7 - Testes completos
8. Fase 8 - Documentação

### Arquivos a Criar

```
lib/
  ├── middleware/
  │   └── subscription-validation.ts (NOVO)
  ├── subscription-counters.ts (NOVO)
  └── subscription-messages.ts (NOVO)

components/
  └── subscription/
      ├── FeatureGate.tsx (ATUALIZAR)
      ├── LimitGuard.tsx (NOVO)
      └── LimitAlert.tsx (NOVO)

supabase/
  └── migrations/
      ├── update_plans_config.sql (NOVO)
      └── create_counter_functions.sql (NOVO)

docs/
  ├── CONTROLE_ACESSO_PLANOS.md (NOVO)
  ├── API_VALIDATION.md (NOVO)
  ├── TROUBLESHOOTING.md (NOVO)
  └── MENSAGENS_ERRO.md (NOVO)
```

### Arquivos a Modificar

```
types/
  └── subscription.ts (✅ JÁ CORRIGIDO)

lib/hooks/
  ├── useSubscription.ts (ADICIONAR MÉTODOS)
  └── useFeatureAccess.ts (ADICIONAR requiredPlan)

app/api/
  ├── documents/upload/route.ts (ADICIONAR VALIDAÇÃO)
  ├── users/create/route.ts (ADICIONAR VALIDAÇÃO)
  ├── users/delete/route.ts (ADICIONAR CONTADOR)
  ├── signatures/simple/route.ts (ADICIONAR VALIDAÇÃO)
  ├── signatures/multiple/route.ts (ADICIONAR VALIDAÇÃO)
  ├── chat/route.ts (ADICIONAR VALIDAÇÃO)
  └── audit/route.ts (ADICIONAR VALIDAÇÃO)

app/dashboard/
  └── page.tsx (ADICIONAR ALERTAS)
```

## ✅ Checklist de Validação Final

### Configuração
- [ ] Plano Básico: biblioteca_publica = true
- [ ] Plano Básico: 15 usuários, 10 GB
- [ ] Plano Profissional: 50 usuários, 50 GB
- [ ] Plano Enterprise: 70 usuários, 120 GB

### Funcionalidades
- [ ] Básico: 5 funcionalidades habilitadas
- [ ] Profissional: 6 funcionalidades habilitadas
- [ ] Enterprise: 11 funcionalidades habilitadas

### Bloqueios
- [ ] Usuário Básico não acessa assinatura simples
- [ ] Usuário Básico não acessa chat
- [ ] Usuário Profissional não acessa assinatura múltipla
- [ ] Usuário Profissional não acessa chat

### Limites
- [ ] Bloqueio ao atingir limite de usuários
- [ ] Bloqueio ao atingir limite de armazenamento
- [ ] Alerta em 80% de uso
- [ ] Alerta em 90% de uso

### Mensagens
- [ ] Mensagens mostram plano atual
- [ ] Mensagens mostram plano necessário
- [ ] Mensagens têm botões de ação
- [ ] Toasts aparecem em momentos corretos

### Backend
- [ ] Validação em todas as rotas críticas
- [ ] Retorno HTTP 403 correto
- [ ] Mensagens de erro descritivas
- [ ] Contadores atualizados automaticamente

### Testes
- [ ] Todos os cenários de teste passam
- [ ] Sem bugs críticos
- [ ] Performance aceitável
- [ ] UX validada

## 🚀 Próximos Passos

1. **Revisar este plano** com a equipe
2. **Confirmar prioridades** e ajustar se necessário
3. **Começar pela Fase 1** (correção de configuração)
4. **Executar fases sequencialmente**
5. **Validar cada fase** antes de prosseguir
6. **Deploy gradual** com monitoramento

## 📞 Suporte

Se encontrar problemas durante a implementação:
1. Consultar docs/TROUBLESHOOTING.md
2. Verificar logs de erro
3. Revisar este plano de implementação
4. Contatar equipe de desenvolvimento

---

**Última atualização:** 2024
**Versão:** 1.0
**Status:** Pronto para implementação
