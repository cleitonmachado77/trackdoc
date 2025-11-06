"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

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
        const code = searchParams.get('code')
        const confirmed = searchParams.get('confirmed')
        const errorFromUrl = searchParams.get('error')
        
        // Se há erro na URL, verificar se a confirmação foi bem-sucedida mesmo assim
        if (errorFromUrl) {
          const details = searchParams.get('details')
          const tryLogin = searchParams.get('try_login')
          const bulkActivated = searchParams.get('bulk_activated')
          const allowVerify = searchParams.get('allow_verify')
          
          // VERIFICAÇÃO INTELIGENTE: Mesmo com erro no callback, verificar se há sessão ativa
          if (errorFromUrl === 'processing_failed' && (details?.includes('both auth code and code verifier') || allowVerify === 'true')) {
            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession()
              
              if (!sessionError && session?.user) {
                // Verificar se usuário está ativo
                const response = await fetch('/api/activate-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: session.user.id })
                })
                
                const result = await response.json()
                
                if (response.ok && (result.success || result.message?.includes('já está ativo'))) {
                  setStatus('success')
                  setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
                  
                  setTimeout(() => {
                    router.push('/login')
                  }, 2000)
                  return
                }
              } else {
                // MÉTODO ALTERNATIVO: Verificar confirmações recentes diretamente no banco
                try {
                  const response = await fetch('/api/check-recent-confirmation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ check: 'recent' })
                  })
                  
                  const result = await response.json()
                  
                  if (response.ok) {
                    if (result.confirmed && result.activated > 0) {
                      setStatus('success')
                      setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
                      
                      setTimeout(() => {
                        router.push('/login')
                      }, 2000)
                      return
                    } else if (result.activated === 0) {
                      // Nenhum usuário inativo encontrado = trigger funcionou corretamente!
                      setStatus('success')
                      setMessage('Sua conta foi confirmada e ativada automaticamente! Você já pode fazer login.')
                      
                      setTimeout(() => {
                        router.push('/login')
                      }, 2000)
                      return
                    }
                  }
                } catch (verifyError) {
                  // Continuar para mostrar erro
                }
              }
            } catch (verifyError) {
              // Continuar para mostrar erro
            }
          }
          
          let errorMessage = 'Erro ao confirmar email.'
          
          if (bulkActivated === 'true') {
            setStatus('success')
            setMessage('Sua conta foi processada e pode estar ativa. Tente fazer login.')
            return
          }
          
          switch (errorFromUrl) {
            case 'invalid_code':
              errorMessage = 'Código de confirmação inválido ou expirado. O link pode ter sido usado ou expirado.'
              break
            case 'processing_failed':
              errorMessage = tryLogin === 'true' 
                ? 'Falha no processamento da confirmação. Sua conta pode já estar ativa - tente fazer login primeiro.'
                : 'Falha no processamento da confirmação. Tente fazer login - sua conta pode já estar ativa.'
              break
            case 'session_error':
              errorMessage = 'Erro na sessão de confirmação. Tente fazer login ou registre-se novamente.'
              break
            case 'callback_error':
              errorMessage = 'Erro no callback de confirmação. Entre em contato com o suporte.'
              break
            default:
              errorMessage = 'Erro desconhecido na confirmação. Tente fazer login.'
          }
          
          setStatus('error')
          setMessage(errorMessage)
          return
        }

        // Se há código, significa que o callback falhou
        if (code) {
          const callbackFailed = searchParams.get('callback_failed')
          
          if (callbackFailed === 'true') {
            setStatus('error')
            setMessage('Erro no processamento da confirmação no servidor. Sua conta pode já estar ativa - tente fazer login.')
            return
          } else {
            setStatus('error')
            setMessage('Erro no processamento da confirmação. Tente fazer login ou registre-se novamente.')
            return
          }
        }

        // Se veio do callback com confirmação
        if (confirmed === 'true') {
          const activated = searchParams.get('activated')
          
          if (activated === 'true') {
            // Já foi ativado no servidor
            setStatus('success')
            setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
            
            setTimeout(() => {
              router.push('/login')
            }, 2000)
            return
          } else {
            // Tentar ativar no cliente
            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession()
              
              if (sessionError) {
                setStatus('error')
                setMessage('Erro ao verificar sessão. Tente fazer login.')
                return
              }
              
              if (session?.user) {
                const response = await fetch('/api/activate-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: session.user.id })
                })
                
                const result = await response.json()
                
                if (response.ok && result.success) {
                  setStatus('success')
                  setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
                  
                  setTimeout(() => {
                    router.push('/login')
                  }, 2000)
                  return
                } else {
                  setStatus('error')
                  setMessage(`Erro na ativação: ${result.error || 'Erro desconhecido'}`)
                  return
                }
              } else {
                setStatus('error')
                setMessage('Sessão não encontrada. Tente fazer login.')
                return
              }
            } catch (activationError) {
              setStatus('error')
              setMessage('Erro interno na ativação. Tente fazer login.')
              return
            }
          }
        }

        // Se chegou aqui sem parâmetros específicos, mostrar erro
        setStatus('error')
        setMessage('Link de confirmação inválido ou expirado. Tente fazer login ou registre-se novamente.')
        
      } catch (error) {
        setStatus('error')
        setMessage('Erro interno. Tente novamente mais tarde.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, supabase, router])

  const handleGoToLogin = () => {
    router.push('/login')
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
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Verificando confirmação...'}
            {status === 'success' && 'Conta Confirmada!'}
            {status === 'error' && 'Erro na Confirmação'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={
            status === 'success' ? 'border-green-200 bg-green-50' :
            status === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }>
            <AlertDescription className={
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-blue-700'
            }>
              {message}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              onClick={handleGoToLogin} 
              className="w-full"
            >
              {status === 'success' ? 'Ir para Login' : 'Voltar ao Login'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-800 text-center">
                <strong>Conta ativada com sucesso!</strong><br/>
                Você será redirecionado automaticamente em alguns segundos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}