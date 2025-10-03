// Sistema de tratamento de erros centralizado para o sistema de tramitação

export interface WorkflowError {
  code: string
  message: string
  details?: any
  timestamp: Date
  userId?: string
  processId?: string
  executionId?: string
}

export class WorkflowErrorHandler {
  private static instance: WorkflowErrorHandler
  private errorLog: WorkflowError[] = []

  static getInstance(): WorkflowErrorHandler {
    if (!WorkflowErrorHandler.instance) {
      WorkflowErrorHandler.instance = new WorkflowErrorHandler()
    }
    return WorkflowErrorHandler.instance
  }

  // Log de erro
  logError(error: Partial<WorkflowError>): void {
    const fullError: WorkflowError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Erro desconhecido',
      details: error.details,
      timestamp: new Date(),
      userId: error.userId,
      processId: error.processId,
      executionId: error.executionId
    }

    this.errorLog.push(fullError)
    console.error('🚨 [WORKFLOW ERROR]:', fullError)
  }

  // Tratar erros específicos do workflow
  handleWorkflowError(error: any, context?: {
    userId?: string
    processId?: string
    executionId?: string
    action?: string
  }): WorkflowError {
    let workflowError: WorkflowError

    if (error.code === 'PGRST301') {
      // Erro de RLS (Row Level Security)
      workflowError = {
        code: 'RLS_ERROR',
        message: 'Erro de permissão: você não tem acesso a este recurso',
        details: error,
        timestamp: new Date(),
        ...context
      }
    } else if (error.code === '23505') {
      // Violação de chave única
      workflowError = {
        code: 'DUPLICATE_KEY_ERROR',
        message: 'Erro de duplicação: este item já existe',
        details: error,
        timestamp: new Date(),
        ...context
      }
    } else if (error.code === '23503') {
      // Violação de chave estrangeira
      workflowError = {
        code: 'FOREIGN_KEY_ERROR',
        message: 'Erro de referência: item referenciado não existe',
        details: error,
        timestamp: new Date(),
        ...context
      }
    } else if (error.message?.includes('advance_workflow_step')) {
      // Erro específico da função de workflow
      workflowError = {
        code: 'WORKFLOW_FUNCTION_ERROR',
        message: 'Erro na função de workflow: ' + error.message,
        details: error,
        timestamp: new Date(),
        ...context
      }
    } else if (error.message?.includes('timeout')) {
      // Timeout
      workflowError = {
        code: 'TIMEOUT_ERROR',
        message: 'Timeout: operação demorou muito para ser concluída',
        details: error,
        timestamp: new Date(),
        ...context
      }
    } else if (error.message?.includes('network')) {
      // Erro de rede
      workflowError = {
        code: 'NETWORK_ERROR',
        message: 'Erro de rede: verifique sua conexão',
        details: error,
        timestamp: new Date(),
        ...context
      }
    } else {
      // Erro genérico
      workflowError = {
        code: 'GENERIC_ERROR',
        message: error.message || 'Erro inesperado',
        details: error,
        timestamp: new Date(),
        ...context
      }
    }

    this.logError(workflowError)
    return workflowError
  }

  // Obter mensagem amigável para o usuário
  getUserFriendlyMessage(error: WorkflowError): string {
    switch (error.code) {
      case 'RLS_ERROR':
        return 'Você não tem permissão para realizar esta ação. Entre em contato com o administrador.'
      
      case 'DUPLICATE_KEY_ERROR':
        return 'Este item já existe. Verifique se não está tentando criar um duplicado.'
      
      case 'FOREIGN_KEY_ERROR':
        return 'Erro de referência. O item que você está tentando usar não existe mais.'
      
      case 'WORKFLOW_FUNCTION_ERROR':
        return 'Erro no sistema de tramitação. Tente novamente ou entre em contato com o suporte.'
      
      case 'TIMEOUT_ERROR':
        return 'A operação demorou muito para ser concluída. Tente novamente.'
      
      case 'NETWORK_ERROR':
        return 'Erro de conexão. Verifique sua internet e tente novamente.'
      
      case 'GENERIC_ERROR':
      default:
        return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.'
    }
  }

  // Verificar se é um erro recuperável
  isRecoverableError(error: WorkflowError): boolean {
    const recoverableCodes = [
      'TIMEOUT_ERROR',
      'NETWORK_ERROR',
      'WORKFLOW_FUNCTION_ERROR'
    ]
    return recoverableCodes.includes(error.code)
  }

  // Obter logs de erro
  getErrorLogs(): WorkflowError[] {
    return [...this.errorLog]
  }

  // Limpar logs antigos (manter apenas os últimos 100)
  cleanupOldLogs(): void {
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }
  }
}

// Hook para usar o error handler
export function useWorkflowErrorHandler() {
  const errorHandler = WorkflowErrorHandler.getInstance()

  const handleError = (error: any, context?: {
    userId?: string
    processId?: string
    executionId?: string
    action?: string
  }) => {
    return errorHandler.handleWorkflowError(error, context)
  }

  const getUserMessage = (error: WorkflowError) => {
    return errorHandler.getUserFriendlyMessage(error)
  }

  const isRecoverable = (error: WorkflowError) => {
    return errorHandler.isRecoverableError(error)
  }

  return {
    handleError,
    getUserMessage,
    isRecoverable,
    getErrorLogs: () => errorHandler.getErrorLogs(),
    cleanupOldLogs: () => errorHandler.cleanupOldLogs()
  }
}

// Função utilitária para retry automático
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

// Função para validar dados de entrada
export function validateWorkflowData(data: any, requiredFields: string[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Campo obrigatório ausente: ${field}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
