import { useState, useEffect, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  invalidate(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Instância global do cache
const globalCache = new SimpleCache()

// Limpar cache expirado a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup()
  }, 5 * 60 * 1000)
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 5,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      // Tentar buscar do cache primeiro
      if (useCache) {
        const cachedData = globalCache.get<T>(key)
        if (cachedData !== null) {
          setData(cachedData)
          setLoading(false)
          return cachedData
        }
      }

      // Buscar dados frescos
      const freshData = await fetcher()
      
      // Salvar no cache
      globalCache.set(key, freshData, ttlMinutes)
      setData(freshData)
      
      return freshData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error(`Erro ao buscar dados para chave ${key}:`, err)
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttlMinutes])

  const invalidateCache = useCallback(() => {
    globalCache.invalidate(key)
  }, [key])

  const refetch = useCallback(() => {
    return fetchData(false) // Forçar busca sem cache
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache
  }
}

export { globalCache }