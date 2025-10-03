import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Wrench } from 'lucide-react'

const supabase = createClientSupabaseClient()

interface ComplianceViolation {
  processId: string
  processName: string
  templateName: string
  currentStepName?: string
  stepType?: string
  isCompliant: boolean
  violations: string[]
  lastValidation: string
}

interface ComplianceFixerProps {
  violations: ComplianceViolation[]
  onFixed?: () => void
}

export default function ComplianceFixer({ violations, onFixed }: ComplianceFixerProps) {
  const { toast } = useToast()
  const [isFixing, setIsFixing] = useState(false)
  const [fixingProcess, setFixingProcess] = useState<string | null>(null)
  const [fixResults, setFixResults] = useState<Record<string, any>>({})

  // Corrigir violações de um processo específico
  const fixProcessViolations = async (processId: string) => {
    try {
      setFixingProcess(processId)
      setIsFixing(true)

      const { data, error } = await supabase.rpc('fix_all_compliance_violations', {
        p_process_id: processId
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum resultado retornado')
      }

      const result = data[0]
      setFixResults(prev => ({
        ...prev,
        [processId]: result
      }))

      if (result.success) {
        toast({
          title: "Violações corrigidas",
          description: `Processo corrigido com sucesso. ${result.total_actions_taken.length} ações executadas.`,
        })
      } else {
        toast({
          title: "Erro ao corrigir",
          description: result.error_message || "Erro desconhecido ao corrigir violações",
          variant: "destructive",
        })
      }

      // Chamar callback para atualizar dados
      if (onFixed) {
        onFixed()
      }
    } catch (error) {
      console.error('Erro ao corrigir violações:', error)
      toast({
        title: "Erro",
        description: "Erro ao corrigir violações do processo",
        variant: "destructive",
      })
    } finally {
      setFixingProcess(null)
      setIsFixing(false)
    }
  }

  // Corrigir todas as violações
  const fixAllViolations = async () => {
    try {
      setIsFixing(true)

      const { data, error } = await supabase.rpc('fix_all_non_compliant_processes')

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        toast({
          title: "Nenhuma correção necessária",
          description: "Todos os processos já estão em compliance",
        })
        return
      }

      let successCount = 0
      let errorCount = 0

      data.forEach((result: any) => {
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      })

      toast({
        title: "Correções concluídas",
        description: `${successCount} processos corrigidos com sucesso. ${errorCount} erros encontrados.`,
      })

      // Chamar callback para atualizar dados
      if (onFixed) {
        onFixed()
      }
    } catch (error) {
      console.error('Erro ao corrigir todas as violações:', error)
      toast({
        title: "Erro",
        description: "Erro ao corrigir violações",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  // Filtrar apenas processos com violações
  const nonCompliantProcesses = violations.filter(v => !v.isCompliant)

  if (nonCompliantProcesses.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-green-600">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Todos os processos estão em compliance!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhuma correção necessária no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Corretor de Violações de Compliance
            </CardTitle>
            <CardDescription>
              {nonCompliantProcesses.length} processo(s) com violações encontradas
            </CardDescription>
          </div>
          <Button
            onClick={fixAllViolations}
            disabled={isFixing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Corrigindo...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Corrigir Todas
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {nonCompliantProcesses.map((violation) => (
          <div
            key={violation.processId}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Cabeçalho do Processo */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{violation.processName}</h4>
                <p className="text-sm text-muted-foreground">
                  Template: {violation.templateName}
                  {violation.currentStepName && (
                    <> • Etapa: {violation.currentStepName}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {violation.violations.length} violação(ões)
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fixProcessViolations(violation.processId)}
                  disabled={isFixing && fixingProcess === violation.processId}
                >
                  {fixingProcess === violation.processId ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Corrigindo...
                    </>
                  ) : (
                    <>
                      <Wrench className="h-3 w-3 mr-1" />
                      Corrigir
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Violações */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Violações encontradas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {violation.violations.map((violationText, index) => (
                      <li key={index} className="text-sm">{violationText}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Resultado da Correção */}
            {fixResults[violation.processId] && (
              <div className="mt-3">
                {fixResults[violation.processId].success ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-1">
                        <p className="font-medium">Correção bem-sucedida!</p>
                        <p className="text-sm">Ações executadas:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {fixResults[violation.processId].total_actions_taken.map((action: string, index: number) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Erro na correção:</p>
                        <p className="text-sm">{fixResults[violation.processId].error_message}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="text-xs text-muted-foreground">
              Última validação: {new Date(violation.lastValidation).toLocaleString()}
            </div>
          </div>
        ))}

        {/* Resumo */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Resumo das Violações:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total de processos:</span> {violations.length}
            </div>
            <div>
              <span className="font-medium">Em compliance:</span> {violations.filter(v => v.isCompliant).length}
            </div>
            <div>
              <span className="font-medium">Com violações:</span> {nonCompliantProcesses.length}
            </div>
            <div>
              <span className="font-medium">Taxa de compliance:</span> {((violations.filter(v => v.isCompliant).length / violations.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
