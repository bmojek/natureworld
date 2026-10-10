"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Product } from "@/app/models/product";
import ProductCard from "@/app/components/ProductCard";
import { shouldContinueProductScroll } from "@/app/lib/base-store-core";
import { catalogUrlForState, CatalogSort } from "@/app/lib/catalog-query-core";

type CatalogState = { search: string; sort: CatalogSort; minPrice: string; maxPrice: string; inStock: boolean; categories: string[] };
type CategoryOption = { id: string; name: string };
const defaultState: CatalogState = { search: "", sort: "relevance", minPrice: "", maxPrice: "", inStock: false, categories: [] };
const sortValues: CatalogSort[] = ["relevance", "price-asc", "price-desc", "name-asc"];
const noCategoryIds: string[] = [];

function stateFromUrl(): CatalogState {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get("sort") as CatalogSort | null;
  return {
    search: params.get("search") ?? "",
    sort: sort && sortValues.includes(sort) ? sort : "relevance",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    inStock: params.get("stock") === "1",
    categories: params.get("categories")?.split(",").filter(Boolean) ?? [],
  };
}

function priceRangeIsValid(state: CatalogState) {
  const min = state.minPrice === "" ? undefined : Number(state.minPrice);
  const max = state.maxPrice === "" ? undefined : Number(state.maxPrice);
  return !((min !== undefined && (!Number.isFinite(min) || min < 0)) || (max !== undefined && (!Number.isFinite(max) || max < 0)) || (min !== undefined && max !== undefined && min > max));
}

export default function ProductsInfinite({ categoryIds = noCategoryIds, categoryPath, departmentSlug, categoryOptions = [] }: { categoryIds?: string[]; categoryPath?: string[]; departmentSlug?: string; categoryOptions?: CategoryOption[] }) {
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState(defaultState);
  const [draft, setDraft] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [end, setEnd] = useState(false);
  const [catalogUnavailable, setCatalogUnavailable] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterError, setFilterError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filterPanelRef = useRef<HTMLElement | null>(null);
  const filterCloseRef = useRef<HTMLButtonElement | null>(null);
  const loadingRef = useRef(false);
  const requestId = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const categoryPathValue = categoryPath?.join("/");

  useEffect(() => {
    const sync = () => {
      const next = stateFromUrl();
      setState(next); setDraft(next); setHydrated(true);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);

  const updateUrl = useCallback((next: CatalogState) => {
    window.history.pushState(null, "", catalogUrlForState(window.location.href, next));
    setState(next); setDraft(next); setFilterError("");
  }, []);

  const loadPage = useCallback(async (page: string | null, reset: boolean, query: CatalogState) => {
    const id = ++requestId.current;
    if (!priceRangeIsValid(query)) {
      setFilterError("Podaj poprawny zakres cen. Cena od nie może przekraczać ceny do.");
      setProducts([]); setCursor(null); setTotalCount(0); setEnd(true); setCatalogUnavailable(false); setLoading(false); loadingRef.current = false;
      return;
    }
    setFilterError(""); loadingRef.current = true; setLoading(true);
    if (reset) { setProducts([]); setCursor(null); setEnd(false); setCatalogUnavailable(false); setTotalCount(0); }

    const url = new URL("/api/products", window.location.origin);
    if (departmentSlug) url.searchParams.set("department", departmentSlug);
    else if (categoryPathValue) url.searchParams.set("categoryPath", categoryPathValue);
    else if (categoryIds.length) url.searchParams.set("categoryIds", categoryIds.join(","));
    if (query.search.trim()) url.searchParams.set("search", query.search.trim());
    if (query.sort !== "relevance") url.searchParams.set("sort", query.sort);
    if (query.minPrice) url.searchParams.set("minPrice", query.minPrice);
    if (query.maxPrice) url.searchParams.set("maxPrice", query.maxPrice);
    if (query.inStock) url.searchParams.set("stock", "1");
    if (query.categories.length) url.searchParams.set("categories", query.categories.join(","));
    if (page) url.searchParams.set("cursor", page);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error("Catalog request failed");
      const data = await response.json() as { products: Product[]; cursor: string | null; totalCount: number };
      if (id !== requestId.current) return;
      setProducts((current) => {
        if (reset) return data.products;
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...data.products.filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)))];
      });
      setCursor(data.cursor); setTotalCount(data.totalCount); setEnd(!shouldContinueProductScroll(data.cursor));
      const confirmedCategoryIds = [...new Set(data.products.filter((product) => product.stock > 0 && Number.isFinite(product.price) && product.price >= 0).flatMap((product) => product.categoryIds ?? []))];
      if (confirmedCategoryIds.length) {
        try { sessionStorage.setItem("natureworld:confirmed-category-ids", JSON.stringify({ categoryIds: confirmedCategoryIds, expiresAt: Date.now() + 30_000 })); } catch { /* Keep the in-page menu update. */ }
        window.dispatchEvent(new CustomEvent("natureworld:catalog-products-loaded", { detail: { categoryIds: confirmedCategoryIds } }));
      }
    } catch (error) {
      if (id === requestId.current && !(error instanceof DOMException && error.name === "AbortError")) { setCatalogUnavailable(true); setEnd(true); }
    } finally {
      if (id === requestId.current) { loadingRef.current = false; setLoading(false); }
    }
  }, [categoryIds, categoryPathValue, departmentSlug]);

  useEffect(() => { if (hydrated) void loadPage(null, true, state); }, [hydrated, state, loadPage]);
  useEffect(() => {
    if (!hydrated || !sentinelRef.current || end) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loadingRef.current && cursor) void loadPage(cursor, false, stateRef.current);
    }, { rootMargin: "250px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hydrated, cursor, end, loadPage]);
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    filterCloseRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobileFiltersOpen(false); return; }
      if (event.key !== "Tab" || !filterPanelRef.current) return;
      const controls = [...filterPanelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])')];
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileFiltersOpen]);

  const activeFilters = useMemo(() => [
    ...(state.minPrice ? [{ key: "minPrice", label: `Od ${state.minPrice} zł` }] : []),
    ...(state.maxPrice ? [{ key: "maxPrice", label: `Do ${state.maxPrice} zł` }] : []),
    ...(state.inStock ? [{ key: "stock", label: "Dostępne" }] : []),
    ...state.categories.map((id) => ({ key: `category:${id}`, label: categoryOptions.find((option) => option.id === id)?.name ?? "Podkategoria" })),
  ], [state, categoryOptions]);

  const apply = (event?: FormEvent) => {
    event?.preventDefault();
    if (!priceRangeIsValid(draft)) { setFilterError("Podaj poprawny zakres cen. Cena od nie może przekraczać ceny do."); return; }
    updateUrl(draft); setMobileFiltersOpen(false);
  };
  const clear = () => updateUrl({ ...state, minPrice: "", maxPrice: "", inStock: false, categories: [], sort: "relevance" });
  const removeFilter = (key: string) => {
    const next = { ...state };
    if (key === "minPrice") next.minPrice = "";
    else if (key === "maxPrice") next.maxPrice = "";
    else if (key === "stock") next.inStock = false;
    else next.categories = next.categories.filter((id) => `category:${id}` !== key);
    updateUrl(next);
  };

  const filters = <form onSubmit={apply} className="grid gap-5 md:grid-cols-[minmax(14rem,1fr)_minmax(13rem,1fr)_auto] md:items-end">
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm font-medium text-gray-700">Cena od<input inputMode="decimal" value={draft.minPrice} onChange={(event) => setDraft({ ...draft, minPrice: event.target.value })} className="mt-1.5 w-full rounded-xl border-0 bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-primary" placeholder="0 zł" /></label>
      <label className="text-sm font-medium text-gray-700">Cena do<input inputMode="decimal" value={draft.maxPrice} onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value })} className="mt-1.5 w-full rounded-xl border-0 bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-primary" placeholder="np. 100 zł" /></label>
    </div>
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={draft.inStock} onChange={(event) => setDraft({ ...draft, inStock: event.target.checked })} className="h-4 w-4 accent-primary" />Tylko dostępne</label>
      {categoryOptions.length > 0 && <details className="group relative"><summary className="cursor-pointer list-none text-sm font-medium text-gray-700">Podkategorie <span className="text-primary">({draft.categories.length})</span></summary><div className="absolute left-0 z-10 mt-2 max-h-56 w-72 space-y-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10">{categoryOptions.map((option) => <label key={option.id} className="flex cursor-pointer items-start gap-2 text-sm text-gray-700"><input type="checkbox" checked={draft.categories.includes(option.id)} onChange={(event) => setDraft({ ...draft, categories: event.target.checked ? [...draft.categories, option.id] : draft.categories.filter((id) => id !== option.id) })} className="mt-0.5 h-4 w-4 accent-primary" />{option.name}</label>)}</div></details>}
    </div>
    <button className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#24652a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Zastosuj filtry</button>
    {filterError && <p role="alert" className="text-sm text-red-700 md:col-span-full">{filterError}</p>}
  </form>;

  const skeletons = <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4" aria-label="Ładowanie produktów">{Array.from({ length: 8 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"><div className="aspect-[4/3] animate-pulse bg-[#edf1e9]" /><div className="space-y-3 p-4"><div className="h-3 w-1/3 animate-pulse rounded bg-[#edf1e9]" /><div className="h-4 w-full animate-pulse rounded bg-[#edf1e9]" /><div className="h-4 w-2/3 animate-pulse rounded bg-[#edf1e9]" /><div className="mt-5 h-10 animate-pulse rounded-full bg-[#edf1e9]" /></div></div>)}</div>;

  return <>
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-[#f3f6ef] p-3 sm:p-4">
      <div className="mr-auto"><p className="text-lg font-semibold text-[#173d2b]" aria-live="polite">{totalCount} produktów</p><p className="text-xs text-gray-500">w aktualnym widoku katalogu</p></div>
      <label className="flex items-center gap-2 text-sm font-medium">Sortuj:
        <select value={state.sort} onChange={(event) => updateUrl({ ...state, sort: event.target.value as CatalogSort })} className="max-w-[12rem] rounded-full border-0 bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-primary">
          <option value="relevance">Domyślne</option><option value="price-asc">Cena rosnąco</option><option value="price-desc">Cena malejąco</option><option value="name-asc">Nazwa A–Z</option>
        </select>
      </label>
      <button type="button" onClick={() => { setDraft(state); setMobileFiltersOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#173d2b] shadow-sm ring-1 ring-black/10 hover:bg-[#fbfcfa] focus-visible:outline-2 focus-visible:outline-primary md:hidden"><Filter size={17} />Filtry{activeFilters.length > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-white">{activeFilters.length}</span>}</button>
    </div>
    <aside className="mb-6 hidden rounded-2xl bg-[#f3f6ef] p-5 md:block"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-[#173d2b]">Filtry</h2><button onClick={clear} className="text-xs font-medium text-primary hover:underline">Wyczyść</button></div>{filters}</aside>
    {activeFilters.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-2">{activeFilters.map((filter) => <button key={filter.key} onClick={() => removeFilter(filter.key)} className="rounded-full bg-white px-3.5 py-2 text-sm text-[#173d2b] shadow-sm ring-1 ring-[#dfe7d8] hover:bg-[#edf3e9]">{filter.label}<span className="ml-1.5" aria-hidden="true">×</span></button>)}<button onClick={clear} className="px-2 py-2 text-sm font-semibold text-primary hover:underline">Wyczyść filtry</button></div>}
    {catalogUnavailable ? <div className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-950 ring-1 ring-amber-200">Nie udało się pobrać produktów z Base.com. Spróbuj ponownie za chwilę.</div> : loading && products.length === 0 ? skeletons : products.length ? <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : end ? <div className="rounded-3xl bg-[#f3f6ef] px-5 py-12 text-center"><p className="text-lg font-semibold text-[#173d2b]">Brak produktów pasujących do tych kryteriów</p><p className="mt-2 text-sm text-gray-600">Zmień zakres ceny lub dostępność, albo wyczyść filtry.</p><button onClick={clear} className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-[#24652a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Wyczyść filtry</button></div> : null}
    {!end && products.length > 0 && <div ref={sentinelRef} className="mt-10 flex h-10 justify-center">{loading && <p className="text-sm text-text-secondary">Ładowanie kolejnych produktów…</p>}</div>}
    {mobileFiltersOpen && <div className="fixed inset-0 z-[80] bg-black/45 md:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileFiltersOpen(false); }}><section ref={filterPanelRef} role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-5 shadow-2xl"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Katalog</p><h2 id="mobile-filter-title" className="mt-1 text-xl font-semibold">Filtry</h2></div><button ref={filterCloseRef} aria-label="Zamknij filtry" onClick={() => setMobileFiltersOpen(false)} className="rounded-full p-2 hover:bg-[#edf3e9] focus-visible:outline-2 focus-visible:outline-primary"><X /></button></div>{filters}<button onClick={clear} className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-primary hover:bg-[#f3f6ef]">Wyczyść filtry</button></section></div>}
  </>;
}
