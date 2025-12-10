"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star, Building, Users, FileText, HardDrive, ArrowLeft, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"

interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  max_users: number
  max_storage_gb: number
  max_documents: number
  features: string[]
  is_active: boolean
  type: string
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

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

  const getPlanIcon = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'basico':
        return <Star className="h-6 w-6" />
      case 'profissional':
        return <Crown className="h-6 w-6" />
      case 'enterprise':
        return <Building className="h-6 w-6" />
      default:
        return <Star className="h-6 w-6" />
    }
  }

  const getPlanColor = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'basico':
        return 'bg-blue-500'
      case 'profissional':
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nossos Planos
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Escolha o plano ideal para sua empresa
          </p>
          <p className="text-gray-500">
            Para contratar um plano, entre em contato com nossa equipe
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.type === 'profissional' ? 'border-2 border-purple-200 scale-105' : ''
              }`}
            >
              {plan.type === 'profissional' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  Mais Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getPlanColor(plan.type)} text-white mb-4 mx-auto`}>
                  {getPlanIcon(plan.type)}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price_monthly)}
                  </div>
                  <div className="text-gray-500">por mês</div>
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
                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border-2 border-blue-200">
          <h2 className="text-2xl font-bold mb-4">Interessado em um plano?</h2>
          <p className="text-gray-600 mb-6">
            Para contratar ou alterar seu plano, entre em contato com o administrador do sistema ou nossa equipe de suporte
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/support">
                <Mail className="h-4 w-4" />
                Contatar Administrador
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="https://wa.me/551151926440" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp: (11) 5192-6440
              </a>
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona a contratação?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Entre em contato com nossa equipe e criaremos sua conta com o plano escolhido. 
                  Você receberá as credenciais de acesso por email.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso mudar de plano?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento 
                  entrando em contato com nossa equipe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Há suporte técnico?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Todos os planos incluem suporte por email. Planos Profissional e Enterprise 
                  incluem suporte prioritário.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Qual a forma de pagamento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Aceitamos boleto bancário, PIX e transferência. Entre em contato para 
                  mais informações sobre faturamento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
