# 📚 Exemplos de Uso - Sistema de Planos

## 1. Bloquear Página Inteira

```tsx
// app/biblioteca-publica/page.tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'
import { useAuth } from '@/lib/hooks/use-auth-final'

export default function BibliotecaPublicaPage() {
  const { user } = useAuth()
  
  return (
    <FeatureGate userId={user?.id} feature="biblioteca_publica">
      <div>
        <h1>Biblioteca Pública</h1>
        {/* Conteúdo da biblioteca */}
      </div>
    </FeatureGate>
  )
}
```

## 2. Bloquear Funcionalidade Específica

```tsx
// app/documentos/page.tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'
import { useAuth } from '@/lib/hooks/use-auth-final'

export default function DocumentosPage() {
  const { user } = useAuth()
  
  return (
    <div>
      <h1>Documentos</h1>
      
      {/* Funcionalidade básica - sempre disponível */}
      <UploadDocumento />
      
      {/* Funcionalidade premium - bloqueada por plano */}
      <FeatureGate userId={user?.id} feature="assinatura_eletronica_simples">
        <AssinaturaEletronica />
      </FeatureGate>
    </div>
  )
}
```

## 3. Verificar Acesso Programaticamente

```tsx
// app/components/DocumentActions.tsx
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export function DocumentActions({ documentId }: { documentId: string }) {
  const { user } = useAuth()
  const { hasAccess, showUpgradePrompt } = useFeatureAccess(
    user?.id, 
    'assinatura_eletronica_multipla'
  )
  
  return (
    <div className="flex gap-2">
      <Button onClick={() => downloadDocument(documentId)}>
        Download
      </Button>
      
      <Button 
        onClick={() => hasAccess ? signDocument(documentId) : null}
        disabled={!hasAccess}
      >
        {!hasAccess && <Lock className="h-4 w-4 mr-2" />}
        Assinar Documento
      </Button>
      
      {showUpgradePrompt && (
        <p className="text-sm text-muted-foreground">
          Faça upgrade para assinar documentos
        </p>
      )}
    </div>
  )
}
```

## 4. Mostrar Informações do Plano

```tsx
// app/components/PlanBadge.tsx
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

export function PlanBadge({ userId }: { userId: string }) {
  const { subscription, isTrialActive, daysUntilTrialEnd } = useSubscription(userId)
  
  if (!subscription) return null
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">
        {subscription.plan?.name}
      </Badge>
      
      {isTrialActive && (
        <Badge className="bg-blue-500">
          <Sparkles className="h-3 w-3 mr-1" />
          Trial - {daysUntilTrialEnd} dias restantes
        </Badge>
      )}
    </div>
  )
}
```

## 5. Verificar Limites de Uso

```tsx
// app/components/UserLimitWarning.tsx
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export function UserLimitWarning({ userId }: { userId: string }) {
  const { subscription, isWithinLimit } = useSubscription(userId)
  
  if (!subscription || isWithinLimit('users')) return null
  
  const plan = subscription.plan
  if (!plan) return null
  
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Você atingiu o limite de {plan.limits.max_usuarios} usuários do plano {plan.name}.
        {' '}
        <Link href="/pricing" className="underline">
          Faça upgrade para adicionar mais usuários.
        </Link>
      </AlertDescription>
    </Alert>
  )
}
```

## 6. Criar Trial Automático no Registro

```tsx
// app/api/auth/register/route.ts
import { createTrialSubscription } from '@/lib/subscription-utils'

export async function POST(request: Request) {
  // ... código de registro do usuário
  
  // Após criar usuário com sucesso
  const { success, subscriptionId } = await createTrialSubscription(
    newUser.id,
    'profissional' // Plano do trial
  )
  
  if (success) {
    console.log('Trial criado:', subscriptionId)
  }
  
  return Response.json({ user: newUser })
}
```

## 7. Botão de Upgrade Condicional

```tsx
// app/components/UpgradeButton.tsx
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function UpgradeButton({ userId }: { userId: string }) {
  const { subscription } = useSubscription(userId)
  
  // Não mostrar se já é Enterprise
  if (subscription?.plan?.type === 'enterprise') return null
  
  return (
    <Button asChild variant="default" className="gap-2">
      <Link href="/pricing">
        <Sparkles className="h-4 w-4" />
        {subscription?.plan?.type === 'basico' ? 'Fazer Upgrade' : 'Upgrade para Enterprise'}
      </Link>
    </Button>
  )
}
```

## 8. Middleware para Proteger Rotas

```tsx
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verificar se rota requer plano específico
  if (request.nextUrl.pathname.startsWith('/biblioteca-publica')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Verificar subscription
    const { data: subscription } = await supabase
      .rpc('get_user_active_subscription', { p_user_id: user.id })
      .single()
    
    if (!subscription?.plan_features?.biblioteca_publica) {
      return NextResponse.redirect(new URL('/pricing', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: ['/biblioteca-publica/:path*', '/chat/:path*']
}
```

## 9. Exibir Planos na Página de Pricing

```tsx
// app/pricing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { getAvailablePlans } from '@/lib/subscription-utils'
import { PlanCard } from '@/components/subscription/PlanCard'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { redirectToCheckout } from '@/lib/stripe/client'

export default function PricingPage() {
  const { user } = useAuth()
  const { subscription } = useSubscription(user?.id)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    async function fetchPlans() {
      const { plans: availablePlans } = await getAvailablePlans()
      setPlans(availablePlans)
    }
    fetchPlans()
  }, [])
  
  const handleSelectPlan = async (plan: any) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: plan.type,
          priceId: plan.stripe_price_id,
          includeTrial: !subscription, // Trial apenas para novos usuários
        }),
      })
      
      const { sessionId } = await response.json()
      await redirectToCheckout(sessionId)
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold text-center mb-12">
        Escolha seu Plano
      </h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={subscription?.plan_id === plan.id}
            isPopular={plan.type === 'profissional'}
            onSelect={() => handleSelectPlan(plan)}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}
```

## 10. Notificação de Trial Expirando

```tsx
// app/components/TrialExpiringNotice.tsx
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import Link from 'next/link'

export function TrialExpiringNotice({ userId }: { userId: string }) {
  const { isTrialActive, daysUntilTrialEnd } = useSubscription(userId)
  
  // Mostrar apenas se trial está ativo e faltam 3 dias ou menos
  if (!isTrialActive || !daysUntilTrialEnd || daysUntilTrialEnd > 3) {
    return null
  }
  
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Clock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">
        Seu trial expira em {daysUntilTrialEnd} dias
      </AlertTitle>
      <AlertDescription className="text-amber-800">
        <p className="mb-3">
          Não perca acesso às funcionalidades premium. Assine agora e continue aproveitando!
        </p>
        <Button asChild size="sm">
          <Link href="/pricing">
            Escolher Plano
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

## Dicas de Implementação

### 1. Sempre verificar autenticação primeiro
```tsx
const { user } = useAuth()
if (!user) return <LoginPrompt />
```

### 2. Usar loading states
```tsx
const { loading } = useSubscription(user?.id)
if (loading) return <Skeleton />
```

### 3. Fallback gracioso
```tsx
<FeatureGate 
  userId={user?.id} 
  feature="chat_nativo"
  fallback={<ChatDisabledMessage />}
>
  <Chat />
</FeatureGate>
```

### 4. Mensagens claras
```tsx
{!hasAccess && (
  <p>Esta funcionalidade está disponível no plano Profissional ou superior.</p>
)}
```
