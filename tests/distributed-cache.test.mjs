import assert from "node:assert/strict";
import test from "node:test";
import { createDistributedCache } from "../app/lib/distributed-cache-core.ts";

function createFakeRedis(now = () => Date.now()) {
  const values = new Map();
  return {
    async get(key) {
      const entry = values.get(key);
      if (!entry || entry.expiresAt <= now()) {
        values.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttlMs, onlyIfAbsent = false) {
      const current = values.get(key);
      if (onlyIfAbsent && current && current.expiresAt > now()) return false;
      values.set(key, { value, expiresAt: now() + ttlMs });
      return true;
    },
    async releaseLock(key, token) {
      if (await this.get(key) === token) values.delete(key);
    },
  };
}

test("10 concurrent visitors for the same category cause one BaseLinker load across cache instances", async () => {
  const redis = createFakeRedis();
  const visitors = Array.from({ length: 10 }, () => createDistributedCache(redis));
  let baseCalls = 0;
  const loadCategory = async () => {
    baseCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 30));
    return { categoryId: "garden", products: ["seed", "soil"] };
  };

  const responses = await Promise.all(visitors.map((cache) =>
    cache.get("same-garden-category-page", { ttlMs: 60_000, staleTtlMs: 300_000 }, loadCategory),
  ));

  assert.equal(baseCalls, 1);
  assert.ok(responses.every((response) => response.products.length === 2));
});

test("different category query keys each need their own initial load", async () => {
  const redis = createFakeRedis();
  const cache = createDistributedCache(redis);
  let baseCalls = 0;
  const load = async () => ({ products: [++baseCalls] });

  await Promise.all([
    cache.get("garden-page-1", { ttlMs: 60_000, staleTtlMs: 300_000 }, load),
    cache.get("garden-page-2", { ttlMs: 60_000, staleTtlMs: 300_000 }, load),
  ]);

  assert.equal(baseCalls, 2);
});

test("stale shared data is returned during a BaseLinker outage", async () => {
  let time = 0;
  const redis = createFakeRedis(() => time);
  const cache = createDistributedCache(redis);
  const options = { ttlMs: 10, staleTtlMs: 100 };

  assert.deepEqual(await cache.get("garden", options, async () => ({ products: ["last-good"] })), { products: ["last-good"] });
  time = 11;
  assert.deepEqual(await cache.get("garden", options, async () => { throw new Error("BaseLinker unavailable"); }), { products: ["last-good"] });
});
