import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { categoryHasAvailableProducts, categoryHasCatalogIds, categoryHasConfirmedAvailableProducts, categoryHasMenuProducts, getMenuCategoryChildren, markConfirmedProductCategories, resolveStorefrontDepartments, sortMenuGroupsByChildren } from "../app/lib/storefront-department-core.ts";

const category = (id, name, slug, parentId, level) => ({ id, name, slug, parentId, level });
const treeFrom = (categories) => {
  const map = new Map(categories.map((item) => [item.id, { ...item, children: [] }]));
  const roots = [];
  for (const node of map.values()) {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
};

test("maps only the three exact configured Base category paths", () => {
  const tree = treeFrom([
    category("path:supermarket", "Supermarket", "supermarket", null, 0),
    category("path:animals", "Artykuły dla zwierząt", "artykuly-dla-zwierzat", "path:supermarket", 1),
    category("501", "Dla psów", "dla-psow", "path:animals", 2),
    category("path:home", "Dom i Ogród", "dom-i-ogrod", null, 0),
    category("path:garden", "Ogród", "ogrod", "path:home", 1),
    category("502", "Doniczki", "doniczki", "path:garden", 2),
    category("path:equipment", "Wyposażenie", "wyposazenie", "path:home", 1),
    category("503", "Dekoracje", "dekoracje", "path:equipment", 2),
    category("path:sport", "Sport", "sport", null, 0),
    category("504", "Turystyka", "turystyka", "path:sport", 1),
  ]);

  const departments = resolveStorefrontDepartments(tree);
  assert.deepEqual(departments.map(({ label }) => label), ["ZWIERZĘTA", "OGRÓD", "DOM"]);
  assert.deepEqual(departments.map(({ categoryIds }) => categoryIds), [["501"], ["502"], ["503"]]);
  assert.ok(departments.every(({ roots }) => roots.length === 1));
});

test("does not expose structurally empty category branches as menu tiles", () => {
  const emptyBranch = { id: "path:empty", name: "Puste", slug: "puste", parentId: null, level: 0, children: [] };
  const productBranch = { ...emptyBranch, id: "path:filled", children: [{ ...emptyBranch, id: "505", parentId: "path:filled" }] };
  assert.equal(categoryHasCatalogIds(emptyBranch), false);
  assert.equal(categoryHasCatalogIds(productBranch), true);
  const knownEmpty = { ...productBranch, children: [{ ...emptyBranch, id: "505", parentId: "path:filled", hasAvailableProducts: false }] };
  const knownAvailable = { ...productBranch, children: [{ ...emptyBranch, id: "505", parentId: "path:filled", hasAvailableProducts: true }] };
  assert.equal(categoryHasAvailableProducts(knownEmpty), false);
  assert.equal(categoryHasAvailableProducts(knownAvailable), true);
  assert.equal(categoryHasAvailableProducts(productBranch), true, "unknown availability remains navigable on a cold cache");
  assert.equal(categoryHasConfirmedAvailableProducts(productBranch), false, "unknown availability is not presented as confirmed");
  assert.equal(categoryHasConfirmedAvailableProducts(knownAvailable), true);
  assert.equal(categoryHasConfirmedAvailableProducts(knownEmpty), false);
  const confirmedTree = markConfirmedProductCategories([productBranch], ["505"]);
  assert.equal(categoryHasConfirmedAvailableProducts(confirmedTree[0]), true);
});

test("menu category grouping keeps all categories before availability is known and does not impose a display cap", () => {
  const children = Array.from({ length: 18 }, (_, index) => ({
    id: String(600 + index), name: `Category ${index}`, slug: `category-${index}`,
    parentId: "root", level: 1, children: [],
  }));
  const root = { id: "root", name: "Department", slug: "department", parentId: null, level: 0, children };
  assert.equal(getMenuCategoryChildren(root).length, 18);
  assert.deepEqual(getMenuCategoryChildren(root).map(({ id }) => id), children.map(({ id }) => id));
  const menuSource = readFileSync(new URL("../app/components/Categories.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(menuSource, /\.slice\s*\(/, "desktop menu should not truncate category arrays");
  const mobileMenuSource = readFileSync(new URL("../app/components/MobileCategories.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(mobileMenuSource, /\.slice\s*\(/, "mobile menu should not truncate category arrays");
});

test("menu removes confirmed empty categories while retaining populated and unverified branches", () => {
  const empty = { id: "601", name: "Empty", slug: "empty", parentId: "root", level: 1, hasProducts: false, children: [] };
  const populated = { id: "602", name: "Populated", slug: "populated", parentId: "root", level: 1, hasProducts: true, children: [] };
  const unverified = { id: "603", name: "Unverified", slug: "unverified", parentId: "root", level: 1, children: [] };
  const root = { id: "root", name: "Department", slug: "department", parentId: null, level: 0, children: [empty, populated, unverified] };

  assert.equal(categoryHasMenuProducts(empty), false);
  assert.equal(categoryHasMenuProducts(populated), true);
  assert.equal(categoryHasMenuProducts(unverified), true);
  assert.deepEqual(getMenuCategoryChildren(root).map(({ id }) => id), ["602", "603"]);
});

test("menu groups with more visible children sort first and ties stay stable", () => {
  const node = (id, count) => ({
    id, name: id, slug: id, parentId: null, level: 0,
    children: Array.from({ length: count }, (_, index) => ({
      id: String(700 + index), name: `${id}-${index}`, slug: `${id}-${index}`,
      parentId: id, level: 1, hasProducts: true, children: [],
    })),
  });
  const groups = [
    { category: node("few", 1) },
    { category: node("many", 4) },
    { category: node("same", 4) },
  ];
  assert.deepEqual(sortMenuGroupsByChildren(groups).map(({ category }) => category.id), ["many", "same", "few"]);
});
