import "server-only";

import { createHash } from "node:crypto";
import { BaseLinkerError } from "@/app/lib/base-linker";
import { createDistributedCache } from "@/app/lib/distributed-cache-core";

type RedisResult<T> = { result: T };

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // Local development can use the existing Next.js/process caches. On Vercel,
    // fail closed so a missing shared cache cannot silently cause BaseLinker load spikes.
    if (process.env.VERCEL === "1") throw new BaseLinkerError("Shared catalog cache is not configured.", "CACHE_NOT_CONFIGURED");
    return null;
  }
  return { url, token };
}

async function command<T>(parts: (string | number)[]): Promise<T> {
  const config = redisConfig();
  if (!config) throw new Error("Redis is not configured.");
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([parts]),
    cache: "no-store",
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) throw new Error(`Redis REST returned HTTP ${response.status}.`);
  const result = await response.json() as RedisResult<T>[];
  if (!Array.isArray(result) || !result[0] || "error" in result[0]) throw new Error("Redis REST command failed.");
  return result[0].result;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const releaseLockScript = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
const distributedCache = createDistributedCache({
  get: (key) => command<string | null>(["GET", key]),
  set: async (key, value, ttlMs, onlyIfAbsent = false) => {
    const result = await command<string | null>([
      "SET", key, value, "PX", ttlMs,
      ...(onlyIfAbsent ? ["NX"] : []),
    ]);
    return result === "OK";
  },
  releaseLock: async (key, token) => {
    await command(["EVAL", releaseLockScript, 1, key, token]);
  },
});

/** Shared cache + distributed single-flight for BaseLinker read responses. */
export async function getSharedBaseResponse<T>(
  method: string,
  parameters: Record<string, unknown>,
  options: { ttlMs: number; staleTtlMs: number },
  load: () => Promise<T>,
): Promise<T> {
  if (!process.env.UPSTASH_REDIS_REST_URL && process.env.VERCEL !== "1") return load();

  const identity = createHash("sha256").update(`${method}:${stableJson(parameters)}`).digest("hex");
  const key = `natureworld:base:v1:${identity}`;
  const config = redisConfig();
  if (!config) return load();
  try {
    return await distributedCache.get(key, options, load);
  } catch (error) {
    if (error instanceof BaseLinkerError) throw error;
    if (error && typeof error === "object" && "code" in error && error.code === "CACHE_REFRESH_IN_PROGRESS") {
      throw new BaseLinkerError("Catalog refresh is already in progress. Retry shortly.", "CACHE_REFRESH_IN_PROGRESS");
    }
    // Redis errors in production fail closed rather than reverting to direct
    // BaseLinker reads from every Vercel instance.
    throw new BaseLinkerError("Shared catalog cache is unavailable.", "CACHE_UNAVAILABLE");
  }
}
