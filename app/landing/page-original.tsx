"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  CheckCircle, 
  Bot, 
  PenTool, 
  GitBranch, 
  BarChart3, 
  Shield, 
  Star, 
  Play, 
  Clock,
  TrendingUp,
  Award,
  Search,
  User,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: FileText,
      title: "Gestão Inteligente de Documentos",
      description: "Organize, categorize e gerencie todos os seus documentos em um só lugar com IA integrada.",
      color: "text-blue-600"
    },
    {
      icon: CheckCircle,
      title: "Sistema de Aprovações",
      description: "Workflow automatizado para aprovação de documentos com notificações em tempo real.",
      color: "text-green-600"
    },
    {
      icon: Bot,
      title: "Criação com IA",
      description: "Gere documentos profissionais automaticamente usando inteligência artificial avançada.",
      color: "text-purple-600"
    },
    {
      icon: PenTool,
      title: "Assinatura Eletrônica",
      description: "Assine documentos digitalmente com segurança jurídica e rastreabilidade completa.",
      color: "text-orange-600"
    },
    {
      icon: GitBranch,
      title: "Workflow Automatizado",
      description: "Configure fluxos de trabalho personalizados para otimizar seus processos internos.",
      color: "text-indigo-600"
    },
    {
      icon: BarChart3,
      title: "Dashboard Executivo",
      description: "Acompanhe métricas e KPIs em tempo real com relatórios visuais interativos.",
      color: "text-cyan-600"
    }
  ]

  const benefits = [
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Reduza em até 70% o tempo gasto com gestão de documentos",
      stat: "70%"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Proteção de dados com criptografia de nível bancário",
      stat: "100%"
    },
    {
      icon: TrendingUp,
      title: "Aumento de Produtividade",
      description: "Melhore a eficiência da sua equipe com automação inteligente",
      stat: "3x"
    },
    {
      icon: Award,
      title: "Conformidade Legal",
      description: "Mantenha-se em conformidade com todas as regulamentações",
      stat: "100%"
    }
  ]

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Diretora de RH",
      company: "TechCorp",
      content: "O TrackDoc revolucionou nossa gestão de documentos. A economia de tempo é impressionante!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Gerente Financeiro",
      company: "Inovação Ltda",
      content: "A assinatura eletrônica e o workflow automatizado nos deram total controle e segurança.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "CEO",
      company: "StartupXYZ",
      content: "A IA para criação de documentos é um diferencial incrível. Recomendo para qualquer empresa!",
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "R$ 29",
      period: "/mês",
      description: "Perfeito para pequenas empresas",
      features: [
        "Até 100 documentos",
        "3 usuários",
        "Assinatura eletrônica básica",
        "Suporte por email",
        "Dashboard básico"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "R$ 79",
      period: "/mês",
      description: "Ideal para empresas em crescimento",
      features: [
        "Documentos ilimitados",
        "Usuários ilimitados",
        "IA para criação de documentos",
        "Workflow avançado",
        "Dashboard executivo",
        "Suporte prioritário",
        "Integrações avançadas"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$ 199",
      period: "/mês",
      description: "Para grandes corporações",
      features: [
        "Tudo do Professional",
        "API personalizada",
        "Suporte 24/7",
        "Treinamento dedicado",
        "SLA garantido",
        "Backup automático",
        "Auditoria avançada"
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Apple Style */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-200" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/logo-horizontal-preto.png" 
                alt="TrackDoc" 
                className="h-6 w-auto"
              />
            </div>

            {/* Desktop Navigation - Apple Style */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Funcionalidades</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Benefícios</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Preços</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Depoimentos</a>
            </nav>

            {/* CTA Buttons - Apple Style */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/verify-signature')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Verificar Assinatura
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => router.push('/register')}
                className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-6 py-2 rounded-full"
              >
                Criar Conta
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Funcionalidades</a>
                <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Benefícios</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Preços</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Depoimentos</a>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/verify-signature')}
                  className="text-gray-600 hover:text-gray-900 transition-colors justify-start text-sm font-medium"
                >
                  Verificar Assinatura
                </Button>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push('/login')}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Entrar
                  </Button>
                  <Button 
                    onClick={() => router.push('/register')}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full"
                  >
                    Criar Conta
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Apple Style */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
              🚀 Nova versão com IA integrada
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-light text-gray-900 mb-8 leading-tight tracking-tight">
            TrackDoc.
          </h1>
          
          <p className="text-2xl md:text-3xl font-light text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            O melhor jeito de gerenciar documentos empresariais.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              size="lg" 
              onClick={() => router.push('/register')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg rounded-full font-medium"
            >
              Começar Gratuitamente
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              className="text-gray-600 hover:text-gray-900 px-8 py-4 text-lg font-medium"
            >
              <Play className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>

          {/* Stats - Apple Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">10K+</div>
              <div className="text-gray-600 text-sm font-medium">Documentos Processados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">500+</div>
              <div className="text-gray-600 text-sm font-medium">Empresas Ativas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600 text-sm font-medium">Uptime Garantido</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600 text-sm font-medium">Suporte Técnico</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Apple Product Grid Style */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              Funcionalidades Poderosas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Tudo que você precisa para transformar a gestão de documentos da sua empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-200 transition-colors">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Apple Style */}
      <section id="benefits" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              Resultados Comprovados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Veja como o TrackDoc está transformando empresas em todo o Brasil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-5xl font-light text-gray-900 mb-4">{benefit.stat}</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Apple Style */}
      <section id="testimonials" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              O que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Empresas de todos os tamanhos confiam no TrackDoc
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gray-900 text-gray-900" />
                  ))}
                </div>
                <p className="text-gray-600 italic text-lg leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Apple Style */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-light text-gray-900 mb-6">
              Planos que Cabem no Seu Bolso
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Escolha o plano ideal para sua empresa. Sem taxas ocultas, sem surpresas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={cn(
                "relative bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-500",
                plan.popular && "ring-2 ring-gray-900 scale-105"
              )}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-medium text-gray-900 mb-4">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-light text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 text-lg">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-gray-900 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={cn(
                    "w-full rounded-full py-4 text-lg font-medium",
                    plan.popular 
                      ? "bg-gray-900 hover:bg-gray-800 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  )}
                  onClick={() => router.push('/register')}
                >
                  Começar Agora
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Verification Section - Apple Style */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-5xl font-light text-gray-900 mb-6">
            Verificação Pública de Assinaturas
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto font-light">
            Qualquer pessoa pode verificar a autenticidade de assinaturas eletrônicas do TrackDoc. 
            Transparência total e segurança garantida.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Verificação Instantânea</h3>
              <p className="text-gray-600">Digite o ID da assinatura e obtenha a validação em segundos</p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Segurança Total</h3>
              <p className="text-gray-600">Hash criptográfico e blockchain para máxima segurança</p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Validade Legal</h3>
              <p className="text-gray-600">Conforme Lei 14.063/2020 e ICP-Brasil</p>
            </div>
          </div>
          <Button 
            size="lg" 
            onClick={() => router.push('/verify-signature')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg rounded-full font-medium"
          >
            <Shield className="mr-2 h-5 w-5" />
            Verificar Assinatura Agora
          </Button>
        </div>
      </section>

      {/* CTA Section - Apple Style */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-light text-white mb-6">
            Pronto para Transformar sua Empresa?
          </h2>
          <p className="text-xl text-gray-300 mb-12 font-light">
            Junte-se a centenas de empresas que já revolucionaram sua gestão de documentos
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/register')}
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg rounded-full font-medium"
            >
              Começar Gratuitamente
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg rounded-full font-medium"
            >
              Falar com Vendas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Apple Style */}
      <footer className="bg-white border-t border-gray-200 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center mb-6">
                <img 
                  src="/logo-horizontal-preto.png" 
                  alt="TrackDoc" 
                  className="h-6 w-auto"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                A plataforma mais completa para gestão de documentos empresariais.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-6 text-sm">Descobrir e Comprar</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Preços</a></li>
                <li><a href="/verify-signature" className="text-gray-600 hover:text-gray-900 transition-colors">Verificar Assinatura</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Integrações</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-6 text-sm">Sua Conta</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Entrar</a></li>
                <li><a href="/register" className="text-gray-600 hover:text-gray-900 transition-colors">Criar Conta</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Gerenciar Conta</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Central de Ajuda</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-6 text-sm">Empresa</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Sobre</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Carreiras</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-6 text-sm">Suporte</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Documentação</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Status</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Segurança</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm mb-4 md:mb-0">
                &copy; 2024 TrackDoc. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Política de Privacidade</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Termos de Uso</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Mapa do Site</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
