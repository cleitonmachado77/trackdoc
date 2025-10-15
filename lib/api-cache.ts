/**
 * Sistema de cache aprimorado para APIs
 * Usa cache em memória com TTL e invalidação inteligente
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutos

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }
    this.cache.set(key, entry)
  }

  /**
   * Recupera dados do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Remove entrada do cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Remove várias entradas por padrão
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Estatísticas do cache
   */
  getStats() {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    return {
      total: entries.length,
      expired: entries.filter(([_, entry]) => now - entry.timestamp > entry.ttl).length,
      active: entries.filter(([_, entry]) => now - entry.timestamp <= entry.ttl).length,
      size: entries.reduce((acc, [_, entry]) => {
        return acc + JSON.stringify(entry.data).length
      }, 0)
    }
  }
}

// Instância global
export const apiCache = new APICache()

// Limpeza automática a cada 5 minutos (apenas no servidor)
if (typeof window === 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Helper para criar chaves de cache consistentes
 */
export const cacheKey = {
  profile: (userId: string) => `profile:${userId}`,
  userDocuments: (userId: string, filters?: any) => 
    `user-docs:${userId}:${JSON.stringify(filters || {})}`,
  approvals: (userId: string) => `approvals:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  entityUsers: (entityId: string) => `entity-users:${entityId}`,
  conversations: (userId: string) => `conversations:${userId}`,
  messages: (conversationId: string, limit: number) => `messages:${conversationId}:${limit}`,
}

/**
 * Invalidação inteligente de cache
 */
export const invalidateCache = {
  profile: (userId: string) => {
    apiCache.delete(cacheKey.profile(userId))
  },
  
  documents: (userId: string) => {
    apiCache.deletePattern(`user-docs:${userId}:.*`)
  },
  
  approvals: (userId: string) => {
    apiCache.delete(cacheKey.approvals(userId))
  },
  
  notifications: (userId: string) => {
    apiCache.delete(cacheKey.notifications(userId))
  },
  
  chat: (userId: string) => {
    apiCache.deletePattern(`conversations:${userId}`)
    apiCache.deletePattern(`messages:.*`)
  },
  
  all: (userId: string) => {
    apiCache.deletePattern(`.*:${userId}.*`)
  }
}
