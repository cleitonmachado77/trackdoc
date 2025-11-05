"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TestTube, CheckCircle, AlertCircle } from 'lucide-react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('teste@exemplo.com')
  const [password, setPassword] = useState('123456')
  const [fullName, setFullName] = useState('Usuário Teste')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const testAction = async (action: string) => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/test-email-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          email,
          password,
          full_name: fullName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro na requisição')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const fixConfirmation = async (action: string) => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/fix-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro na correção')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Teste de Fluxo de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email">Email de Teste</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teste@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Usuário Teste"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => testAction('create_test_user')}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                1. Criar Usuário Teste
              </Button>
              
              <Button
                onClick={() => testAction('confirm_test_user')}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                2. Confirmar Email
              </Button>
              
              <Button
                onClick={() => testAction('check_user_status')}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                3. Verificar Status
              </Button>
              
              <Button
                onClick={() => fixConfirmation('force_confirm')}
                disabled={loading}
                variant="destructive"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                🔧 Forçar Confirmação
              </Button>
              
              <Button
                onClick={() => fixConfirmation('manual_activate')}
                disabled={loading}
                variant="destructive"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                🔧 Ativação Manual
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <pre className="text-sm text-green-700 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruções de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Criar Usuário Teste:</strong> Cria um usuário sem confirmar o email automaticamente</li>
              <li><strong>Confirmar Email:</strong> Simula a confirmação de email e tenta ativar o usuário</li>
              <li><strong>Verificar Status:</strong> Mostra o status atual do usuário no auth.users e profiles</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Execute os passos em ordem para simular o fluxo completo de registro e confirmação.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}