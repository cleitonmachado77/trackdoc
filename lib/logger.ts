// Sistema de logs otimizado para reduzir spam
// Só mostra logs importantes e evita repetições excessivas

interface LogEntry {
  message: string
  timestamp: number
  count: number
}

class SmartLogger {
  private logHistory = new Map<string, LogEntry>()
  private readonly maxRepeats = 3 // Máximo de repetições antes de parar de logar
  private readonly timeWindow = 30000 // 30 segundos

  private shouldLog(key: string): boolean {
    const now = Date.now()
    const entry = this.logHistory.get(key)

    if (!entry) {
      this.logHistory.set(key, { message: key, timestamp: now, count: 1 })
      return true
    }

    // Se passou do tempo limite, resetar contador
    if (now - entry.timestamp > this.timeWindow) {
      this.logHistory.set(key, { message: key, timestamp: now, count: 1 })
      return true
    }

    // Incrementar contador
    entry.count++
    this.logHistory.set(key, entry)

    // Só logar se não passou do limite
    return entry.count <= this.maxRepeats
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(message)) {
      console.log(`ℹ️ ${message}`, ...args)
    }
  }

  success(message: string, ...args: any[]) {
    if (this.shouldLog(message)) {
      console.log(`✅ ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(message)) {
      console.warn(`⚠️ ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]) {
    // Erros sempre são logados
    console.error(`❌ ${message}`, ...args)
  }

  debug(message: string, ...args: any[]) {
    // Debug só em desenvolvimento
    if (process.env.NODE_ENV === 'development' && this.shouldLog(message)) {
      console.log(`🔍 ${message}`, ...args)
    }
  }

  // Limpar histórico antigo
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.logHistory.entries()) {
      if (now - entry.timestamp > this.timeWindow * 2) {
        this.logHistory.delete(key)
      }
    }
  }
}

// Instância global
export const logger = new SmartLogger()

// Limpar histórico a cada 5 minutos
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(() => {
    logger.cleanup()
  }, 5 * 60 * 1000)
}
