'use client'

import { Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Plan } from '@/types/subscription'
import { FEATURE_LABELS } from '@/types/subscription'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  plan: Plan
  isCurrentPlan?: boolean
  isPopular?: boolean
  onSelect?: () => void
  loading?: boolean
}

export function PlanCard({ plan, isCurrentPlan, isPopular, onSelect, loading }: PlanCardProps) {
  return (
    <Card className={cn(
      'relative flex flex-col',
      isPopular && 'border-primary shadow-lg scale-105',
      isCurrentPlan && 'border-green-500'
    )}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Mais popular
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">
          Plano Atual
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.type === 'basico' && 'Ideal para pequenas equipes começando com gestão documental'}
          {plan.type === 'profissional' && 'Para empresas que precisam de recursos avançados de gestão'}
          {plan.type === 'enterprise' && 'Solução completa para grandes empresas'}
        </CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">R$ {plan.price}</span>
          <span className="text-muted-foreground">/mês</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Até {plan.limits.max_usuarios} usuários</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>{plan.limits.armazenamento_gb} GB de armazenamento</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          {Object.entries(plan.features).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {value ? (
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <span className={cn(!value && 'text-muted-foreground line-through')}>
                {FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]}
              </span>
            </div>
          ))}
        </div>

        {plan.limits.usuario_adicional_preco && (
          <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
            <p>Usuário adicional: R$ {plan.limits.usuario_adicional_preco} / usuário</p>
            {plan.limits.armazenamento_extra_preco && (
              <p>Armazenamento extra: R$ {plan.limits.armazenamento_extra_preco} / GB</p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'outline'}
          onClick={onSelect}
          disabled={isCurrentPlan || loading}
        >
          {isCurrentPlan ? 'Plano Atual' : loading ? 'Processando...' : 'Começar agora'}
        </Button>
      </CardFooter>
    </Card>
  )
}
