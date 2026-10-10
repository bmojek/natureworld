import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createAsyncStaleCache } from "../app/lib/base-store-cache-core.ts";

const routeSource = readFileSync(new URL("../app/api/categories/route.ts", import.meta.url), "utf8");
const storeSource = readFileSync(new URL("../app/lib/base-store.ts", import.meta.url), "utf8");

test("categories endpoint reads the cached category tree without product-list requests", () => {
  assert.match(routeSource, /import\s*\{\s*getBaseCategories\s*\}\s*from/);
  assert.equal((routeSource.match(/getBaseCategories\(\)/g) ?? []).length, 1);
  assert.doesNotMatch(routeSource, /refreshCategoryProductPresence|getCachedBaseProductsList|getInventoryProductsList/);
  assert.doesNotMatch(storeSource, /refreshCategoryProductPresence/);
});

test("simultaneous category reads coalesce into one cached load", async () => {
  const categoryCache = createAsyncStaleCache({ freshTtlMs: 300_000, staleTtlMs: 3_600_000 });
  let calls = 0;
  let resolveLoad;
  const loadCategories = () => {
    calls += 1;
    return new Promise((resolve) => { resolveLoad = resolve; });
  };

  const requests = Array.from({ length: 12 }, () => categoryCache.get("inventory:29152", loadCategories));
  assert.equal(calls, 1);
  resolveLoad([{ id: "1", name: "Ogród" }]);
  const results = await Promise.all(requests);
  assert.ok(results.every((items) => items.length === 1));
  assert.equal(calls, 1);
});

test("category read failures do not trigger retries or clear existing client menus", () => {
  assert.doesNotMatch(routeSource, /while\s*\(|for\s*\(/);
  const desktop = readFileSync(new URL("../app/components/Categories.tsx", import.meta.url), "utf8");
  const mobile = readFileSync(new URL("../app/components/MobileCategories.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(desktop, /catch\(\(\)\s*=>\s*setTree\(\[\]\)\)/);
  assert.doesNotMatch(mobile, /catch\(\(\)\s*=>\s*setTree\(\[\]\)\)/);
});
