"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { useAccessStatus } from "@/hooks/use-access-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle, Loader2, ArrowRight } from "lucide-react"

interface AccessGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireActiveSubscription?: boolean
}

export default function AccessGuard({ 
  children, 
  requireAuth = true, 
  requireActiveSubscription = true 
}: AccessGuardProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { accessStatus, loading: accessLoading } = useAccessStatus()

  const isLoading = authLoading || accessLoading

  // Se não requer autenticação, mostrar conteúdo
  if (!requireAuth) {
    return <>{children}</>
  }

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não está autenticado, redirecionar para login
  if (!user) {
    return null // Deixar o AuthGuard lidar com o redirecionamento
  }

  // Se não requer assinatura ativa, mostrar conteúdo
  if (!requireActiveSubscription) {
    return <>{children}</>
  }

  // Verificar status de acesso
  if (!accessStatus?.access_granted) {
    console.log('AccessGuard: Acesso negado', {
      user: user?.id,
      accessStatus,
      loading: accessLoading
    })
    
    // TEMPORÁRIO: Permitir acesso se usuário estiver autenticado
    if (user) {
      console.log('AccessGuard: Permitindo acesso temporário para usuário autenticado')
      return <>{children}</>
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                Acesso Restrito
              </CardTitle>
              <CardDescription className="text-lg">
                {accessStatus?.message || "Você não tem acesso a esta área"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status específico */}
              {accessStatus?.status === 'registration_incomplete' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Você precisa completar seu registro escolhendo um plano para continuar.
                  </AlertDescription>
                </Alert>
              )}

              {accessStatus?.status === 'expired' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {accessStatus.plan_name && (
                      <div className="mb-2">
                        <strong>Plano anterior:</strong> {accessStatus.plan_name}
                      </div>
                    )}
                    {accessStatus.is_trial 
                      ? "Seu período de teste expirou. Escolha um plano pago para continuar."
                      : "Sua assinatura expirou. Renove para continuar."
                    }
                  </AlertDescription>
                </Alert>
              )}

              {accessStatus?.status === 'no_active_subscription' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Você não possui uma assinatura ativa. Escolha um plano para continuar.
                  </AlertDescription>
                </Alert>
              )}

              {/* Informações do plano anterior */}
              {accessStatus?.plan_name && accessStatus?.status === 'expired' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Informações do Plano Anterior</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Plano:</span>
                      <span className="font-medium">{accessStatus.plan_name}</span>
                    </div>
                    {accessStatus.is_trial && (
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Trial
                        </Badge>
                      </div>
                    )}
                    {accessStatus.period_end && (
                      <div className="flex justify-between">
                        <span>Expirou em:</span>
                        <span className="font-medium">
                          {new Date(accessStatus.period_end).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push("/choose-plan")}
                  className="flex-1"
                  size="lg"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Escolher Plano
                </Button>
                
                <Button
                  onClick={() => router.push("/admin/billing")}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Gerenciar Assinatura
                </Button>
              </div>

              {/* Informações adicionais */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  Precisa de ajuda? Entre em contato com nosso suporte.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Acesso concedido, mostrar conteúdo
  return <>{children}</>
}
