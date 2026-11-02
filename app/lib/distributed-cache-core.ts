export interface SharedCacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number, onlyIfAbsent?: boolean): Promise<boolean>;
  releaseLock(key: string, token: string): Promise<void>;
}

export class SharedRefreshInProgressError extends Error {
  readonly code = "CACHE_REFRESH_IN_PROGRESS";
  constructor() {
    super("Catalog refresh is already in progress. Retry shortly.");
    this.name = "SharedRefreshInProgressError";
  }
}

/** Shared-value cache algorithm; store can be Redis or a deterministic test double. */
export function createDistributedCache(store: SharedCacheStore, wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))) {
  const inFlight = new Map<string, Promise<unknown>>();

  return {
    async get<T>(
      key: string,
      options: { ttlMs: number; staleTtlMs: number },
      load: () => Promise<T>,
    ): Promise<T> {
      const staleKey = `${key}:stale`;
      const lockKey = `${key}:lock`;
      const existing = inFlight.get(key) as Promise<T> | undefined;
      if (existing) return existing;

      const request = (async () => {
        const fresh = await store.get(key);
        if (fresh) return JSON.parse(fresh) as T;

        const stale = await store.get(staleKey);
        const lockToken = randomUUID();
        const lockAcquired = await store.set(lockKey, lockToken, 15_000, true);
        if (lockAcquired) {
          try {
            const value = await load();
            const serialized = JSON.stringify(value);
            await Promise.all([
              store.set(key, serialized, options.ttlMs),
              store.set(staleKey, serialized, options.staleTtlMs),
            ]);
            return value;
          } catch (error) {
            if (stale) return JSON.parse(stale) as T;
            throw error;
          } finally {
            try { await store.releaseLock(lockKey, lockToken); } catch { /* lock expires automatically */ }
          }
        }

        if (stale) return JSON.parse(stale) as T;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await wait(350);
          const value = await store.get(key);
          if (value) return JSON.parse(value) as T;
        }
        throw new SharedRefreshInProgressError();
      })();

      inFlight.set(key, request);
      try { return await request; }
      finally { inFlight.delete(key); }
    },
  };
}
import { randomUUID } from "node:crypto";

