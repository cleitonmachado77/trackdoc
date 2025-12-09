# 🔐 Sistema de Controle de Acesso por Planos

## 📋 Visão Geral

O sistema implementa controle de acesso baseado em:
1. **Funcionalidades** - Recursos específicos de cada plano
2. **Limites** - Quantidade máxima de usuários, armazenamento e documentos

## 🎯 Funcionalidades por Plano

### Plano Básico (R$ 149/mês)
```typescript
{
  dashboard_gerencial: true,
  upload_documentos: true,
  solicitacao_aprovacoes: true,
  suporte_email: true,
  biblioteca_publica: false,
  assinatura_eletronica_simples: false,
  assinatura_eletronica_multipla: false,
  chat_nativo: false,
  auditoria_completa: false,
  backup_automatico_diario: false,
  suporte_tecnico_dedicado: false
}
```

**Limites:**
- 15 usuários
- 10 GB de armazenamento
- Usuário adicional: R$ 2,90
- GB adicional: R$ 0,49

### Plano Profissional (R$ 349/mês)
```typescript
{
  dashboard_gerencial: true,
  upload_documentos: true,
  solicitacao_aprovacoes: true,
  suporte_email: true,
  biblioteca_publica: true,
  assinatura_eletronica_simples: true,
  assinatura_eletronica_multipla: false,
  chat_nativo: false,
  auditoria_completa: false,
  backup_automatico_diario: false,
  suporte_tecnico_dedicado: false
}
```

**Limites:**
- 50 usuários
- 50 GB de armazenamento

### Plano Enterprise (R$ 599/mês)
```typescript
{
  dashboard_gerencial: true,
  upload_documentos: true,
  solicitacao_aprovacoes: true,
  suporte_email: true,
  biblioteca_publica: true,
  assinatura_eletronica_simples: true,
  assinatura_eletronica_multipla: true,
  chat_nativo: true,
  auditoria_completa: true,
  backup_automatico_diario: true,
  suporte_tecnico_dedicado: true
}
```

**Limites:**
- 70 usuários
- 120 GB de armazenamento

## 🛠️ Como Usar

### 1. Hook useFeatureAccess

Verifica se o usuário tem acesso a uma funcionalidade específica:

```typescript
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'

function MyComponent() {
  const { user } = useAuth()
  const { hasAccess, loading, reason } = useFeatureAccess(
    user?.id, 
    'biblioteca_publica'
  )

  if (loading) return <Loading />
  
  if (!hasAccess) {
    return <div>Você não tem acesso a esta funcionalidade</div>
  }

  return <BibliotecaPublica />
}
```

### 2. Componente FeatureGate

Bloqueia automaticamente o acesso a componentes:

```typescript
import { FeatureGate } from '@/components/subscription/FeatureGate'

function App() {
  return (
    <FeatureGate 
      userId={user?.id} 
      feature="assinatura_eletronica_simples"
    >
      <AssinaturaEletronica />
    </FeatureGate>
  )
}
```

**Com fallback customizado:**

```typescript
<FeatureGate 
  userId={user?.id} 
  feature="chat_nativo"
  fallback={<div>Chat disponível apenas no plano Enterprise</div>}
>
  <Chat />
</FeatureGate>
```

### 3. Hook useSubscription

Acessa informações completas da subscription:

```typescript
import { useSubscription } from '@/lib/hooks/useSubscription'

function Dashboard() {
  const { user } = useAuth()
  const { 
    subscription, 
    loading, 
    hasFeature,
    isWithinLimit 
  } = useSubscription(user?.id)

  // Verificar funcionalidade
  if (hasFeature('biblioteca_publica')) {
    // Mostrar biblioteca
  }

  // Verificar limite
  if (!isWithinLimit('users')) {
    // Mostrar alerta de limite atingido
  }

  return (
    <div>
      <h1>Plano: {subscription?.plan?.name}</h1>
      <p>Usuários: {subscription?.current_users} / {subscription?.plan?.limits.max_usuarios}</p>
      <p>Armazenamento: {subscription?.current_storage_gb} GB / {subscription?.plan?.limits.armazenamento_gb} GB</p>
    </div>
  )
}
```

## 📊 Verificação de Limites

### Verificar Limite de Usuários

```typescript
const { subscription, isWithinLimit } = useSubscription(userId)

if (!isWithinLimit('users')) {
  toast({
    title: "Limite atingido",
    description: "Você atingiu o limite de usuários do seu plano",
    variant: "destructive"
  })
  return
}

// Criar novo usuário
```

### Verificar Limite de Armazenamento

```typescript
const { subscription, isWithinLimit } = useSubscription(userId)

if (!isWithinLimit('storage')) {
  toast({
    title: "Armazenamento cheio",
    description: "Você atingiu o limite de armazenamento do seu plano",
    variant: "destructive"
  })
  return
}

// Fazer upload
```

## 🔄 Atualização de Uso

### Atualizar Uso de Armazenamento

```typescript
import { updateSubscriptionUsage } from '@/lib/subscription-utils'

// Após upload de arquivo
await updateSubscriptionUsage(subscriptionId, {
  current_storage_gb: newStorageValue
})
```

### Atualizar Contagem de Usuários

```typescript
// Após criar novo usuário na entidade
await updateSubscriptionUsage(subscriptionId, {
  current_users: newUserCount
})
```

## 🚫 Bloqueio de Funcionalidades

### No Frontend (Componentes)

```typescript
// Bloquear rota inteira
<FeatureGate userId={user?.id} feature="chat_nativo">
  <ChatPage />
</FeatureGate>

// Bloquear botão
{hasFeature('assinatura_eletronica_simples') ? (
  <Button onClick={handleSign}>Assinar Documento</Button>
) : (
  <Button disabled>
    Assinatura disponível no plano Profissional
  </Button>
)}
```

### No Backend (APIs)

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { userId } = await getSession()
  
  // Verificar acesso
  const { subscription } = await getUserActiveSubscription(userId)
  
  if (!subscription?.plan?.features.chat_nativo) {
    return NextResponse.json(
      { error: 'Chat não disponível no seu plano' },
      { status: 403 }
    )
  }

  // Processar chat
}
```

## 📈 Monitoramento de Uso

O painel de administração (`/super-admin`) mostra:
- Documentos criados por usuário
- Armazenamento usado por usuário
- Percentual de uso em relação ao limite do plano
- Alertas quando usuário ultrapassa 80% do limite

## 🔔 Alertas Automáticos

Implemente alertas quando:
- Usuário atinge 80% do limite de armazenamento
- Usuário atinge 90% do limite de usuários
- Tentativa de acesso a funcionalidade bloqueada

```typescript
if (usagePercentage > 80) {
  toast({
    title: "Atenção",
    description: `Você está usando ${usagePercentage}% do seu armazenamento`,
    variant: "warning"
  })
}
```

## 🎯 Boas Práticas

1. **Sempre verifique no backend** - Não confie apenas na verificação do frontend
2. **Cache de subscription** - Use o hook useSubscription que já faz cache
3. **Mensagens claras** - Informe o usuário qual plano ele precisa
4. **Graceful degradation** - Desabilite funcionalidades ao invés de quebrar a aplicação
5. **Monitoramento** - Acompanhe o uso através do painel de administração

## 🔗 Links Úteis

- Painel de Administração: `/super-admin`
- Página de Planos: `/pricing`
- Gerenciar Conta: `/minha-conta?tab=plano`
