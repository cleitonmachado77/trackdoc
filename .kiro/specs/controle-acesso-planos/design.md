# Design Document - Sistema de Controle de Acesso por Planos

## Overview

Sistema de controle de acesso baseado em planos de assinatura que verifica funcionalidades e limites em tempo real, bloqueando automaticamente recursos não disponíveis e alertando quando limites são atingidos.

## Architecture

### Camadas do Sistema

```
┌─────────────────────────────────────────┐
│         Frontend (React/Next.js)        │
│  - FeatureGate Components               │
│  - useFeatureAccess Hook                │
│  - useSubscription Hook                 │
│  - Alert/Toast Messages                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         API Layer (Next.js API)         │
│  - Validation Middleware                │
│  - Permission Checks                    │
│  - Usage Updates                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Database (Supabase/PostgreSQL)     │
│  - plans table                          │
│  - subscriptions table                  │
│  - profiles table                       │
│  - documents table                      │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Configuração dos Planos (Database)

**Tabela: plans**
```typescript
interface Plan {
  id: string
  name: string
  type: 'basico' | 'profissional' | 'enterprise'
  price_monthly: number
  max_users: number
  max_storage_gb: number
  features: {
    dashboard_gerencial: boolean
    upload_documentos: boolean
    solicitacao_aprovacoes: boolean
    suporte_email: boolean
    biblioteca_publica: boolean
    assinatura_eletronica_simples: boolean
    assinatura_eletronica_multipla: boolean
    chat_nativo: boolean
    auditoria_completa: boolean
    backup_automatico_diario: boolean
    suporte_tecnico_dedicado: boolean
  }
}
```

**SQL de Atualização:**
```sql
-- Plano Básico
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
  max_users = 15,
  max_storage_gb = 10
WHERE type = 'basico';
```

### 2. Hook useFeatureAccess

**Interface:**
```typescript
interface UseFeatureAccessReturn {
  hasAccess: boolean
  loading: boolean
  reason?: 'no_subscription' | 'feature_not_included' | 'trial_expired' | 'subscription_expired'
  showUpgradePrompt: boolean
  requiredPlan?: 'basico' | 'profissional' | 'enterprise'
}

function useFeatureAccess(
  userId: string | undefined,
  feature: keyof PlanFeatures
): UseFeatureAccessReturn
```

**Lógica:**
1. Buscar subscription do usuário
2. Verificar se subscription existe e está ativa
3. Verificar se feature está habilitada no plano
4. Retornar resultado com motivo de bloqueio se aplicável

### 3. Hook useSubscription

**Interface:**
```typescript
interface UseSubscriptionReturn {
  subscription: Subscription | null
  loading: boolean
  error: string | null
  hasFeature: (feature: keyof PlanFeatures) => boolean
  isWithinLimit: (limit: 'users' | 'storage') => boolean
  getRemainingUsers: () => number
  getRemainingStorage: () => number
  getUsagePercentage: (limit: 'users' | 'storage') => number
  refetch: () => Promise<void>
}
```

**Funcionalidades Adicionais:**
- `getRemainingUsers()`: Retorna quantos usuários ainda podem ser criados
- `getRemainingStorage()`: Retorna quanto armazenamento está disponível (em GB)
- `getUsagePercentage()`: Retorna percentual de uso (0-100)

### 4. Componente FeatureGate

**Props:**
```typescript
interface FeatureGateProps {
  userId: string | undefined
  feature: keyof PlanFeatures
  children: ReactNode
  fallback?: ReactNode
  showAlert?: boolean
  customMessage?: string
}
```

**Comportamento:**
- Se `hasAccess = true`: Renderiza `children`
- Se `hasAccess = false` e `fallback` existe: Renderiza `fallback`
- Se `hasAccess = false` e `showAlert = true`: Renderiza Alert com mensagem
- Mensagem inclui: funcionalidade bloqueada, plano atual, plano necessário

### 5. Componente LimitGuard

**Novo componente para verificar limites:**
```typescript
interface LimitGuardProps {
  userId: string | undefined
  limitType: 'users' | 'storage'
  requiredAmount?: number // Para verificar se há espaço suficiente
  children: ReactNode
  onLimitReached?: () => void
}
```

**Uso:**
```typescript
<LimitGuard userId={user.id} limitType="storage" requiredAmount={fileSize}>
  <UploadButton />
</LimitGuard>
```

### 6. Sistema de Mensagens

**Tipos de Mensagens:**

1. **Funcionalidade Bloqueada:**
```
🔒 Funcionalidade Bloqueada

A funcionalidade "Assinatura Eletrônica Simples" não está disponível no seu plano atual (Básico).

Para ter acesso, é necessário o plano Profissional ou superior.

[Ver Planos] [Contatar Administrador]
```

2. **Limite de Usuários Atingido:**
```
⚠️ Limite de Usuários Atingido

Sua entidade atingiu o limite de 15 usuários do Plano Básico.

Não é possível criar novos usuários. Entre em contato com o administrador para fazer upgrade do plano.

Usuários atuais: 15/15

[Ver Planos] [Contatar Administrador]
```

3. **Limite de Armazenamento Atingido:**
```
💾 Limite de Armazenamento Atingido

Você atingiu o limite de 10 GB do Plano Básico.

Não é possível fazer upload de novos arquivos. Exclua arquivos ou solicite upgrade do plano.

Armazenamento usado: 10.00 GB / 10 GB (100%)

[Gerenciar Arquivos] [Ver Planos]
```

4. **Alerta Preventivo (80%):**
```
⚠️ Atenção: Armazenamento em 80%

Você está usando 8.00 GB dos 10 GB disponíveis no seu plano.

Espaço restante: 2.00 GB

[Gerenciar Arquivos]
```

5. **Alerta Crítico (90%):**
```
🚨 Alerta: Armazenamento em 90%

Você está usando 9.00 GB dos 10 GB disponíveis no seu plano.

Espaço restante: 1.00 GB - Atenção, o limite está próximo!

[Gerenciar Arquivos] [Ver Planos]
```

## Data Models

### Subscription (atualizada)
```typescript
interface Subscription {
  id: string
  user_id: string
  entity_id?: string
  plan_id: string
  status: 'active' | 'trial' | 'canceled' | 'expired'
  
  // Uso atual
  current_users: number
  current_storage_gb: number
  
  // Relacionamentos
  plan?: Plan
}
```

## Error Handling

### Códigos de Erro

- `FEATURE_NOT_AVAILABLE`: Funcionalidade não disponível no plano
- `USER_LIMIT_REACHED`: Limite de usuários atingido
- `STORAGE_LIMIT_REACHED`: Limite de armazenamento atingido
- `NO_ACTIVE_SUBSCRIPTION`: Usuário sem plano ativo
- `SUBSCRIPTION_EXPIRED`: Plano expirado

### Tratamento no Frontend

```typescript
try {
  await uploadFile(file)
} catch (error) {
  if (error.code === 'STORAGE_LIMIT_REACHED') {
    toast({
      title: "Limite de Armazenamento Atingido",
      description: error.message,
      variant: "destructive"
    })
  }
}
```

### Tratamento no Backend

```typescript
// Middleware de validação
async function validateFeatureAccess(req, res, next) {
  const { userId } = req.session
  const feature = req.route.feature // Definido na rota
  
  const { subscription } = await getUserSubscription(userId)
  
  if (!subscription?.plan?.features[feature]) {
    return res.status(403).json({
      error: 'FEATURE_NOT_AVAILABLE',
      message: 'Esta funcionalidade não está disponível no seu plano',
      currentPlan: subscription?.plan?.type,
      requiredPlan: getRequiredPlan(feature)
    })
  }
  
  next()
}
```

## Testing Strategy

### 1. Testes Unitários

**Hooks:**
- `useFeatureAccess`: Testar todos os cenários de acesso/bloqueio
- `useSubscription`: Testar cálculos de limites e percentuais
- Testar com subscription null, expired, active

**Componentes:**
- `FeatureGate`: Testar renderização condicional
- `LimitGuard`: Testar bloqueio por limites
- Testar mensagens customizadas

### 2. Testes de Integração

**Fluxos Completos:**
- Criar usuário até atingir limite
- Upload de arquivos até atingir limite
- Acesso a funcionalidades bloqueadas
- Upgrade de plano e liberação de funcionalidades

### 3. Testes de Validação Backend

**APIs:**
- Tentar acessar funcionalidade sem permissão
- Tentar criar usuário além do limite
- Tentar upload além do limite
- Verificar retorno de erros corretos

## Implementation Plan

### Fase 1: Atualização do Banco de Dados (1h)
1. Executar SQL para atualizar funcionalidades dos planos
2. Verificar dados atualizados
3. Criar backup antes da migração

### Fase 2: Hooks e Utilitários (2h)
1. Atualizar `useFeatureAccess` com `requiredPlan`
2. Adicionar métodos em `useSubscription`:
   - `getRemainingUsers()`
   - `getRemainingStorage()`
   - `getUsagePercentage()`
3. Criar `useLimitCheck` hook

### Fase 3: Componentes de UI (2h)
1. Atualizar `FeatureGate` com mensagens melhoradas
2. Criar `LimitGuard` component
3. Criar `LimitAlert` component para alertas preventivos
4. Criar `UpgradeBanner` component

### Fase 4: Validação Backend (3h)
1. Criar middleware `validateFeatureAccess`
2. Criar middleware `validateStorageLimit`
3. Criar middleware `validateUserLimit`
4. Aplicar middlewares nas rotas relevantes

### Fase 5: Atualização de Uso (2h)
1. Implementar atualização automática de `current_users`
2. Implementar atualização automática de `current_storage_gb`
3. Criar triggers no banco se necessário
4. Testar incremento/decremento

### Fase 6: Mensagens e Alertas (2h)
1. Criar componente de mensagens padronizadas
2. Implementar alertas preventivos (80%, 90%)
3. Adicionar toasts em pontos críticos
4. Testar UX das mensagens

### Fase 7: Testes (3h)
1. Testes unitários dos hooks
2. Testes de integração dos fluxos
3. Testes manuais de cada funcionalidade
4. Correção de bugs encontrados

### Fase 8: Documentação (1h)
1. Atualizar documentação de uso
2. Criar guia de troubleshooting
3. Documentar códigos de erro

**Tempo Total Estimado: 16 horas**

## Security Considerations

1. **Validação Dupla**: Frontend + Backend
2. **Rate Limiting**: Prevenir tentativas excessivas
3. **Logging**: Registrar tentativas de acesso não autorizado
4. **Cache**: Invalidar cache ao mudar plano
5. **Tokens**: Incluir plano no JWT para validação rápida
