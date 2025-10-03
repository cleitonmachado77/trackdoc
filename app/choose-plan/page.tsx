"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Clock, Star, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRegistrationPlans, type RegistrationPlan } from "@/hooks/use-registration-plans"
import { useAccessStatus } from "@/hooks/use-access-status"

export default function ChoosePlanPage() {
  const router = useRouter()
  const { user, createSubscription } = useAuth()
  const { plans, loading: plansLoading, error: plansError } = useRegistrationPlans()
  const { accessStatus, loading: accessLoading } = useAccessStatus()
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Redirecionar se já tem acesso ativo
  useEffect(() => {
    if (!accessLoading && accessStatus?.access_granted) {
      console.log('ChoosePlan: Usuário já tem acesso, redirecionando para dashboard')
      router.push("/")
    }
  }, [accessStatus, accessLoading, router])

  // Redirecionar se não está autenticado
  useEffect(() => {
    if (!user) {
      console.log('ChoosePlan: Usuário não autenticado, redirecionando para login')
      router.push("/login")
    }
  }, [user, router])

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId)
    setError("")
  }

  const handleCreateSubscription = async (isTrial: boolean = false) => {
    if (!selectedPlan) {
      setError("Por favor, selecione um plano")
      return
    }

    setIsCreatingSubscription(true)
    setError("")
    setSuccess("")

    try {
      const { error, data } = await createSubscription(selectedPlan, isTrial)

      if (error) {
        setError(error.message || "Erro ao criar assinatura")
        return
      }

      setSuccess("Assinatura criada com sucesso! Redirecionando...")
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      console.error('Erro ao criar assinatura:', err)
      setError("Erro interno do servidor")
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  const getSelectedPlan = (): RegistrationPlan | null => {
    return plans.find(plan => plan.id === selectedPlan) || null
  }

  if (accessLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando planos...</p>
        </div>
      </div>
    )
  }

  if (plansError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar planos: {plansError}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selecione o plano que melhor atende às suas necessidades. 
            Você pode começar com o teste gratuito e fazer upgrade quando quiser.
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <Alert className="max-w-2xl mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="max-w-2xl mx-auto mb-8">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id
                  ? "ring-2 ring-blue-500 shadow-lg scale-105"
                  : "hover:scale-105"
              } ${plan.is_popular ? "border-blue-500" : ""}`}
              onClick={() => handlePlanSelection(plan.id)}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold text-blue-600">
                    R$ {plan.price_monthly.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </div>
                  
                  {plan.is_trial && (
                    <Badge className="bg-green-100 text-green-800 mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {plan.trial_days} dias grátis
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Limites */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Usuários:</span>
                    <span className="font-medium">Até {plan.max_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Armazenamento:</span>
                    <span className="font-medium">{plan.max_storage_gb}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documentos:</span>
                    <span className="font-medium">Até {plan.max_documents}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Recursos Inclusos:</h4>
                  {plan.features?.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features && plan.features.length > 4 && (
                    <div className="text-xs text-gray-500">
                      +{plan.features.length - 4} recursos adicionais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Plano Selecionado: {getSelectedPlan()?.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {getSelectedPlan()?.is_trial 
                  ? `Comece com ${getSelectedPlan()?.trial_days} dias grátis`
                  : "Acesso imediato a todos os recursos"
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {getSelectedPlan()?.is_trial && (
                  <Button
                    onClick={() => handleCreateSubscription(true)}
                    disabled={isCreatingSubscription}
                    className="flex-1"
                    variant="outline"
                  >
                    {isCreatingSubscription ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2" />
                    )}
                    Começar Teste Grátis
                  </Button>
                )}
                
                <Button
                  onClick={() => handleCreateSubscription(false)}
                  disabled={isCreatingSubscription}
                  className="flex-1"
                >
                  {isCreatingSubscription ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {getSelectedPlan()?.is_trial ? "Assinar Agora" : "Continuar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-500">
          <p>
            Você pode cancelar ou alterar seu plano a qualquer momento. 
            Não há compromisso de permanência.
          </p>
        </div>
      </div>
    </div>
  )
}
