"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Newspaper, PackageOpen } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
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

type Post = { id: string; title: string; slug: string; excerpt?: string; images?: string[]; publishedAt?: number | string | { seconds?: number; _seconds?: number } };

function formatDate(value: Post["publishedAt"]) {
  const raw = typeof value === "object" && value ? (value.seconds ?? value._seconds) : value;
  if (!raw) return "";
  const date = new Date(typeof raw === "number" && raw < 10_000_000_000 ? raw * 1000 : raw);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pl-PL");
}

function newsHref(post: Post) {
  return "/aktualnosci#" + encodeURIComponent(post.slug);
}

export default function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
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
    fetch("/api/posts?type=news", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Post[]> : [])
      .then((data) => { if (active && Array.isArray(data)) setPosts(data.slice(0, 3)); })
      .catch(() => { if (active) setPosts([]); });
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

{posts.length > 0 && <section aria-labelledby="home-news-title" className="relative isolate overflow-hidden bg-[#173d2b] py-12 text-white md:py-16">
      <div aria-hidden="true" className="absolute -right-28 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full border-[64px] border-white/[0.04]" />
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5 md:mb-9">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-lime-200"><Newspaper size={15} />Ze sklepu</p>
            <h2 id="home-news-title" style={{ color: "#ffffff" }} className="mt-3 text-3xl font-semibold tracking-tight !text-white md:text-4xl">Aktualności i inspiracje</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Nowości i informacje od Nature-World.</p>
          </div>
          <Link href="/aktualnosci" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Wszystkie aktualności <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
          {posts[0] && <Link href={newsHref(posts[0])} className="group relative isolate flex min-h-[24rem] overflow-hidden rounded-[1.75rem] bg-[#102c20] p-6 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:min-h-[31rem] md:p-9">
            {posts[0].images?.[0] ? <Image src={"/api/image/" + encodeURIComponent(posts[0].images[0])} alt="" fill sizes="(min-width: 1024px) 65vw, 100vw" className="-z-20 object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <div aria-hidden="true" className="-z-20 absolute inset-0 bg-gradient-to-br from-[#527755] via-[#244b35] to-[#102c20]" />}
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#102c20]/95 via-[#102c20]/35 to-[#102c20]/5" />
            <div className="mt-auto max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85"><span className="rounded-full bg-lime-200 px-3 py-1 text-[#173d2b]">Wyróżniony wpis</span>{formatDate(posts[0].publishedAt) && <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{formatDate(posts[0].publishedAt)}</span>}</div>
              <h3 style={{ color: "#ffffff" }} className="mt-4 text-2xl font-semibold leading-tight !text-white md:text-4xl">{posts[0].title}</h3>
              {posts[0].excerpt && <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-white/80 md:text-base">{posts[0].excerpt}</p>}
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-lime-200">Czytaj aktualność <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {posts.slice(1).map((post, index) => <Link href={newsHref(post)} key={post.id} className="group flex min-h-32 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] transition hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-white">
              <div className="relative w-28 shrink-0 overflow-hidden bg-[#294d36] sm:w-32 lg:w-36">
                {post.images?.[0] ? <Image src={"/api/image/" + encodeURIComponent(post.images[0])} alt="" fill sizes="144px" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-lime-200"><Newspaper size={24} /></div>}
              </div>
              <div className="flex min-w-0 flex-col justify-center p-4">
                <p className="text-[11px] font-bold uppercase tracking-[.12em] text-lime-200">{formatDate(post.publishedAt) || "Aktualność " + String(index + 2).padStart(2, "0")}</p>
                <h3 style={{ color: "#ffffff" }} className="mt-2 line-clamp-2 font-semibold leading-5 !text-white group-hover:text-lime-100">{post.title}</h3>
                {post.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/65">{post.excerpt}</p>}
              </div>
            </Link>)}
          </div>
        </div>
      </div>
    </section>}

    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      {productState === "ready" && departmentProducts.map((department) => <section key={department.slug} className="mt-12 border-t border-[#dfe7d8] pt-8"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Dział Nature-World</p><h3 className="mt-2 text-2xl font-semibold text-[#173d2b]">{department.label}</h3></div><Link href={department.href} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">Cały dział <ArrowRight size={16} /></Link></div><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{department.items.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>)}
      {categoryShortcuts.length > 0 && <div className="mt-8"><h3 className="text-lg font-semibold text-[#173d2b]">Znajdź według kategorii</h3><div className="mt-3 flex flex-wrap gap-2">{categoryShortcuts.map((category) => <Link key={category.id} href={category.href} className="rounded-full border border-[#d8e1d4] bg-white px-4 py-2 text-sm font-medium text-[#304a37] transition hover:border-primary hover:bg-[#edf3e9]">{category.name}<ArrowRight aria-hidden="true" className="ml-2 inline" size={14} /></Link>)}</div></div>}
    </section>


  </>;
}
