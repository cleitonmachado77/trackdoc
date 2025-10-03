// Sistema de cache simples em memória para otimizar performance
// Cache com TTL (Time To Live) para dados que não mudam frequentemente

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos por padrão

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar se o item expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpar itens expirados
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Obter estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância global do cache
export const cache = new MemoryCache();

// Funções auxiliares para cache específico do chat
export const chatCache = {
  // Cache para lista de usuários (TTL: 10 minutos)
  setUsers: (entityId: string, users: any[]) => {
    cache.set(`users:${entityId}`, users, 10 * 60 * 1000);
  },

  getUsers: (entityId: string) => {
    return cache.get(`users:${entityId}`);
  },

  // Cache para conversas do usuário (TTL: 2 minutos)
  setUserConversations: (userId: string, conversations: any[]) => {
    cache.set(`conversations:${userId}`, conversations, 2 * 60 * 1000);
  },

  getUserConversations: (userId: string) => {
    return cache.get(`conversations:${userId}`);
  },

  // Invalidar cache quando há mudanças
  invalidateUserConversations: (userId: string) => {
    cache.delete(`conversations:${userId}`);
  },

  invalidateUsers: (entityId: string) => {
    cache.delete(`users:${entityId}`);
  },

  // Limpar todo o cache do chat
  clearAll: () => {
    const stats = cache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('users:') || key.startsWith('conversations:')) {
        cache.delete(key);
      }
    });
  }
};

// Limpar cache expirado a cada 5 minutos
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}
