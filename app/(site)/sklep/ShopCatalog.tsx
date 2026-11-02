"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryModel } from "@/app/models/category";
import { buildCategoryTree } from "@/app/lib/categories";
import { resolveStorefrontDepartments, StorefrontDepartment } from "@/app/lib/storefront-categories";
import ProductsInfinite from "./kategoria/[...slug]/products-infinite";

export default function Home() {
  const [departments, setDepartments] = useState<StorefrontDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const readSearch = () => setSearchQuery(new URLSearchParams(window.location.search).get("search") ?? "");
    const receiveSearch = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (typeof value === "string") setSearchQuery(value);
    };
    readSearch();
    window.addEventListener("popstate", readSearch);
    window.addEventListener("natureworld:catalog-search", receiveSearch);
    return () => { window.removeEventListener("popstate", readSearch); window.removeEventListener("natureworld:catalog-search", receiveSearch); };
  }, []);
  useEffect(() => {
    if (searchQuery) return;
    fetch("/api/categories", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Categories unavailable"); return response.json() as Promise<CategoryModel[]>; })
      .then((data) => { setDepartments(resolveStorefrontDepartments(buildCategoryTree(data))); setCategoryError(false); })
      .catch(() => { setCategoryError(true); })
      .finally(() => setLoading(false));
  }, [searchQuery]);

  return <main className="min-h-screen">
    {!searchQuery && <section className="relative isolate overflow-hidden bg-[#173d2b] text-white">
      <Image src="/api/image/main_ogrod.webp" alt="Rośliny i produkty ogrodowe" fill priority sizes="100vw" className="-z-20 object-cover opacity-35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102c20] via-[#173d2b]/85 to-transparent" />
      <div className="mx-auto flex min-h-72 max-w-7xl flex-col justify-center px-6 py-14 md:min-h-80">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200"><Leaf size={15} />Nature-World</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">Wybierz swój dział</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 md:text-base">Przeglądaj katalog według kategorii dostępnych w Nature-World.</p>
      </div>
    </section>}
    {searchQuery ? <section className="mx-auto min-h-[55vh] max-w-7xl px-4 py-9 md:px-6 md:py-12"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Wyniki wyszukiwania</p><h1 className="mb-7 mt-2 text-2xl font-semibold md:text-3xl">„{searchQuery}”</h1><ProductsInfinite categoryIds={[]} /></section> : <section className="mx-auto max-w-7xl px-4 py-9 md:px-6 md:py-12">
      <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Nawigacja katalogu</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#173d2b] md:text-3xl">Znajdź to, czego potrzebujesz</h2></div>
      {loading ? <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-3xl bg-[#edf1e9]" />)}</div> : categoryError && departments.length === 0 ? <div className="rounded-3xl bg-[#f3f6ef] px-6 py-12 text-center"><Boxes className="mx-auto mb-3 text-primary" size={30} /><h3 className="font-semibold">Katalog chwilowo niedostępny</h3><p className="mt-2 text-sm text-text-secondary">Nie udało się pobrać kategorii z Base.com. Spróbuj ponownie za chwilę.</p></div> : <div className="grid gap-4 md:grid-cols-3">{departments.map((department, index) => <Link key={department.slug} href={department.href} className="group relative flex min-h-52 flex-col justify-between overflow-hidden rounded-3xl bg-[#f3f6ef] p-6 transition duration-300 hover:-translate-y-1 hover:bg-[#eaf0e5] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-primary md:min-h-64 md:p-7"><span aria-hidden="true" className="absolute -right-8 -top-8 h-36 w-36 rounded-full border-[22px] border-white/50 transition-transform duration-500 group-hover:scale-110" /><span className="relative"><span className="text-xs font-semibold tracking-[0.16em] text-primary">0{index + 1}</span><span className="mt-3 block text-2xl font-bold tracking-wide text-[#173d2b]">{department.label}</span><span className="mt-2 block max-w-xs text-sm leading-6 text-gray-600">{department.description}</span>{department.roots.length > 0 && <span className="mt-4 block text-xs text-gray-500">{department.roots.map(({ category }) => category.name).join(" · ")}</span>}</span><span className="relative mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#173d2b] shadow-sm">Przeglądaj dział<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span></Link>)}</div>}
    </section>}
    {!searchQuery && <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6" aria-label="Wszystkie produkty">
      <div className="mb-6 flex flex-col gap-3 border-t border-black/5 pt-9 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pełny katalog</p><h2 className="mt-1 text-2xl font-semibold text-[#173d2b] md:text-3xl">Wszystkie produkty</h2></div>
        <Link href="#produkty" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">Przejdź do katalogu <ArrowRight size={16} /></Link>
      </div>
      <div id="produkty"><ProductsInfinite categoryIds={[]} /></div>
    </section>}
  </main>;
}
