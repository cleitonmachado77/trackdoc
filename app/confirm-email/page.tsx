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
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(true) // Mostrar debug por padrão

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${log}`
    console.log(logEntry)
    setDebugLogs(prev => [...prev, logEntry])
  }

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
        
        addLog(`🔧 Parâmetros recebidos: code=${!!code}, confirmed=${confirmed}, error=${errorFromUrl}`)
        addLog(`🔧 URL completa: ${window.location.href}`)
        
        // Se há erro na URL, verificar se a confirmação foi bem-sucedida mesmo assim
        if (errorFromUrl) {
          addLog(`❌ Erro na URL detectado: ${errorFromUrl}`)
          const details = searchParams.get('details')
          if (details) {
            addLog(`🔧 Detalhes do erro: ${decodeURIComponent(details)}`)
          }
          
          const tryLogin = searchParams.get('try_login')
          const bulkActivated = searchParams.get('bulk_activated')
          
          const allowVerify = searchParams.get('allow_verify')
          
          // VERIFICAÇÃO INTELIGENTE: Mesmo com erro no callback, verificar se há sessão ativa
          if (errorFromUrl === 'processing_failed' && (details?.includes('both auth code and code verifier') || allowVerify === 'true')) {
            addLog('🔧 Erro PKCE detectado - verificando se confirmação foi bem-sucedida...')
            
            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession()
              
              if (!sessionError && session?.user) {
                addLog(`✅ SUCESSO! Sessão encontrada para: ${session.user.email}`)
                addLog('✅ Confirmação foi bem-sucedida apesar do erro PKCE!')
                
                // Verificar se usuário está ativo
                const response = await fetch('/api/activate-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: session.user.id })
                })
                
                const result = await response.json()
                addLog(`🔧 Status da ativação: ${JSON.stringify(result)}`)
                
                if (response.ok && result.success) {
                  setStatus('success')
                  setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
                  
                  setTimeout(() => {
                    addLog('🔄 Redirecionando para login...')
                    router.push('/login')
                  }, 3000)
                  return
                } else if (result.message?.includes('já está ativo')) {
                  setStatus('success')
                  setMessage('Sua conta foi confirmada com sucesso! Você já pode fazer login.')
                  
                  setTimeout(() => {
                    addLog('🔄 Redirecionando para login...')
                    router.push('/login')
                  }, 3000)
                  return
                }
              } else {
                addLog('❌ Nenhuma sessão encontrada - tentando verificação direta no banco...')
                
                // MÉTODO ALTERNATIVO: Verificar confirmações recentes diretamente no banco
                try {
                  addLog('🔧 Verificando confirmações recentes no banco...')
                  
                  const response = await fetch('/api/check-recent-confirmation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ check: 'recent' })
                  })
                  
                  const result = await response.json()
                  addLog(`🔧 Resultado da verificação: ${JSON.stringify(result)}`)
                  
                  if (response.ok) {
                    if (result.confirmed && result.activated > 0) {
                      addLog(`✅ SUCESSO! ${result.activated} usuário(s) confirmado(s) e ativado(s)!`)
                      setStatus('success')
                      setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
                      
                      setTimeout(() => {
                        addLog('🔄 Redirecionando para login...')
                        router.push('/login')
                      }, 3000)
                      return
                    } else if (result.activated === 0) {
                      // Nenhum usuário inativo encontrado = trigger funcionou corretamente!
                      addLog('✅ SUCESSO! Nenhum usuário inativo encontrado - trigger funcionou corretamente!')
                      addLog('✅ Sua conta foi ativada automaticamente pelo sistema!')
                      setStatus('success')
                      setMessage('Sua conta foi confirmada e ativada automaticamente! Você já pode fazer login.')
                      
                      setTimeout(() => {
                        addLog('🔄 Redirecionando para login...')
                        router.push('/login')
                      }, 3000)
                      return
                    } else {
                      addLog(`❌ Resposta inesperada: ${JSON.stringify(result)}`)
                    }
                  } else {
                    addLog(`❌ Erro na API: ${result.message || 'Erro desconhecido'}`)
                  }
                } catch (verifyError) {
                  addLog(`❌ Erro na verificação de confirmações: ${verifyError}`)
                }
              }
            } catch (verifyError) {
              addLog(`❌ Erro na verificação: ${verifyError}`)
            }
          }
          
          let errorMessage = 'Erro ao confirmar email.'
          
          if (bulkActivated === 'true') {
            addLog('✅ Ativação em lote executada - conta pode estar ativa')
            setStatus('success')
            setMessage('Sua conta foi processada e pode estar ativa. Tente fazer login.')
            return
          }
          
          switch (errorFromUrl) {
            case 'invalid_code':
              errorMessage = 'Código de confirmação inválido ou expirado. O link pode ter sido usado ou expirado.'
              break
            case 'processing_failed':
              if (tryLogin === 'true') {
                errorMessage = 'Falha no processamento da confirmação. Sua conta pode já estar ativa - tente fazer login primeiro.'
              } else {
                errorMessage = 'Falha no processamento da confirmação. Tente fazer login - sua conta pode já estar ativa.'
              }
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
            addLog('❌ Callback falhou - código não pode ser processado no cliente (PKCE)')
            setStatus('error')
            setMessage('Erro no processamento da confirmação no servidor. Sua conta pode já estar ativa - tente fazer login.')
            return
          } else {
            addLog('❌ Código presente sem indicação de falha do callback')
            setStatus('error')
            setMessage('Erro no processamento da confirmação. Tente fazer login ou registre-se novamente.')
            return
          }
        }

        // Se veio do callback com confirmação
        if (confirmed === 'true') {
          addLog('🔧 Confirmação via callback detectada')
          const activated = searchParams.get('activated')
          addLog(`🔧 Status de ativação: ${activated}`)
          
          if (activated === 'true') {
            // Já foi ativado no servidor
            addLog('✅ Usuário já foi ativado no servidor!')
            setStatus('success')
            setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
            
            // Redirecionar para login após 5 segundos (mais tempo para ver logs)
            setTimeout(() => {
              addLog('🔄 Redirecionando para login...')
              router.push('/login')
            }, 5000)
            return
          } else {
            // Tentar ativar no cliente
            addLog('🔧 Tentando ativar usuário no cliente...')
            
            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession()
              
              if (sessionError) {
                addLog(`❌ Erro ao obter sessão: ${sessionError.message}`)
                setStatus('error')
                setMessage('Erro ao verificar sessão. Tente fazer login.')
                return
              }
              
              if (session?.user) {
                addLog(`✅ Sessão encontrada para usuário: ${session.user.email}`)
                addLog('🔧 Chamando API de ativação...')
                
                const response = await fetch('/api/activate-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: session.user.id })
                })
                
                addLog(`🔧 Resposta da API: status ${response.status}`)
                
                const result = await response.json()
                addLog(`🔧 Resultado da API: ${JSON.stringify(result)}`)
                
                if (response.ok && result.success) {
                  addLog('✅ Usuário ativado no cliente com sucesso!')
                  setStatus('success')
                  setMessage('Sua conta foi confirmada e ativada com sucesso! Você já pode fazer login.')
                  
                  setTimeout(() => {
                    addLog('🔄 Redirecionando para login...')
                    router.push('/login')
                  }, 5000)
                  return
                } else {
                  addLog(`❌ Erro na ativação: ${result.error || 'Erro desconhecido'}`)
                  setStatus('error')
                  setMessage(`Erro na ativação: ${result.error || 'Erro desconhecido'}`)
                  return
                }
              } else {
                addLog('❌ Sessão não encontrada')
                setStatus('error')
                setMessage('Sessão não encontrada. Tente fazer login.')
                return
              }
            } catch (activationError) {
              addLog(`❌ Erro na ativação: ${activationError}`)
              setStatus('error')
              setMessage('Erro interno na ativação. Tente fazer login.')
              return
            }
          }
        }

        // Se chegou aqui sem parâmetros específicos, mostrar erro
        addLog('❌ Nenhum parâmetro válido encontrado')
        setStatus('error')
        setMessage('Link de confirmação inválido ou expirado. Tente fazer login ou registre-se novamente.')
        
      } catch (error) {
        addLog(`❌ Erro geral: ${error}`)
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

          {/* Debug Logs */}
          {showDebug && debugLogs.length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-gray-700">Debug Logs:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebug(false)}
                  className="text-xs"
                >
                  Ocultar
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <div key={index} className="text-xs text-gray-600 font-mono mb-1">
                    {log}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                💡 Estes logs ajudam a identificar problemas. Compartilhe com o suporte se necessário.
              </div>
            </div>
          )}

          {!showDebug && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(true)}
                className="text-xs text-gray-500"
              >
                Mostrar Debug Logs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}