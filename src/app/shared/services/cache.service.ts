import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiryTime: number; // en milisegundos
}

@Injectable({
    providedIn: 'root'
})
export class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutos por defecto

    /**
     * Obtiene datos del caché si están disponibles y no han expirado
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (now > entry.timestamp + entry.expiryTime) {
            // El caché ha expirado
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Almacena datos en el caché
     */
    set<T>(key: string, data: T, expiryTime: number = this.DEFAULT_EXPIRY): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiryTime
        });
    }

    /**
     * Elimina una entrada del caché
     */
    remove(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Limpia todo el caché
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Limpia entradas expiradas del caché
     */
    clearExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.timestamp + entry.expiryTime) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Obtiene datos del caché o ejecuta la función si no están en caché
     */
    getOrSet<T>(
        key: string,
        fetchFn: () => Observable<T>,
        expiryTime: number = this.DEFAULT_EXPIRY
    ): Observable<T> {
        const cached = this.get<T>(key);
        
        if (cached !== null) {
            return of(cached);
        }

        return fetchFn().pipe(
            tap(data => this.set(key, data, expiryTime))
        );
    }

    /**
     * Invalida el caché para una clave específica
     */
    invalidate(key: string): void {
        this.remove(key);
    }

    /**
     * Invalida todas las claves que comienzan con un prefijo
     */
    invalidateByPrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
}
