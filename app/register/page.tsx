'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const session = searchParams.get('session_id')
    if (session) {
      setSessionId(session)
      verifySession(session)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (data.error) {
        toast({
          title: 'Erro',
          description: 'Sessão de pagamento inválida ou expirada',
          variant: 'destructive',
        })
        return
      }

      setSessionData(data)
      
      // Preencher email e nome automaticamente
      if (data.customer_email) {
        setFormData(prev => ({ 
          ...prev, 
          email: data.customer_email,
          fullName: data.customer_name || '',
        }))
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao verificar pagamento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.fullName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome completo é obrigatório',
        variant: 'destructive',
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      })
      return
    }

    try {
      setRegistering(true)

      const response = await fetch('/api/auth/register-with-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          sessionId: sessionId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast({
          title: 'Erro no registro',
          description: data.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: `Bem-vindo ao TrackDoc! Você tem 14 dias de teste grátis.`,
      })

      // Redirecionar para login
      setTimeout(() => {
        router.push('/login?registered=true')
      }, 2000)
    } catch (error) {
      console.error('Erro ao registrar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar conta. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-gray-600">Verificando pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Criar Conta</h1>
          <p className="text-gray-600">
            Complete seu cadastro para começar a usar o TrackDoc
          </p>
        </div>

        {sessionData && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <p className="font-semibold">✓ Pagamento confirmado!</p>
              <p className="text-sm mt-1">
                Plano: <strong>{sessionData.plan_name}</strong> - 14 dias grátis
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!sessionId && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <p className="font-semibold">Atenção</p>
              <p className="text-sm mt-1">
                Você está criando uma conta sem plano ativo. Escolha um plano para ter acesso completo.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados da Conta</CardTitle>
            <CardDescription>
              Preencha seus dados para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Seu nome completo"
                  disabled={registering}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  disabled={!!sessionData?.customer_email || registering}
                />
                {sessionData?.customer_email && (
                  <p className="text-xs text-gray-500">
                    Email do pagamento (não pode ser alterado)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    disabled={registering}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={registering}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Digite a senha novamente"
                    disabled={registering}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={registering}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={registering}
                className="w-full"
              >
                {registering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!sessionId && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Ainda não escolheu um plano?
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = 'https://www.trackdoc.com.br/#precos'}
            >
              Ver Planos Disponíveis
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <a href="/login" className="text-primary hover:underline font-semibold">
              Fazer login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
