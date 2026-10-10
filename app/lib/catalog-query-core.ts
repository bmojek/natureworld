export type CatalogSort = "relevance" | "price-asc" | "price-desc" | "name-asc";

export type CatalogQuery = {
  sort: CatalogSort;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
};

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery | null {
  const rawSort = params.get("sort") ?? "relevance";
  if (!["relevance", "price-asc", "price-desc", "name-asc"].includes(rawSort)) return null;

  const parsePrice = (key: string) => {
    const raw = params.get(key);
    if (raw === null || raw === "") return undefined;
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 && value <= 1_000_000_000 ? value : null;
  };
  const minPrice = parsePrice("minPrice");
  const maxPrice = parsePrice("maxPrice");
  if (minPrice === null || maxPrice === null || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) return null;
  const stock = params.get("stock");
  if (stock !== null && stock !== "1") return null;

  return { sort: rawSort as CatalogSort, minPrice, maxPrice, inStock: stock === "1" };
}

export type CatalogRecord = { id: number; name: string; price: number; stock: number };

export function expandCategorySelection<T extends { id: string; parentId: string | null }>(categories: T[], selectedIds: string[], allowedIds: string[]) {
  const allowed = new Set(allowedIds);
  const expanded = new Set(selectedIds.filter((id) => allowed.has(id)));
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && expanded.has(category.parentId) && allowed.has(category.id) && !expanded.has(category.id)) {
        expanded.add(category.id);
        changed = true;
      }
    }
  }
  return [...expanded].sort((left, right) => Number(left) - Number(right));
}

export function catalogUrlForState(currentUrl: string, state: { search?: string; sort: CatalogSort; minPrice?: number | string; maxPrice?: number | string; inStock: boolean; categories?: string[] }) {
  const url = new URL(currentUrl, "http://localhost");
  for (const key of ["search", "sort", "minPrice", "maxPrice", "stock", "categories", "cursor"]) url.searchParams.delete(key);
  if (state.search?.trim()) url.searchParams.set("search", state.search.trim());
  if (state.sort !== "relevance") url.searchParams.set("sort", state.sort);
  if (state.minPrice !== undefined && state.minPrice !== "") url.searchParams.set("minPrice", String(state.minPrice));
  if (state.maxPrice !== undefined && state.maxPrice !== "") url.searchParams.set("maxPrice", String(state.maxPrice));
  if (state.inStock) url.searchParams.set("stock", "1");
  if (state.categories?.length) url.searchParams.set("categories", [...state.categories].sort().join(","));
  return `${url.pathname}${url.search}`;
}

export function queryCatalogRecords<T extends CatalogRecord>(records: T[], query: CatalogQuery): T[] {
  const filtered = records.filter((product) =>
    (query.minPrice === undefined || product.price >= query.minPrice) &&
    (query.maxPrice === undefined || product.price <= query.maxPrice) &&
    (!query.inStock || product.stock > 0),
  );
  if (query.sort === "price-asc") filtered.sort((a, b) => a.price - b.price || a.id - b.id);
  if (query.sort === "price-desc") filtered.sort((a, b) => b.price - a.price || a.id - b.id);
  if (query.sort === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name, "pl") || a.id - b.id);
  if (query.sort === "relevance") filtered.sort((a, b) => a.id - b.id);
  return filtered;
}

export function pageCatalogRecords<T>(records: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return records.slice(start, start + pageSize);
}
