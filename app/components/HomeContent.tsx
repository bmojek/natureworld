"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, PackageOpen } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import HomeRadio from "@/app/components/HomeRadio";
import type { Product } from "@/app/models/product";
import type { CategoryModel } from "@/app/models/category";
import { buildCategoryTree, type CategoryTree } from "@/app/lib/categories";
import { resolveStorefrontDepartments } from "@/app/lib/storefront-categories";

function findCategoryPath(nodes: CategoryTree[], targetId: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node.slug];
    if (node.id === targetId) return nextPath;
    const nested = findCategoryPath(node.children, targetId, nextPath);
    if (nested) return nested;
  }
  return null;
}

export default function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [productState, setProductState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/products?cursor=1&suggestions=1&previewLimit=24", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json() as Promise<{ products?: Product[] }>;
      })
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data.products) ? data.products : [];
        setProducts(items);
        const categoryIds = [...new Set(items.filter((product) => product.stock > 0 && Number.isFinite(product.price) && product.price >= 0).flatMap((product) => product.categoryIds ?? []))];
        try { sessionStorage.setItem("natureworld:confirmed-category-ids", JSON.stringify({ categoryIds, expiresAt: Date.now() + 30_000 })); } catch { /* Availability can still be shared for this page view. */ }
        window.dispatchEvent(new CustomEvent("natureworld:catalog-products-loaded", { detail: { categoryIds } }));
      })
      .catch(() => { if (active) setProductState("error"); })
      .finally(() => { if (active) setProductState((state) => state === "error" ? state : "ready"); });
    fetch("/api/categories", { cache: "force-cache" })
      .then((response) => response.ok ? response.json() as Promise<CategoryModel[]> : [])
      .then((data) => { if (active && Array.isArray(data)) setCategories(data); })
      .catch(() => { /* Keep categories already rendered if refresh fails. */ });
    return () => { active = false; };
  }, []);

  const categoryShortcuts = useMemo(() => {
    const tree = buildCategoryTree(categories);
    const ids = [...new Set(products.filter((product) => product.stock > 0 && Number.isFinite(product.price) && product.price >= 0).flatMap((product) => product.categoryIds ?? []))];
    return ids.flatMap((id) => {
      const path = findCategoryPath(tree, id);
      if (!path) return [];
      const category = categories.find((item) => item.id === id);
      if (!category) return [];
      return [{ id, name: category.name, href: "/sklep/kategoria/" + path.join("/") }];
    }).slice(0, 6);
  }, [categories, products]);

  const departmentProducts = useMemo(() => {
    const departments = resolveStorefrontDepartments(buildCategoryTree(categories));
    const used = new Set(products.slice(0, 4).map((product) => product.id));
    return departments.map((department) => {
      const ids = new Set(department.categoryIds);
      const items = products.filter((product) => {
        if (used.has(product.id) || product.stock <= 0 || !Number.isFinite(product.price) || product.price < 0) return false;
        return (product.categoryIds ?? []).some((id) => ids.has(id));
      }).slice(0, 4);
      items.forEach((product) => used.add(product.id));
      return { ...department, items };
    }).filter((department) => department.items.length > 0);
  }, [categories, products]);

  return <>
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Z katalogu</p><h2 className="mt-2 text-3xl font-semibold text-[#173d2b]">Polecane produkty</h2><p className="mt-2 text-sm text-text-secondary">Wybrane pozycje z aktualnego katalogu Nature-World.</p></div><Link href="/sklep" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Zobacz wszystkie produkty <ArrowRight size={16} /></Link></div>
      {productState === "loading" && <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0,1,2,3].map((n) => <div key={n} className="h-80 animate-pulse rounded-2xl bg-[#edf1e9]" />)}</div>}
      {productState === "error" && <div role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-text-secondary"><PackageOpen className="mx-auto mb-3 text-primary" />Katalog jest chwilowo niedostępny. Spróbuj ponownie później.</div>}
      {productState === "ready" && products.length > 0 && <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      {productState === "ready" && products.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-sm text-text-secondary">Brak produktów do wyświetlenia.</div>}
    </section>

    <HomeRadio />

    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      {productState === "ready" && departmentProducts.map((department) => <section key={department.slug} className="mt-12 border-t border-[#dfe7d8] pt-8"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Dział Nature-World</p><h3 className="mt-2 text-2xl font-semibold text-[#173d2b]">{department.label}</h3></div><Link href={department.href} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">Cały dział <ArrowRight size={16} /></Link></div><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{department.items.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>)}
      {categoryShortcuts.length > 0 && <div className="mt-8"><h3 className="text-lg font-semibold text-[#173d2b]">Znajdź według kategorii</h3><div className="mt-3 flex flex-wrap gap-2">{categoryShortcuts.map((category) => <Link key={category.id} href={category.href} className="rounded-full border border-[#d8e1d4] bg-white px-4 py-2 text-sm font-medium text-[#304a37] transition hover:border-primary hover:bg-[#edf3e9]">{category.name}<ArrowRight aria-hidden="true" className="ml-2 inline" size={14} /></Link>)}</div></div>}
    </section>


  </>;
}
