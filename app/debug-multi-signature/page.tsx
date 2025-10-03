'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface DebugResult {
  success: boolean
  analysis?: {
    step: {
      id: string
      name: string
      type: string
      department_id: string
      action_type: string
      department_name: string
    }
    department: {
      id: string
      name: string
      usersCount: number
      hasMultipleUsers: boolean
      users: Array<{
        id: string
        name: string
        email: string
      }>
    }
    detection: {
      isSignAction: boolean
      hasMultipleUsers: boolean
      shouldUseMultiSignature: boolean
    }
    action_data: any
  }
  reason?: string
  error?: string
}

export default function DebugMultiSignaturePage() {
  const [stepId, setStepId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DebugResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testStepId = async () => {
    if (!stepId.trim()) {
      setError('Por favor, insira um stepId')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/debug-multi-signature?stepId=${encodeURIComponent(stepId)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug - Detecção de Assinatura Múltipla</h1>
          <p className="text-muted-foreground mt-2">
            Teste a detecção de assinatura múltipla para um step específico
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Testar Step</CardTitle>
            <CardDescription>
              Insira o ID do step para testar a detecção de assinatura múltipla
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stepId">Step ID</Label>
              <Input
                id="stepId"
                value={stepId}
                onChange={(e) => setStepId(e.target.value)}
                placeholder="Ex: ec8cb919-4f94-4869-9793-98b1394dcc8b"
              />
            </div>
            <Button onClick={testStepId} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Detecção
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>
                Resultado do Teste
                {result.success ? (
                  <span className="ml-2 text-green-600">✓ Sucesso</span>
                ) : (
                  <span className="ml-2 text-red-600">✗ Falhou</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success && result.analysis ? (
                <div className="space-y-6">
                  {/* Informações do Step */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informações do Step</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>ID:</strong> {result.analysis.step.id}
                      </div>
                      <div>
                        <strong>Nome:</strong> {result.analysis.step.name}
                      </div>
                      <div>
                        <strong>Tipo:</strong> {result.analysis.step.type}
                      </div>
                      <div>
                        <strong>Action Type:</strong> {result.analysis.step.action_type}
                      </div>
                      <div>
                        <strong>Department ID:</strong> {result.analysis.step.department_id}
                      </div>
                      <div>
                        <strong>Department Name:</strong> {result.analysis.step.department_name}
                      </div>
                    </div>
                  </div>

                  {/* Informações do Departamento */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informações do Departamento</h3>
                    <div className="space-y-2">
                      <div>
                        <strong>Usuários:</strong> {result.analysis.department.usersCount}
                      </div>
                      <div>
                        <strong>Tem múltiplos usuários:</strong> 
                        <span className={result.analysis.department.hasMultipleUsers ? 'text-green-600' : 'text-red-600'}>
                          {result.analysis.department.hasMultipleUsers ? ' Sim' : ' Não'}
                        </span>
                      </div>
                      <div>
                        <strong>Usuários do departamento:</strong>
                        <ul className="list-disc list-inside ml-4 mt-2">
                          {result.analysis.department.users.map((user) => (
                            <li key={user.id}>
                              {user.name} ({user.email}) - ID: {user.id}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Detecção */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Detecção de Assinatura Múltipla</h3>
                    <div className="space-y-2">
                      <div>
                        <strong>É ação de assinatura:</strong>
                        <span className={result.analysis.detection.isSignAction ? 'text-green-600' : 'text-red-600'}>
                          {result.analysis.detection.isSignAction ? ' Sim' : ' Não'}
                        </span>
                      </div>
                      <div>
                        <strong>Tem múltiplos usuários:</strong>
                        <span className={result.analysis.detection.hasMultipleUsers ? 'text-green-600' : 'text-red-600'}>
                          {result.analysis.detection.hasMultipleUsers ? ' Sim' : ' Não'}
                        </span>
                      </div>
                      <div>
                        <strong>Deve usar assinatura múltipla:</strong>
                        <span className={result.analysis.detection.shouldUseMultiSignature ? 'text-green-600' : 'text-red-600'}>
                          {result.analysis.detection.shouldUseMultiSignature ? ' Sim' : ' Não'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Data */}
                  {result.analysis.action_data && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Action Data</h3>
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(result.analysis.action_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-600">{result.reason}</p>
                  {result.error && (
                    <p className="text-red-600 mt-2">{result.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
