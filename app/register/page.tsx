"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, FileText, Loader2, AlertCircle, CheckCircle, ArrowRight, Crown, Star, Building2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useRegistrationPlans } from "@/hooks/use-registration-plans"
import { createBrowserClient } from '@supabase/ssr'
import Link from "next/link"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { plans, loading: plansLoading, error: plansError } = useRegistrationPlans()
  // Verificar se as variáveis de ambiente estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuração Necessária</h1>
          <p className="text-gray-600">As variáveis de ambiente do Supabase não estão configuradas.</p>
        </div>
      </div>
    )
  }
  
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  
  const [registrationType, setRegistrationType] = useState<'individual' | 'entity'>('individual')
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    // Campos específicos para entidade
    entityName: "",
    entityLegalName: "",
    entityCnpj: "",
    entityPhone: "",
  })
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const handlePlanSelection = (planId: string) => {
    setSelectedPlanId(planId)
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Nome completo é obrigatório")
      return false
    }
    if (!formData.email) {
      setError("Email é obrigatório")
      return false
    }
    if (!formData.email.includes("@")) {
      setError("Email inválido")
      return false
    }
    if (!formData.password) {
      setError("Senha é obrigatória")
      return false
    }
    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return false
    }
    if (!formData.acceptTerms) {
      setError("Você deve aceitar os termos de uso")
      return false
    }
    if (!selectedPlanId) {
      setError("Selecione um plano para continuar")
      return false
    }

    // Validações específicas para entidade
    if (registrationType === 'entity') {
      if (!formData.entityName.trim()) {
        setError("Nome da entidade é obrigatório")
        return false
      }
      if (!formData.entityLegalName.trim()) {
        setError("Razão social é obrigatória")
        return false
      }
      if (!formData.entityCnpj.trim()) {
        setError("CNPJ é obrigatório")
        return false
      }
      if (formData.entityCnpj.replace(/\D/g, '').length !== 14) {
        setError("CNPJ deve ter 14 dígitos")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlanId) {
      setError("Por favor, selecione um plano.")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // 1. Criar conta
      const signUpResult = await signUp(formData.email, formData.password, formData.fullName)
      
      if (signUpResult.error) {
        if (signUpResult.error.message.includes("already registered")) {
          setError("Este email já está cadastrado. Faça login ou use outro email.")
        } else {
          setError(signUpResult.error.message)
        }
        return
      }

      const { data } = signUpResult as { error: null; data: any }

      // NÃO tentar buscar o perfil imediatamente - aguardar confirmação do email
      // O perfil será criado automaticamente pelo trigger quando o email for confirmado
      
      if (registrationType === 'entity') {
        // Para entidades, vamos criar o perfil manualmente (sem verificar se existe)
        try {
          // 1. Criar perfil de entidade diretamente
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user!.id,
              full_name: formData.fullName,
              email: formData.email,
              role: 'admin',
              status: 'active',
              permissions: '["read", "write", "admin"]',
              entity_id: null, // Será atualizado depois
              registration_type: 'entity_admin',
              entity_role: 'admin',
              selected_plan_id: selectedPlanId,
              registration_completed: true
            }])

          if (profileError) {
            // Se der erro de chave duplicada, significa que o trigger já criou o perfil
            if (profileError.code === '23505') {
              console.log('Perfil já existe (criado pelo trigger), atualizando...')
              const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                  role: 'admin',
                  permissions: '["read", "write", "admin"]',
                  registration_type: 'entity_admin',
                  entity_role: 'admin',
                  selected_plan_id: selectedPlanId,
                  registration_completed: true
                })
                .eq('id', data.user!.id)

              if (profileUpdateError) {
                console.error('Erro ao atualizar perfil existente:', profileUpdateError)
                setError("Conta criada, mas erro ao atualizar perfil. Entre em contato com o suporte.")
                return
              }
            } else {
              console.error('Erro ao criar perfil de entidade:', profileError)
              setError("Conta criada, mas erro ao criar perfil. Entre em contato com o suporte.")
              return
            }
          }

          // 2. Criar entidade com admin_user_id válido
          const { data: entityData, error: entityError } = await supabase
            .from('entities')
            .insert([{
              name: formData.entityName,
              legal_name: formData.entityLegalName,
              cnpj: formData.entityCnpj.replace(/\D/g, ''),
              email: formData.email,
              phone: formData.entityPhone,
              subscription_plan_id: selectedPlanId,
              max_users: 10, // Padrão para entidades
              admin_user_id: data.user!.id, // Agora o perfil já existe
            }])
            .select()
            .single()

          if (entityError) {
            console.error('Erro ao criar entidade:', entityError)
            setError("Conta criada, mas erro ao criar entidade. Entre em contato com o suporte.")
            return
          }

          // 3. Atualizar o perfil com o entity_id
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ entity_id: entityData.id })
            .eq('id', data.user!.id)

          if (updateProfileError) {
            console.error('Erro ao atualizar perfil com entity_id:', updateProfileError)
            setError("Conta criada, mas erro ao vincular perfil à entidade. Entre em contato com o suporte.")
            return
          }

          // 4. Criar assinatura da entidade
          const selectedPlan = plans?.find(plan => plan.id === selectedPlanId)
          const isTrial = selectedPlan?.is_trial || false

          const { error: entitySubscriptionError } = await supabase
            .from('entity_subscriptions')
            .insert([{
              entity_id: entityData.id,
              plan_id: selectedPlanId,
              is_trial: isTrial,
              status: isTrial ? 'trial' : 'active'
            }])

          if (entitySubscriptionError) {
            console.error('Erro ao criar assinatura da entidade:', entitySubscriptionError)
            setError("Conta criada, mas erro ao configurar assinatura. Entre em contato com o suporte.")
            return
          }

          setSuccess("Conta de entidade criada com sucesso! Verifique seu email para confirmar o cadastro.")
          router.push('/confirm-email')
          
        } catch (error) {
          console.error('Erro ao criar entidade:', error)
          setError("Conta criada, mas erro ao configurar entidade. Entre em contato com o suporte.")
          return
        }
      } else {
        // Para usuários individuais, aguardar confirmação do email
        // O trigger handle_new_user criará o perfil automaticamente
        setSuccess("Conta criada com sucesso! Verifique seu email para confirmar o cadastro.")
        router.push('/confirm-email')
      }
    } catch (err) {
      console.error('Erro no registro:', err)
      setError("Erro interno do servidor. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Grátis"
    return `R$ ${price.toFixed(2).replace('.', ',')}`
  }

  const formatFeatures = (features: any) => {
    if (!features || !Array.isArray(features)) return []
    return features.slice(0, 3) // Mostrar apenas 3 features principais
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-trackdoc-blue-light via-white to-trackdoc-blue-light p-4">
      <div className="max-w-6xl mx-auto">
        {/* 🎨 Logo e Header - Novo Design */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo-horizontal-preto.png" 
              alt="TrackDoc Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 🎨 Formulário de Registro - Novo Design */}
          <Card className="shadow-trackdoc-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-trackdoc-black">Criar conta</CardTitle>
              <CardDescription className="text-center text-trackdoc-gray">
                Preencha seus dados para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Registro */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Tipo de Cadastro</Label>
                  <RadioGroup
                    value={registrationType}
                    onValueChange={(value: 'individual' | 'entity') => setRegistrationType(value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="flex items-center space-x-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Usuário Individual</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="entity" id="entity" />
                      <Label htmlFor="entity" className="flex items-center space-x-2 cursor-pointer">
                        <Building2 className="h-4 w-4" />
                        <span>Entidade/Organização</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Campos específicos para entidade */}
                {registrationType === 'entity' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900">Dados da Entidade</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="entityName">Nome da Entidade</Label>
                      <Input
                        id="entityName"
                        type="text"
                        placeholder="Ex: Empresa XYZ Ltda"
                        value={formData.entityName}
                        onChange={(e) => handleInputChange("entityName", e.target.value)}
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="entityLegalName">Razão Social</Label>
                      <Input
                        id="entityLegalName"
                        type="text"
                        placeholder="Ex: Empresa XYZ Comércio e Serviços Ltda"
                        value={formData.entityLegalName}
                        onChange={(e) => handleInputChange("entityLegalName", e.target.value)}
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="entityCnpj">CNPJ</Label>
                        <Input
                          id="entityCnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          value={formData.entityCnpj}
                          onChange={(e) => handleInputChange("entityCnpj", e.target.value)}
                          className="h-11"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entityPhone">Telefone</Label>
                        <Input
                          id="entityPhone"
                          type="text"
                          placeholder="(11) 99999-9999"
                          value={formData.entityPhone}
                          onChange={(e) => handleInputChange("entityPhone", e.target.value)}
                          className="h-11"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dados do Responsável */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">
                    {registrationType === 'entity' ? 'Dados do Administrador' : 'Seus Dados'}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="h-11 pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="h-11 pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Termos de Uso */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    Aceito os{" "}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                      termos de uso
                    </Link>{" "}
                    e{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                      política de privacidade
                    </Link>
                  </Label>
                </div>

                {/* Mensagens de Erro/Sucesso */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Botão de Registro */}
                <Button type="submit" className="w-full h-11" disabled={isLoading || !selectedPlanId}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {registrationType === 'entity' ? 'Criando entidade...' : 'Criando conta...'}
                    </>
                  ) : (
                    <>
                      {registrationType === 'entity' ? 'Criar Entidade' : 'Criar conta'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Link para Login */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Faça login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Planos */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha seu plano</h2>
              <p className="text-gray-600">
                {registrationType === 'entity' 
                  ? 'Selecione um plano para sua entidade' 
                  : 'Selecione um plano para continuar com o registro'
                }
              </p>
            </div>

            {plansLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}

            {plansError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Erro ao carregar planos. Tente novamente.</AlertDescription>
              </Alert>
            )}

            {plans && (
              <div className="grid gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedPlanId === plan.id
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handlePlanSelection(plan.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {plan.is_popular && (
                            <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              <Star className="h-3 w-3" />
                              <span>Popular</span>
                            </div>
                          )}
                          {plan.is_trial && (
                            <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              <Crown className="h-3 w-3" />
                              <span>Grátis</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(plan.price_monthly)}
                          </div>
                          <div className="text-sm text-gray-500">por mês</div>
                        </div>
                      </div>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {formatFeatures(plan.features).map((feature: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                      {plan.is_trial && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            ⭐ {plan.trial_days} dias de teste gratuito
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 TrackDoc. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
} 

// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
