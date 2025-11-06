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
        
        // Se há erro na URL, mostrar erro
        if (errorFromUrl) {
          setStatus('error')
          setMessage('Erro ao confirmar email. Tente fazer login ou entre em contato com o suporte.')
          return
        }

        // Se há código, processar confirmação
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (!error && data.session) {
            // Ativar usuário
            const response = await fetch('/api/activate-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: data.user?.id })
            })
            
            const result = await response.json()
            
            if (response.ok && result.success) {
              setStatus('success')
              setMessage('Email confirmado e conta ativada com sucesso!')
              
              // Redirecionar para login após 3 segundos
              setTimeout(() => {
                router.push('/login')
              }, 3000)
              return
            }
          }
        }

        // Se veio do callback com confirmação
        if (confirmed) {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            // Ativar usuário
            const response = await fetch('/api/activate-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: session.user.id })
            })
            
            const result = await response.json()
            
            if (response.ok && result.success) {
              setStatus('success')
              setMessage('Email confirmado e conta ativada com sucesso!')
              
              // Redirecionar para login após 3 segundos
              setTimeout(() => {
                router.push('/login')
              }, 3000)
              return
            }
          }
        }

        // Se chegou aqui sem parâmetros específicos, mostrar página de instruções
        setStatus('success')
        setMessage('Verifique seu email e clique no link de confirmação para ativar sua conta. Se você já confirmou, tente fazer login.')
        
      } catch (error) {
        console.error('Erro ao processar confirmação:', error)
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
            {status === 'success' && 'Email Confirmado!'}
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