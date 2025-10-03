'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Wrench, CheckCircle, AlertCircle } from 'lucide-react'

export default function FixWorkflowSteps() {
  const { toast } = useToast()
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFix = async () => {
    setIsFixing(true)
    try {
      const response = await fetch('/api/fix-workflow-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "Análise Concluída",
          description: `${data.workflowsWithMultiSignature} workflows com assinatura múltipla identificados`,
        })
      } else {
        throw new Error(data.error || 'Erro na correção')
      }
    } catch (error) {
      console.error('Erro na correção:', error)
      toast({
        title: "Erro na Correção",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Correção de Workflow Steps
        </CardTitle>
        <CardDescription>
          Analisa workflows para identificar departamentos que precisam de assinatura múltipla baseado na presença de nós de ação de assinatura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-amber-800">Nova Lógica Implementada</h4>
              <p className="text-sm text-amber-700">
                A assinatura múltipla agora funciona baseada na presença de <strong>nós de ação de assinatura</strong> 
                seguidos de <strong>nós de departamento com múltiplos usuários</strong>. Não há mais necessidade de 
                definir action_type em nós de departamento.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleFix}
          disabled={isFixing}
          className="w-full"
        >
          {isFixing ? (
            <>
              <Wrench className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              Analisar Workflows
            </>
          )}
        </Button>

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-green-800">Análise Concluída</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    {result.workflowsWithMultiSignature} workflows com assinatura múltipla
                  </Badge>
                  <Badge variant="outline">
                    {result.totalWorkflows} workflows totais
                  </Badge>
                </div>
                {result.analysis && result.analysis.length > 0 && (
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Workflows com assinatura múltipla:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {result.analysis.map((workflow: any, index: number) => (
                        <li key={index}>
                          Workflow {workflow.workflowId.slice(0, 8)}... - {workflow.departmentsAfterSign} departamentos após assinatura
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
