// backend/src/services/CacheService.ts

/**
 * Servicio de Caché
 * Maneja operaciones de Redis para mejorar performance
 * Implementación simulada para Phase 1.2
 */
export class CacheService {
    private mockCache: Map<string, { value: any; expiry: number }> = new Map();
    private cleanupInterval: NodeJS.Timeout;
  
    constructor() {
      console.log('CacheService initialized (mock implementation)');
      
      // Cleanup automático cada 5 minutos
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpiredEntries();
      }, 5 * 60 * 1000);
    }
  
    async get(key: string): Promise<any> {
      console.log('CacheService: GET', key);
      
      const entry = this.mockCache.get(key);
      
      if (!entry) {
        return null;
      }
      
      // Verificar si expiró
      if (Date.now() > entry.expiry) {
        this.mockCache.delete(key);
        console.log('CacheService: Key expired and removed:', key);
        return null;
      }
      
      // Simular latencia mínima de Redis
      await this.delay(5);
      
      console.log('CacheService: Cache HIT for key:', key);
      return entry.value;
    }
  
    async set(key: string, value: any, expireInSeconds: number): Promise<void> {
      console.log('CacheService: SET', key, 'expire in', expireInSeconds, 'seconds');
      
      const expiry = Date.now() + (expireInSeconds * 1000);
      
      this.mockCache.set(key, {
        value: JSON.parse(JSON.stringify(value)), // Deep clone
        expiry
      });
      
      await this.delay(3);
      console.log('CacheService: Key cached successfully:', key);
    }
  
    async delete(key: string): Promise<void> {
      console.log('CacheService: DELETE', key);
      
      const existed = this.mockCache.has(key);
      this.mockCache.delete(key);
      
      await this.delay(2);
      
      if (existed) {
        console.log('CacheService: Key deleted:', key);
      } else {
        console.log('CacheService: Key not found for deletion:', key);
      }
    }
  
    async exists(key: string): Promise<boolean> {
      console.log('CacheService: EXISTS', key);
      
      const entry = this.mockCache.get(key);
      
      if (!entry) {
        return false;
      }
      
      // Verificar si expiró
      if (Date.now() > entry.expiry) {
        this.mockCache.delete(key);
        return false;
      }
      
      await this.delay(2);
      return true;
    }
  
    async flushUserCache(userId: string): Promise<void> {
      console.log('CacheService: Flushing cache for user:', userId);
      
      let deletedCount = 0;
      
      // Buscar y eliminar todas las claves relacionadas con el usuario
      for (const [key] of this.mockCache) {
        if (key.includes(userId)) {
          this.mockCache.delete(key);
          deletedCount++;
        }
      }
      
      await this.delay(10);
      console.log(`CacheService: Flushed ${deletedCount} cache entries for user:`, userId);
    }
  
    /**
     * Obtiene múltiples valores del caché
     */
    async mget(keys: string[]): Promise<{ [key: string]: any }> {
      console.log('CacheService: MGET', keys.length, 'keys');
      
      const result: { [key: string]: any } = {};
      
      for (const key of keys) {
        result[key] = await this.get(key);
      }
      
      return result;
    }
  
    /**
     * Establece múltiples valores en el caché
     */
    async mset(entries: { [key: string]: { value: any; expiry: number } }): Promise<void> {
      console.log('CacheService: MSET', Object.keys(entries).length, 'entries');
      
      for (const [key, data] of Object.entries(entries)) {
        await this.set(key, data.value, Math.max(0, data.expiry - Date.now()) / 1000);
      }
    }
  
    /**
     * Incrementa un contador en el caché
     */
    async increment(key: string, by: number = 1): Promise<number> {
      console.log('CacheService: INCREMENT', key, 'by', by);
      
      const current = await this.get(key) || 0;
      const newValue = Number(current) + by;
      
      await this.set(key, newValue, 3600); // 1 hora por defecto
      
      return newValue;
    }
  
    /**
     * Establece un valor con TTL (Time To Live)
     */
    async setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void> {
      await this.set(key, value, ttlSeconds);
    }
  
    /**
     * Obtiene el TTL restante de una clave
     */
    async getTTL(key: string): Promise<number> {
      const entry = this.mockCache.get(key);
      
      if (!entry) {
        return -2; // Clave no existe
      }
      
      const remaining = Math.max(0, entry.expiry - Date.now()) / 1000;
      
      if (remaining <= 0) {
        this.mockCache.delete(key);
        return -2;
      }
      
      return Math.floor(remaining);
    }
  
    // ============================================================================
    // MÉTODOS DE ADMINISTRACIÓN
    // ============================================================================
  
    /**
     * Limpia entradas expiradas
     */
    private cleanupExpiredEntries(): void {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, entry] of this.mockCache) {
        if (now > entry.expiry) {
          this.mockCache.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`CacheService: Cleaned up ${cleanedCount} expired entries`);
      }
    }
  
    /**
     * Obtiene estadísticas del caché
     */
    public getStats() {
      const now = Date.now();
      let activeEntries = 0;
      let expiredEntries = 0;
      
      for (const [, entry] of this.mockCache) {
        if (now > entry.expiry) {
          expiredEntries++;
        } else {
          activeEntries++;
        }
      }
      
      return {
        totalEntries: this.mockCache.size,
        activeEntries,
        expiredEntries,
        memoryUsage: this.estimateMemoryUsage(),
        isSimulated: true
      };
    }
  
    /**
     * Estima el uso de memoria (simplificado)
     */
    private estimateMemoryUsage(): string {
      const sizeInBytes = JSON.stringify(Array.from(this.mockCache.entries())).length;
      
      if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(2)} KB`;
      } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
      }
    }
  
    /**
     * Limpia todo el caché
     */
    public clear(): void {
      this.mockCache.clear();
      console.log('CacheService: All cache cleared');
    }
  
    /**
     * Destruye el servicio
     */
    public destroy(): void {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.clear();
      console.log('CacheService: Service destroyed');
    }
  
    // ============================================================================
    // UTILIDADES
    // ============================================================================
  
    /**
     * Simula latencia de Redis
     */
    private async delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }