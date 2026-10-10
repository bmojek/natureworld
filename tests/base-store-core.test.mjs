import assert from "node:assert/strict";
import test from "node:test";
import {
  BasePaginationError,
  BasePriceConfigurationError,
  BaseProductPriceError,
  fetchAllBasePages,
  parsePriceGroupId,
  priceFor,
  shouldContinueProductScroll,
} from "../app/lib/base-store-core.ts";

test("configured price group is required and must be a positive integer", () => {
  assert.throws(() => parsePriceGroupId(undefined), BasePriceConfigurationError);
  assert.throws(() => parsePriceGroupId(""), BasePriceConfigurationError);
  assert.throws(() => parsePriceGroupId("2.5"), BasePriceConfigurationError);
  assert.throws(() => parsePriceGroupId("0"), BasePriceConfigurationError);
  assert.equal(parsePriceGroupId(" 42 "), "42");
});

test("missing or invalid configured-group price never falls back to another group", () => {
  assert.throws(() => priceFor({ "17": 12.5 }, "18"), BaseProductPriceError);
  assert.throws(() => priceFor({ "18": Number.NaN, "17": 12.5 }, "18"), BaseProductPriceError);
  assert.throws(() => priceFor({ "18": -1, "17": 12.5 }, "18"), BaseProductPriceError);
  assert.throws(() => priceFor({ "17": 12.5 }, undefined), BasePriceConfigurationError);
});

test("uses the configured group when other valid prices are also present", () => {
  assert.equal(priceFor({ "17": 12.5, "18": 23.75 }, "18"), 23.75);
  // Zero remains valid: the Product model and checkout calculations permit a zero price.
  assert.equal(priceFor({ "18": 0, "17": 23.75 }, "18"), 0);
});

test("fetches the next Base page when the first page has exactly 1000 products", async () => {
  const all = Array.from({ length: 1000 }, (_, index) => ({ id: index + 1 }));
  const requestedPages = [];
  const products = await fetchAllBasePages(async (page) => {
    requestedPages.push(page);
    return page === 1 ? all : [];
  });
  assert.equal(products.length, 1000);
  assert.deepEqual(requestedPages, [1, 2]);
});

test("returns products beyond the 1000 product page boundary", async () => {
  const firstPage = Array.from({ length: 1000 }, (_, index) => ({ id: index + 1 }));
  const requestedPages = [];
  const products = await fetchAllBasePages(async (page) => {
    requestedPages.push(page);
    return page === 1 ? firstPage : page === 2 ? [{ id: 1001 }] : [];
  });
  assert.equal(products.length, 1001);
  assert.equal(products.at(-1).id, 1001);
  assert.deepEqual(requestedPages, [1, 2]);
});

test("loads a short last page, sorts products, and removes duplicates across pages", async () => {
  const pages = {
    1: [{ id: 3 }, { id: 1 }],
    2: [{ id: 1 }, { id: 2 }],
    3: [{ id: 4 }],
  };
  const requestedPages = [];
  const products = await fetchAllBasePages(async (page) => {
    requestedPages.push(page);
    return pages[page] ?? [];
  }, 2);
  assert.deepEqual(products.map(({ id }) => id), [1, 2, 3, 4]);
  assert.deepEqual(requestedPages, [1, 2, 3]);
});

test("empty Base page ends pagination and null cursor ends infinite scroll", async () => {
  let calls = 0;
  const products = await fetchAllBasePages(async () => { calls += 1; return []; });
  assert.deepEqual(products, []);
  assert.equal(calls, 1);
  assert.equal(shouldContinueProductScroll(null), false);
  assert.equal(shouldContinueProductScroll("2"), true);
});

test("a repeated full Base page fails instead of caching incomplete pagination", async () => {
  const repeated = [{ id: 1 }, { id: 2 }];
  await assert.rejects(
    fetchAllBasePages(async (page) => page === 1 ? repeated : repeated, 2),
    BasePaginationError,
  );
});
