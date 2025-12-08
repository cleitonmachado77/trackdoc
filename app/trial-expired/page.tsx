'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useSubscription } from '@/lib/hooks/useSubscription'

export default function TrialExpiredPage() {
  const { user } = useAuth()
  const { subscription } = useSubscription(user?.id)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Período de Teste Expirado</CardTitle>
          <CardDescription>
            Seu período de teste de 14 dias chegou ao fim
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {subscription && (
            <div className="bg-amber-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plano testado:</span>
                <span className="font-semibold">{subscription.plan?.name}</span>
              </div>
              {subscription.trial_end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trial expirou em:</span>
                  <span className="font-semibold">
                    {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Gostou do TrackDoc?
              </p>
              <p className="text-sm text-blue-700">
                Continue aproveitando todas as funcionalidades escolhendo um plano que se encaixa nas suas necessidades.
              </p>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href="/pricing" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Escolher Plano
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/minha-conta?tab=plano" className="gap-2">
                Ver Detalhes da Conta
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-semibold text-gray-700">
              O que você teve acesso durante o trial:
            </p>
            <ul className="space-y-1">
              {subscription?.plan?.features && Object.entries(subscription.plan.features).map(([key, value]) => {
                if (!value) return null
                const labels: Record<string, string> = {
                  dashboard_gerencial: 'Dashboard gerencial',
                  upload_documentos: 'Upload de documentos',
                  solicitacao_aprovacoes: 'Solicitação de aprovações',
                  biblioteca_publica: 'Biblioteca Pública',
                  assinatura_eletronica_simples: 'Assinatura eletrônica',
                }
                return (
                  <li key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span>{labels[key] || key}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Dúvidas? Entre em contato:{' '}
              <a href="mailto:suporte@trackdoc.com.br" className="text-primary hover:underline">
                suporte@trackdoc.com.br
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
