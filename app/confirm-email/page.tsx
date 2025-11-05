"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Mail, ArrowRight } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [errorParam, setErrorParam] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    }
  )

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Verificar se há tokens na URL (vindos do callback) ou se foi confirmado
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const confirmed = searchParams.get('confirmed')
        const code = searchParams.get('code')
        const callbackType = searchParams.get('type')
        const errorFromUrl = searchParams.get('error')
        setErrorParam(errorFromUrl)
        
        // Se há código, tentar processar no cliente
        if (code && callbackType === 'signup') {
          console.log('🔧 [ConfirmEmail] Processando código de confirmação no cliente:', code)
          
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (!error && data.session) {
              console.log('✅ [ConfirmEmail] Sessão criada no cliente para:', data.user?.email)
              setUserEmail(data.user?.email || '')
              
              // Tentar ativar usuário
              const response = await fetch('/api/activate-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: data.user?.id })
              })
              
              const result = await response.json()
              
              if (response.ok && result.success) {
                setStatus('success')
                setMessage('Email confirmado e conta ativada com sucesso!')
                return
              } else {
                console.error('❌ [ConfirmEmail] Erro na ativação:', result)
              }
            } else {
              console.error('❌ [ConfirmEmail] Erro ao processar código no cliente:', error)
            }
          } catch (codeError) {
            console.error('❌ [ConfirmEmail] Erro ao processar código:', codeError)
          }
        }
        
        // Se houver erro na URL, mostrar opções de correção manual
        if (errorFromUrl) {
          console.log('❌ [ConfirmEmail] Erro detectado:', errorFromUrl)
          
          if (errorFromUrl === 'trigger_error' || errorFromUrl === 'supabase_error') {
            setStatus('error')
            setMessage('Erro no sistema de confirmação de email. Use o botão abaixo para corrigir manualmente ou entre em contato com o suporte.')
            
            // Permitir correção manual via interface
            return
          }
          
          setStatus('error')
          setMessage('Erro ao confirmar email. Tente novamente ou entre em contato com o suporte.')
          return
        }

        // Verificar sessão do usuário (pode vir do callback ou já estar logado)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ [ConfirmEmail] Erro ao verificar sessão:', sessionError)
          setStatus('error')
          setMessage('Erro ao verificar confirmação de email. Tente fazer login novamente.')
          return
        }

        // Se há sessão, processar confirmação
        if (session?.user) {
          setUserEmail(session.user.email || '')
          
          console.log('🔧 [ConfirmEmail] Usuário encontrado:', {
            id: session.user.id,
            email: session.user.email,
            email_confirmed_at: session.user.email_confirmed_at,
            confirmed_at: session.user.confirmed_at
          })
          
          // Verificar se o email foi confirmado (qualquer um dos campos)
          const isEmailConfirmed = !!(session.user.email_confirmed_at || session.user.confirmed_at)
          
          if (isEmailConfirmed) {
            console.log('✅ [ConfirmEmail] Email confirmado, ativando usuário automaticamente...')
            
            // 🚀 SEMPRE tentar ativar o usuário, independente do status atual
            console.log('🔧 [ConfirmEmail] Ativando usuário via API:', session.user.id)
            
            try {
              const response = await fetch('/api/activate-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: session.user.id
                })
              })
              
              const result = await response.json()
              
              if (!response.ok) {
                console.error('❌ [ConfirmEmail] Erro na API de ativação:', result)
                setStatus('error')
                setMessage(`Email confirmado, mas houve erro ao ativar a conta: ${result.error}. Entre em contato com o administrador.`)
                return
              }
              
              console.log('✅ [ConfirmEmail] Resultado da ativação:', result)
              
              // Verificar se foi ativado com sucesso ou se já estava ativo
              if (result.success) {
                setStatus('success')
                setMessage(result.message || 'Email confirmado e conta ativada com sucesso! Você já pode fazer login no sistema.')
              } else {
                setStatus('error')
                setMessage(`Erro na ativação: ${result.error}`)
              }
              
            } catch (activationError) {
              console.error('❌ [ConfirmEmail] Erro na ativação via API:', activationError)
              setStatus('error')
              setMessage('Email confirmado, mas houve erro ao ativar a conta. Entre em contato com o administrador.')
              return
            }
          } else {
            // Email ainda não confirmado
            console.log('❌ [ConfirmEmail] Email não confirmado ainda')
            setStatus('error')
            setMessage('Email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.')
          }
        } else {
          // Não há sessão - tentar correção manual com email
          console.log('❌ [ConfirmEmail] Sessão não encontrada')
          
          // Se há código, significa que veio do callback mas não conseguiu processar
          if (code) {
            console.log('🔧 [ConfirmEmail] Código presente mas sessão não criada, usando correção manual')
            
            // Mostrar interface para correção manual
            setStatus('error')
            setMessage('Problema na confirmação automática. Digite seu email abaixo para corrigir manualmente.')
            return
          }
          
          // Tentar obter o user_id da URL se disponível
          const userId = searchParams.get('user_id')
          if (userId && confirmed) {
            console.log('🔧 [ConfirmEmail] Tentando ativar usuário via user_id da URL:', userId)
            
            try {
              const response = await fetch('/api/activate-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: userId
                })
              })
              
              const result = await response.json()
              
              if (response.ok && result.success) {
                setStatus('success')
                setMessage('Email confirmado e conta ativada com sucesso! Você já pode fazer login no sistema.')
                return
              }
            } catch (error) {
              console.error('❌ [ConfirmEmail] Erro ao ativar via user_id:', error)
            }
          }
          
          setStatus('error')
          setMessage('Sessão não encontrada. Por favor, clique no link de confirmação enviado por email ou tente fazer login.')
        }
      } catch (error) {
        console.error('❌ [ConfirmEmail] Erro ao processar confirmação:', error)
        setStatus('error')
        setMessage('Erro interno. Tente novamente mais tarde.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, supabase])

  const handleGoToLogin = () => {
    router.push('/login')
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      if (error) {
        setMessage('Erro ao reenviar email: ' + error.message)
      } else {
        setMessage('Email de confirmação reenviado! Verifique sua caixa de entrada.')
      }
    } catch (error) {
      setMessage('Erro ao reenviar email. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {(status === 'error' || status === 'already_confirmed') && (
              <AlertCircle className="h-12 w-12 text-orange-600" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Verificando confirmação...'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Confirmação Pendente'}
            {status === 'already_confirmed' && 'Email Já Confirmado'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={
            status === 'success' ? 'border-green-200 bg-green-50' :
            status === 'error' ? 'border-orange-200 bg-orange-50' :
            'border-blue-200 bg-blue-50'
          }>
            <Mail className="h-4 w-4" />
            <AlertDescription className={
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-orange-700' :
              'text-blue-700'
            }>
              {message}
            </AlertDescription>
          </Alert>

          {userEmail && (
            <div className="text-sm text-gray-600 text-center">
              <strong>Email:</strong> {userEmail}
            </div>
          )}

          <div className="space-y-2">
            {status === 'success' && (
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
              >
                Ir para Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {status === 'error' && userEmail && (
              <>
                <Button 
                  onClick={handleResendEmail} 
                  variant="outline"
                  className="w-full"
                >
                  Reenviar Email de Confirmação
                  <Mail className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  onClick={handleGoToLogin} 
                  variant="ghost"
                  className="w-full"
                >
                  Voltar ao Login
                </Button>
              </>
            )}

            {(status === 'error' && (errorParam === 'trigger_error' || searchParams.get('code'))) && (
              <>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Digite seu email para correção"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <Button 
                    onClick={async () => {
                      if (!userEmail) {
                        setMessage('Digite seu email primeiro')
                        return
                      }
                      
                      try {
                        const response = await fetch('/api/fix-confirmation', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'manual_activate',
                            email: userEmail
                          })
                        })
                        
                        const result = await response.json()
                        
                        if (response.ok && result.success) {
                          setStatus('success')
                          setMessage('Email confirmado e conta ativada com sucesso!')
                        } else {
                          setMessage(`Erro na correção: ${result.error}`)
                        }
                      } catch (err) {
                        setMessage('Erro ao tentar correção')
                      }
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    🔧 Corrigir Confirmação Manualmente
                  </Button>
                </div>
                <Button 
                  onClick={handleGoToLogin} 
                  variant="outline"
                  className="w-full"
                >
                  Ir para Login
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {(status === 'already_confirmed' || (status === 'error' && !userEmail && errorParam !== 'trigger_error')) && (
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
              >
                Ir para Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Conta ativada com sucesso!</strong>
              </p>
              <ul className="text-sm text-green-700 mt-1 space-y-1">
                <li>• Seu email foi confirmado automaticamente</li>
                <li>• Sua conta foi ativada e está pronta para uso</li>
                <li>• Você já pode fazer login no sistema</li>
                <li>• Acesse todas as funcionalidades disponíveis</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}