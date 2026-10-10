type CacheEntry<T> = {
  value: T;
  freshUntil: number;
  staleUntil: number;
};

export type AsyncStaleCache<T> = {
  get(key: string, load: () => Promise<T>): Promise<T>;
};

export function requireObjectField(
  response: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  const value = response[field];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Base.com returned an incomplete ${field} response.`);
  }
  return value as Record<string, unknown>;
}

/** Process-local front cache with request coalescing and last-known-good fallback. */
export function createAsyncStaleCache<T>(options: {
  freshTtlMs: number;
  staleTtlMs: number;
  now?: () => number;
}): AsyncStaleCache<T> {
  const entries = new Map<string, CacheEntry<T>>();
  const pending = new Map<string, Promise<T>>();
  const now = options.now ?? Date.now;

  return {
    async get(key, load) {
      const currentTime = now();
      const entry = entries.get(key);
      if (entry && currentTime < entry.freshUntil) return entry.value;

      const existing = pending.get(key);
      if (existing) return existing;

      const request = load()
        .then((value) => {
          const savedAt = now();
          entries.set(key, {
            value,
            freshUntil: savedAt + options.freshTtlMs,
            staleUntil: savedAt + options.staleTtlMs,
          });
          return value;
        })
        .catch((error: unknown) => {
          const stale = entries.get(key);
          if (stale && now() < stale.staleUntil) return stale.value;
          throw error;
        })
        .finally(() => pending.delete(key));

      pending.set(key, request);
      return request;
    },
  };
}
