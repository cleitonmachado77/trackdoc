"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, user } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Verificar se há mensagem de sucesso na URL
  useEffect(() => {
    const message = searchParams.get('message')
    const confirmed = searchParams.get('confirmed')
    
    if (message === 'password_updated') {
      setSuccess("Senha redefinida com sucesso! Faça login com sua nova senha.")
    } else if (message) {
      setSuccess(decodeURIComponent(message))
    } else if (confirmed === 'true') {
      setSuccess("Email confirmado com sucesso! Você já pode fazer login.")
    }
  }, [searchParams])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const validateForm = () => {
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
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        // Traduzir mensagens de erro do Supabase para português
        if (error.message.includes("Invalid login credentials")) {
          setError("Email ou senha incorretos. Verifique suas credenciais e tente novamente.")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.")
        } else if (error.message.includes("User not found")) {
          setError("Usuário não encontrado. Verifique se o email está correto ou crie uma nova conta.")
        } else if (error.message.includes("Invalid email")) {
          setError("Email inválido. Por favor, insira um endereço de email válido.")
        } else if (error.message.includes("Email link is invalid or has expired")) {
          setError("O link de confirmação expirou. Solicite um novo link de confirmação.")
        } else if (error.message.includes("Too many requests")) {
          setError("Muitas tentativas de login. Por favor, aguarde alguns minutos e tente novamente.")
        } else {
          // Para qualquer outro erro, mostrar mensagem genérica em português
          setError("Não foi possível fazer login. Verifique suas credenciais ou entre em contato com o suporte.")
        }
      } else {
        // Verificar se o usuário existe no banco de dados e seu status
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Verificar se o perfil existe no banco de dados
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('status, full_name')
            .eq('id', user.id)
            .single()
          
          // Se o perfil não existe, significa que foi excluído
          if (profileError || !profile) {
            await supabase.auth.signOut()
            setError("Esta conta foi removida do sistema. Entre em contato com o administrador para mais informações.")
            setIsLoading(false)
            return
          }
          
          // Verificar status do perfil
          if (profile.status === 'pending_confirmation') {
            // Se conseguiu fazer login, o email já foi confirmado no Supabase Auth
            // Tentar ativar o usuário automaticamente
            console.log('🔧 [Login] Usuário com status pending_confirmation mas logado - tentando ativar...')
            
            try {
              const activateResponse = await fetch('/api/activate-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
              })
              
              if (activateResponse.ok) {
                console.log('✅ [Login] Usuário ativado automaticamente!')
                // Continuar com o login normalmente
              } else {
                console.error('❌ [Login] Falha ao ativar usuário')
                await supabase.auth.signOut()
                setError("Erro ao ativar sua conta. Por favor, tente novamente ou entre em contato com o suporte.")
                setIsLoading(false)
                return
              }
            } catch (activateError) {
              console.error('❌ [Login] Erro ao ativar usuário:', activateError)
              await supabase.auth.signOut()
              setError("Erro ao ativar sua conta. Por favor, tente novamente ou entre em contato com o suporte.")
              setIsLoading(false)
              return
            }
          }
          
          if (profile.status === 'inactive') {
            await supabase.auth.signOut()
            setError("Sua conta está inativa. Entre em contato com o administrador do sistema para reativá-la.")
            setIsLoading(false)
            return
          }
          
          if (profile.status === 'suspended') {
            await supabase.auth.signOut()
            setError("Sua conta foi suspensa. Entre em contato com o administrador do sistema para mais informações.")
            setIsLoading(false)
            return
          }
        }
        
        setSuccess("Login realizado com sucesso!")
        
        // Redirecionar diretamente para o dashboard após login bem-sucedido
        console.log('Login bem-sucedido, redirecionando para dashboard...')
        
        // Forçar reload completo da página para limpar qualquer cache
        window.location.href = "/"
      }
    } catch (err) {
      console.error('Erro no login:', err)
      setError("Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 🎨 Logo e Header - Novo Design */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo-vertical-preto.png" 
              alt="TrackDoc Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        {/* 🎨 Card de Login - Novo Design */}
        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-trackdoc-black">Entrar na sua conta</CardTitle>
            <CardDescription className="text-center text-trackdoc-gray">Digite suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Email */}
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

              {/* Campo Senha */}
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

              {/* Opções */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Lembrar de mim
                  </Label>
                </div>
                <Link href="/forgot-password">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 font-normal text-blue-600 hover:text-blue-700"
                    disabled={isLoading}
                  >
                    Esqueci minha senha
                  </Button>
                </Link>
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

              {/* Botão de Login */}
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 TrackDoc. Todos os direitos reservados.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link href="/termos-de-uso" target="_blank">
              <Button variant="link" className="px-0 text-gray-500 hover:text-gray-700">
                Termos de Uso
              </Button>
            </Link>
            <Link href="/politica-de-privacidade" target="_blank">
              <Button variant="link" className="px-0 text-gray-500 hover:text-gray-700">
                Política de Privacidade
              </Button>
            </Link>
            <Button variant="link" className="px-0 text-gray-500 hover:text-gray-700">
              Suporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
