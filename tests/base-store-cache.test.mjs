import assert from "node:assert/strict";
import test from "node:test";
import { createAsyncStaleCache, requireObjectField } from "../app/lib/base-store-cache-core.ts";

test("reuses a fresh cached value without calling the loader again", async () => {
  const cache = createAsyncStaleCache({ freshTtlMs: 100, staleTtlMs: 500 });
  let calls = 0;
  const load = async () => { calls += 1; return ["catalog"]; };

  assert.deepEqual(await cache.get("key", load), ["catalog"]);
  assert.deepEqual(await cache.get("key", load), ["catalog"]);
  assert.equal(calls, 1);
});

test("expires a cached value and refreshes it", async () => {
  let time = 0;
  const cache = createAsyncStaleCache({ freshTtlMs: 10, staleTtlMs: 100, now: () => time });
  let calls = 0;
  const load = async () => ++calls;

  assert.equal(await cache.get("key", load), 1);
  time = 11;
  assert.equal(await cache.get("key", load), 2);
  assert.equal(calls, 2);
});

test("coalesces parallel identical requests into one loader call", async () => {
  const cache = createAsyncStaleCache({ freshTtlMs: 100, staleTtlMs: 500 });
  let calls = 0;
  let finish;
  const load = () => {
    calls += 1;
    return new Promise((resolve) => { finish = resolve; });
  };

  const first = cache.get("key", load);
  const second = cache.get("key", load);
  assert.equal(calls, 1);
  finish(["shared"]);
  assert.deepEqual(await Promise.all([first, second]), [["shared"], ["shared"]]);
});

test("does not cache an API error or an incomplete result", async () => {
  const cache = createAsyncStaleCache({ freshTtlMs: 100, staleTtlMs: 500 });
  await assert.rejects(cache.get("key", async () => { throw new Error("Base API failed"); }), /Base API failed/);
  await assert.rejects(
    cache.get("key", async () => requireObjectField({ status: "SUCCESS" }, "products")),
    /incomplete products response/,
  );
  assert.deepEqual(await cache.get("key", async () => ({ products: ["complete"] })), { products: ["complete"] });
});

test("rejects malformed listing data before it can enter the cache", () => {
  assert.throws(() => requireObjectField({}, "products"), /incomplete products response/);
  assert.throws(() => requireObjectField({ products: [] }, "products"), /incomplete products response/);
  assert.deepEqual(requireObjectField({ products: {} }, "products"), {});
});

test("uses the last successful catalog only as temporary fallback during an API error", async () => {
  let time = 0;
  const cache = createAsyncStaleCache({ freshTtlMs: 10, staleTtlMs: 100, now: () => time });
  assert.deepEqual(await cache.get("key", async () => ["last-good"]), ["last-good"]);
  time = 11;
  assert.deepEqual(await cache.get("key", async () => { throw new Error("temporary outage"); }), ["last-good"]);
  time = 101;
  await assert.rejects(cache.get("key", async () => { throw new Error("long outage"); }), /long outage/);
});
