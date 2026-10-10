import test from "node:test";
import assert from "node:assert/strict";
import { catalogUrlForState, expandCategorySelection, parseCatalogQuery, queryCatalogRecords } from "../app/lib/catalog-query-core.ts";
import { shouldContinueProductScroll } from "../app/lib/base-store-core.ts";

const products = [
  { id: 4, name: "Żaba", price: 20, stock: 0, category: "a" },
  { id: 3, name: "Dom", price: 10, stock: 4, category: "b" },
  { id: 2, name: "Dom", price: 10, stock: 2, category: "a" },
  { id: 1, name: "Karmnik", price: 40, stock: 1, category: "b" },
];

test("validates sorting and price ranges from URL parameters", () => {
  assert.equal(parseCatalogQuery(new URLSearchParams("sort=price-asc&minPrice=1.20&maxPrice=10"))?.sort, "price-asc");
  assert.equal(parseCatalogQuery(new URLSearchParams("sort=popular")), null);
  assert.equal(parseCatalogQuery(new URLSearchParams("minPrice=-1")), null);
  assert.equal(parseCatalogQuery(new URLSearchParams("minPrice=20&maxPrice=10")), null);
});

test("combines price, availability and stable price ordering over the full result", () => {
  const result = queryCatalogRecords(products, { sort: "price-asc", minPrice: 10, maxPrice: 20, inStock: true });
  assert.deepEqual(result.map(({ id }) => id), [2, 3]);
});

test("uses stable id tie breaking for names and default relevance", () => {
  assert.deepEqual(queryCatalogRecords(products, { sort: "name-asc", inStock: false }).map(({ id }) => id), [2, 3, 1, 4]);
  assert.deepEqual(queryCatalogRecords(products, { sort: "relevance", inStock: false }).map(({ id }) => id), [1, 2, 3, 4]);
});

test("returns an empty result for unmatched filters", () => {
  assert.deepEqual(queryCatalogRecords(products, { sort: "price-desc", minPrice: 100, inStock: true }), []);
});

test("selecting a subcategory includes its descendants but stays inside the current category", () => {
  const tree = [
    { id: "1", parentId: null },
    { id: "2", parentId: "1" },
    { id: "3", parentId: "2" },
    { id: "4", parentId: "1" },
  ];
  assert.deepEqual(expandCategorySelection(tree, ["2"], ["1", "2", "3"]), ["2", "3"]);
});

test("filter/sort URL changes remove the old cursor and reset pagination", () => {
  const url = catalogUrlForState("https://natureworld.test/sklep/kategoria/ogród?cursor=4&search=ziemia", {
    search: "ziemia", sort: "price-asc", minPrice: "5", inStock: true,
  });
  assert.equal(url, "/sklep/kategoria/ogr%C3%B3d?search=ziemia&sort=price-asc&minPrice=5&stock=1");
});

test("null cursor ends infinite scroll", () => {
  assert.equal(shouldContinueProductScroll(null), false);
  assert.equal(shouldContinueProductScroll("3"), true);
});
