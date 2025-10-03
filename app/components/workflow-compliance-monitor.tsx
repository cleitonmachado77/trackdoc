import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useWorkflowCompliance } from '@/hooks/use-workflow-compliance'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react'
import ComplianceFixer from './compliance-fixer'

interface ComplianceMonitorProps {
  processId?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function WorkflowComplianceMonitor({
  processId,
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 segundos
}: ComplianceMonitorProps) {
  const {
    validateProcessCompliance,
    enforceWorkflowRules,
    monitorCompliance,
    generateComplianceReport,
    isValidating,
    isEnforcing
  } = useWorkflowCompliance()

  const [complianceData, setComplianceData] = useState<any>(null)
  const [monitoringData, setMonitoringData] = useState<any>(null)
  const [reportData, setReportData] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Função para atualizar dados
  const updateData = async () => {
    try {
      if (processId) {
        // Monitorar processo específico
        const compliance = await validateProcessCompliance(processId)
        setComplianceData(compliance)
      } else {
        // Monitorar todos os processos
        const monitoring = await monitorCompliance()
        setMonitoringData(monitoring)
        
        if (showDetails) {
          const report = await generateComplianceReport()
          setReportData(report)
        }
      }
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao atualizar dados de compliance:', error)
    }
  }

  // Atualizar dados automaticamente
  useEffect(() => {
    updateData()

    if (autoRefresh) {
      const interval = setInterval(updateData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [processId, autoRefresh, refreshInterval])

  // Forçar compliance
  const handleEnforceCompliance = async () => {
    if (!processId) return

    try {
      const result = await enforceWorkflowRules(processId)
      if (result?.success) {
        await updateData()
      }
    } catch (error) {
      console.error('Erro ao forçar compliance:', error)
    }
  }

  // Renderizar monitor para processo específico
  if (processId && complianceData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monitor de Compliance
              </CardTitle>
              <CardDescription>
                Status de compliance do processo
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={updateData}
                disabled={isValidating}
              >
                <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
              </Button>
              {!complianceData.isCompliant && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEnforceCompliance}
                  disabled={isEnforcing}
                >
                  {isEnforcing ? 'Corrigindo...' : 'Corrigir'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status de Compliance */}
          <div className="flex items-center gap-3">
            {complianceData.isCompliant ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Em Compliance
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Fora de Compliance
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Atualizado em {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          {/* Violações */}
          {!complianceData.isCompliant && complianceData.violations.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Violações encontradas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {complianceData.violations.map((violation: string, index: number) => (
                      <li key={index} className="text-sm">{violation}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informações da Etapa Atual */}
          {showDetails && complianceData.currentStepInfo && (
            <div className="space-y-2">
              <h4 className="font-medium">Etapa Atual:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {complianceData.currentStepInfo.stepName}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span> {complianceData.currentStepInfo.stepType}
                </div>
                <div>
                  <span className="font-medium">Ordem:</span> {complianceData.currentStepInfo.stepOrder}
                </div>
                {complianceData.currentStepInfo.departmentName && (
                  <div>
                    <span className="font-medium">Departamento:</span> {complianceData.currentStepInfo.departmentName}
                  </div>
                )}
                {complianceData.currentStepInfo.userName && (
                  <div>
                    <span className="font-medium">Usuário:</span> {complianceData.currentStepInfo.userName}
                  </div>
                )}
                {complianceData.currentStepInfo.actionType && (
                  <div>
                    <span className="font-medium">Ação:</span> {complianceData.currentStepInfo.actionType}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Renderizar monitor geral
  if (!processId && monitoringData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monitor Geral de Compliance
              </CardTitle>
              <CardDescription>
                Status de compliance de todos os processos ativos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={updateData}
              disabled={isValidating}
            >
              <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{monitoringData.totalProcesses}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{monitoringData.compliantProcesses}</div>
              <div className="text-sm text-muted-foreground">Em Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{monitoringData.nonCompliantProcesses}</div>
              <div className="text-sm text-muted-foreground">Fora de Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{monitoringData.complianceRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Taxa de Compliance</div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taxa de Compliance</span>
              <span>{monitoringData.complianceRate.toFixed(1)}%</span>
            </div>
            <Progress value={monitoringData.complianceRate} className="h-2" />
          </div>

          {/* Corretor de Violações */}
          <ComplianceFixer 
            violations={reportData}
            onFixed={updateData}
          />

          {/* Relatório Detalhado */}
          {showDetails && reportData.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Processos Ativos:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {reportData.map((process) => (
                  <div
                    key={process.processId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{process.processName}</div>
                      <div className="text-sm text-muted-foreground">
                        {process.templateName} - {process.currentStepName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {process.isCompliant ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {process.violations.length} violação(ões)
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground text-center">
            Atualizado em {lastUpdate.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">
          Carregando dados de compliance...
        </div>
      </CardContent>
    </Card>
  )
}
