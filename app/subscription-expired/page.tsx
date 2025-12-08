'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CreditCard, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useSubscription } from '@/lib/hooks/useSubscription'

export default function SubscriptionExpiredPage() {
  const { user } = useAuth()
  const { subscription } = useSubscription(user?.id)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Assinatura Expirada</CardTitle>
          <CardDescription>
            Sua assinatura do TrackDoc expirou ou foi cancelada
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {subscription && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plano anterior:</span>
                <span className="font-semibold">{subscription.plan?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-red-600">
                  {subscription.status === 'expired' ? 'Expirado' : 'Cancelado'}
                </span>
              </div>
              {subscription.canceled_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cancelado em:</span>
                  <span className="font-semibold">
                    {new Date(subscription.canceled_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Para continuar usando o TrackDoc, renove sua assinatura ou escolha um novo plano.
            </p>

            <Button asChild className="w-full" size="lg">
              <Link href="/pricing" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Renovar Assinatura
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/minha-conta?tab=plano" className="gap-2">
                Ver Detalhes da Conta
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Precisa de ajuda? Entre em contato com nosso{' '}
              <a href="mailto:suporte@trackdoc.com.br" className="text-primary hover:underline">
                suporte
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
