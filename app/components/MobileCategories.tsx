"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { categoryHasMenuProducts, markConfirmedProductCategories, resolveStorefrontDepartments } from "@/app/lib/storefront-categories";

export default function MobileCategories({ onClose }: { onClose: () => void }) {
  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const departments = resolveStorefrontDepartments(tree);
  useEffect(() => {
    getCategories().then((items) => {
      let confirmed: string[] = [];
      try {
        const parsed: unknown = JSON.parse(sessionStorage.getItem("natureworld:confirmed-category-ids") ?? "null");
        if (parsed && typeof parsed === "object") {
          const availability = parsed as { expiresAt?: unknown; categoryIds?: unknown };
          if (typeof availability.expiresAt === "number" && availability.expiresAt > Date.now() && Array.isArray(availability.categoryIds)) confirmed = availability.categoryIds.filter((id: unknown): id is string => typeof id === "string" && /^\d+$/.test(id));
        }
      } catch { /* Use server-known availability. */ }
      setTree(markConfirmedProductCategories(buildCategoryTree(items), confirmed));
    }).catch(() => {
      // Preserve the current navigation if the category request fails.
    });
    const onProducts = (event: Event) => {
      const detail = (event as CustomEvent<{ categoryIds?: unknown }>).detail;
      const ids = Array.isArray(detail?.categoryIds) ? detail.categoryIds.filter((id): id is string => typeof id === "string" && /^\d+$/.test(id)) : [];
      setTree((current) => markConfirmedProductCategories(current, ids));
    };
    window.addEventListener("natureworld:catalog-products-loaded", onProducts);
    return () => window.removeEventListener("natureworld:catalog-products-loaded", onProducts);
  }, []);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const renderCategory = (category: CategoryTree, prefix: string[]) => {
    const path = [...prefix, category.slug];
    return <li key={category.id} className="min-w-0 py-1">
      <Link href={`/sklep/kategoria/${path.join("/")}`} onClick={onClose} className="block break-words rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-[#f3f6ef] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{category.name}</Link>
    </li>;
  };

  return <div className="fixed inset-0 z-[65] overflow-hidden bg-black/45 md:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section id="mobile-storefront-menu" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title" className="absolute inset-y-0 left-0 flex w-[min(90vw,25rem)] max-w-full flex-col overflow-x-hidden bg-background p-4 shadow-2xl">
      <div className="mb-5 flex shrink-0 items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Nature-World</p><h2 id="mobile-menu-title" className="mt-1 text-xl font-semibold">Działy sklepu</h2></div><button ref={closeRef} aria-label="Zamknij menu" onClick={onClose} className="rounded-full p-2 hover:bg-[#edf3e9] focus-visible:outline-2 focus-visible:outline-primary"><X /></button></div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto overscroll-contain">{departments.map((department) => {
        const roots = department.roots.filter(({ category }) => categoryHasMenuProducts(category));
        return <li key={department.slug} className="min-w-0 overflow-hidden rounded-2xl bg-[#f3f6ef]">
          <div className="flex min-w-0 items-center"><Link href={department.href} onClick={onClose} className="flex min-h-14 min-w-0 flex-1 items-center break-words px-4 text-sm font-bold tracking-[0.12em] text-[#173d2b] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{department.label}</Link><button aria-label={`${open === department.slug ? "Zwiń" : "Rozwiń"} ${department.label}`} aria-expanded={open === department.slug} onClick={() => setOpen((value) => value === department.slug ? null : department.slug)} className="mr-2 shrink-0 rounded-full p-3 hover:bg-white focus-visible:outline-2 focus-visible:outline-primary"><ChevronDown size={18} className={`transition-transform ${open === department.slug ? "rotate-180" : ""}`} /></button></div>
          {open === department.slug && <div className="min-w-0 border-t border-[#dfe7d8] bg-white px-3 py-2">{roots.length ? <ul>{roots.map(({ category, slugPath }) => <li key={category.id} className="min-w-0 border-b border-black/5 py-1 last:border-0"><Link href={`/sklep/kategoria/${slugPath.join("/")}`} onClick={onClose} className="inline-flex max-w-full items-center gap-1 break-words px-3 py-2 text-sm font-semibold text-[#173d2b] hover:text-primary">{category.name}<ChevronRight size={15} className="shrink-0" /></Link>{category.children.filter(categoryHasMenuProducts).length > 0 && <ul className="ml-1">{category.children.filter(categoryHasMenuProducts).map((child) => renderCategory(child, slugPath))}</ul>}</li>)}</ul> : <p className="px-3 py-3 text-sm text-text-secondary">Brak kategorii w tym dziale.</p>}<Link href={department.href} onClick={onClose} className="mt-2 block rounded-lg bg-[#edf3e9] px-4 py-3 text-center text-sm font-semibold text-[#173d2b] focus-visible:outline-2 focus-visible:outline-primary">Cały dział</Link></div>}
        </li>;
      })}</ul>
    </section>
  </div>;
}
