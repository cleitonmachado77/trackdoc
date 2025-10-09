"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Check, Crown, Star, Zap, Building, Users, FileText, HardDrive, ArrowRight } from "lucide-react"
import { useAuth } from '@/lib/hooks/use-unified-auth'
import Link from "next/link"

interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_storage_gb: number
  max_documents: number
  trial_days: number
  is_trial: boolean
  features: string[]
  is_active: boolean
}

export default function PricingPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'trial':
        return <Zap className="h-6 w-6" />
      case 'starter':
        return <Star className="h-6 w-6" />
      case 'professional':
        return <Crown className="h-6 w-6" />
      case 'enterprise':
        return <Building className="h-6 w-6" />
      default:
        return <Star className="h-6 w-6" />
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'trial':
        return 'bg-blue-500'
      case 'starter':
        return 'bg-green-500'
      case 'professional':
        return 'bg-purple-500'
      case 'enterprise':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleSubscribe = (planId: string) => {
    // Implementar integração com gateway de pagamento
    console.log('Assinando plano:', planId)
    // Redirecionar para checkout ou processar pagamento
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o Plano Ideal para Sua Empresa
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comece gratuitamente e escale conforme sua necessidade
          </p>

          {/* Toggle Billing Cycle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Label htmlFor="billing-cycle" className="text-sm font-medium">
              Mensal
            </Label>
            <Switch
              id="billing-cycle"
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-cycle" className="text-sm font-medium">
              Anual
              <Badge className="ml-2 bg-green-100 text-green-800">Economia de 17%</Badge>
            </Label>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
              } ${plan.name === 'Professional' ? 'border-2 border-purple-200' : ''}`}
            >
              {plan.name === 'Professional' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  Mais Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getPlanColor(plan.name)} text-white mb-4`}>
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly)}
                  </div>
                  <div className="text-gray-500">
                    por {billingCycle === 'monthly' ? 'mês' : 'ano'}
                  </div>
                  {plan.trial_days > 0 && (
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      {plan.trial_days} dias grátis
                    </Badge>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Até {plan.max_users} usuário{plan.max_users > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>Até {plan.max_documents} documentos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    <span>Até {plan.max_storage_gb}GB de armazenamento</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {plan.is_trial ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      Já tenho trial
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {user ? 'Escolher Plano' : 'Começar Agora'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sim! Você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento ou compromissos de longo prazo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona o período de teste?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Você tem 7 dias de acesso completo gratuito. Após esse período, escolha um plano para continuar usando o TrackDoc.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso mudar de plano?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas imediatamente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Há suporte técnico?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Todos os planos incluem suporte por email. Planos Professional e Enterprise incluem suporte prioritário.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-gray-600 mb-6">
            Junte-se a milhares de empresas que já confiam no TrackDoc
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                Falar com vendas
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
