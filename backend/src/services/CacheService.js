"use strict";
// backend/src/services/CacheService.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
/**
 * Servicio de Caché
 * Maneja operaciones de Redis para mejorar performance
 * Implementación simulada para Phase 1.2
 */
class CacheService {
    constructor() {
        this.mockCache = new Map();
        console.log('CacheService initialized (mock implementation)');
        // Cleanup automático cada 5 minutos
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield this.delay(5);
            console.log('CacheService: Cache HIT for key:', key);
            return entry.value;
        });
    }
    set(key, value, expireInSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('CacheService: SET', key, 'expire in', expireInSeconds, 'seconds');
            const expiry = Date.now() + (expireInSeconds * 1000);
            this.mockCache.set(key, {
                value: JSON.parse(JSON.stringify(value)), // Deep clone
                expiry
            });
            yield this.delay(3);
            console.log('CacheService: Key cached successfully:', key);
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('CacheService: DELETE', key);
            const existed = this.mockCache.has(key);
            this.mockCache.delete(key);
            yield this.delay(2);
            if (existed) {
                console.log('CacheService: Key deleted:', key);
            }
            else {
                console.log('CacheService: Key not found for deletion:', key);
            }
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield this.delay(2);
            return true;
        });
    }
    flushUserCache(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('CacheService: Flushing cache for user:', userId);
            let deletedCount = 0;
            // Buscar y eliminar todas las claves relacionadas con el usuario
            for (const [key] of this.mockCache) {
                if (key.includes(userId)) {
                    this.mockCache.delete(key);
                    deletedCount++;
                }
            }
            yield this.delay(10);
            console.log(`CacheService: Flushed ${deletedCount} cache entries for user:`, userId);
        });
    }
    /**
     * Obtiene múltiples valores del caché
     */
    mget(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('CacheService: MGET', keys.length, 'keys');
            const result = {};
            for (const key of keys) {
                result[key] = yield this.get(key);
            }
            return result;
        });
    }
    /**
     * Establece múltiples valores en el caché
     */
    mset(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('CacheService: MSET', Object.keys(entries).length, 'entries');
            for (const [key, data] of Object.entries(entries)) {
                yield this.set(key, data.value, Math.max(0, data.expiry - Date.now()) / 1000);
            }
        });
    }
    /**
     * Incrementa un contador en el caché
     */
    increment(key_1) {
        return __awaiter(this, arguments, void 0, function* (key, by = 1) {
            console.log('CacheService: INCREMENT', key, 'by', by);
            const current = (yield this.get(key)) || 0;
            const newValue = Number(current) + by;
            yield this.set(key, newValue, 3600); // 1 hora por defecto
            return newValue;
        });
    }
    /**
     * Establece un valor con TTL (Time To Live)
     */
    setWithTTL(key, value, ttlSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.set(key, value, ttlSeconds);
        });
    }
    /**
     * Obtiene el TTL restante de una clave
     */
    getTTL(key) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    // ============================================================================
    // MÉTODOS DE ADMINISTRACIÓN
    // ============================================================================
    /**
     * Limpia entradas expiradas
     */
    cleanupExpiredEntries() {
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
    getStats() {
        const now = Date.now();
        let activeEntries = 0;
        let expiredEntries = 0;
        for (const [, entry] of this.mockCache) {
            if (now > entry.expiry) {
                expiredEntries++;
            }
            else {
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
    estimateMemoryUsage() {
        const sizeInBytes = JSON.stringify(Array.from(this.mockCache.entries())).length;
        if (sizeInBytes < 1024) {
            return `${sizeInBytes} B`;
        }
        else if (sizeInBytes < 1024 * 1024) {
            return `${(sizeInBytes / 1024).toFixed(2)} KB`;
        }
        else {
            return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
        }
    }
    /**
     * Limpia todo el caché
     */
    clear() {
        this.mockCache.clear();
        console.log('CacheService: All cache cleared');
    }
    /**
     * Destruye el servicio
     */
    destroy() {
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
    delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.CacheService = CacheService;
