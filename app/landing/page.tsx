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
  Bell, 
  MessageSquare, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight, 
  Star, 
  Play, 
  Download,
  Building2,
  Clock,
  Target,
  TrendingUp,
  Award,
  Globe,
  Lock,
  Smartphone,
  Cloud,
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  ExternalLink
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      )}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/logo-horizontal-preto.png" 
                alt="TrackDoc" 
                className="h-8 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Funcionalidades</a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">Benefícios</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Preços</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Depoimentos</a>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/verify-signature')}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Verificar Assinatura
              </Button>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/login')}
                className="text-gray-700 hover:text-blue-600"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => router.push('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Funcionalidades</a>
                <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">Benefícios</a>
                <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Preços</a>
                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Depoimentos</a>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/verify-signature')}
                  className="text-gray-700 hover:text-blue-600 transition-colors justify-start"
                >
                  Verificar Assinatura
                </Button>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push('/login')}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Entrar
                  </Button>
                  <Button 
                    onClick={() => router.push('/register')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Criar Conta
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              🚀 Nova versão com IA integrada
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Revolucione a Gestão de
              <span className="text-blue-600 block">Documentos da sua Empresa</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Automatize processos, assine digitalmente e gerencie documentos com inteligência artificial. 
              Tudo em uma plataforma segura e intuitiva.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={() => router.push('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg border-2"
              >
                <Play className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10K+</div>
                <div className="text-gray-600">Documentos Processados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-gray-600">Empresas Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <div className="text-gray-600">Uptime Garantido</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-gray-600">Suporte Técnico</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Poderosas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para transformar a gestão de documentos da sua empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Resultados Comprovados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Veja como o TrackDoc está transformando empresas em todo o Brasil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{benefit.stat}</div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Empresas de todos os tamanhos confiam no TrackDoc
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-600 italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos que Cabem no Seu Bolso
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para sua empresa. Sem taxas ocultas, sem surpresas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={cn(
                "relative hover:shadow-xl transition-all duration-300 border-0 shadow-lg",
                plan.popular && "ring-2 ring-blue-600 scale-105"
              )}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={cn(
                      "w-full",
                      plan.popular 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    )}
                    onClick={() => router.push('/register')}
                  >
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Verification Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Verificação Pública de Assinaturas
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Qualquer pessoa pode verificar a autenticidade de assinaturas eletrônicas do TrackDoc. 
              Transparência total e segurança garantida.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Verificação Instantânea</h3>
                <p className="text-gray-600 text-sm">Digite o ID da assinatura e obtenha a validação em segundos</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Segurança Total</h3>
                <p className="text-gray-600 text-sm">Hash criptográfico e blockchain para máxima segurança</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Validade Legal</h3>
                <p className="text-gray-600 text-sm">Conforme Lei 14.063/2020 e ICP-Brasil</p>
              </div>
            </div>
            <Button 
              size="lg" 
              onClick={() => router.push('/verify-signature')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              Verificar Assinatura Agora
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">
              Pronto para Transformar sua Empresa?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Junte-se a centenas de empresas que já revolucionaram sua gestão de documentos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/register')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
              >
                Falar com Vendas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/logo-horizontal-preto.png" 
                  alt="TrackDoc" 
                  className="h-8 w-auto filter brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 mb-4">
                A plataforma mais completa para gestão de documentos empresariais.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="/verify-signature" className="hover:text-white transition-colors">Verificar Assinatura</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TrackDoc. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
