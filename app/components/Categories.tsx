"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { categoryHasMenuProducts, getMenuCategoryChildren, markConfirmedProductCategories, resolveStorefrontDepartments, sortMenuGroupsByChildren, StorefrontDepartment } from "@/app/lib/storefront-categories";

function categoryHref(rootPath: string[], category: CategoryTree) {
  return `/sklep/kategoria/${[...rootPath, category.slug].join("/")}`;
}

function DepartmentMenu({ department, close }: { department: StorefrontDepartment; close: () => void }) {
  const roots = department.roots.filter(({ category }) => categoryHasMenuProducts(category));
  const groups = sortMenuGroupsByChildren(roots.flatMap(({ category, slugPath }) => {
    const children = getMenuCategoryChildren(category);
    return children.length
      ? children.map((child) => ({ category: child, parentPath: slugPath }))
      : [{ category, parentPath: slugPath.filter((_, index) => index < slugPath.length - 1) }];
  }));

  const renderChildren = (category: CategoryTree, parentPath: string[]) => {
    const children = getMenuCategoryChildren(category);
    if (!children.length) return null;
    return <ul className="mt-1 space-y-1">
      {children.map((child) => <li key={child.id} className="min-w-0">
        <Link href={categoryHref(parentPath, child)} onClick={close} className="block min-w-0 break-words rounded px-1.5 py-1 text-sm leading-5 text-gray-700 transition-colors hover:bg-[#f3f6ef] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{child.name}</Link>
      </li>)}
    </ul>;
  };

  return <>
    <section aria-label={`Wszystkie dostępne kategorie: ${department.label}`} className="min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-7xl columns-2 gap-x-6 px-5 py-4 sm:px-8 md:columns-3 lg:columns-4 lg:gap-x-8 xl:columns-5">
        {groups.map(({ category, parentPath }) => <section key={category.id} className="mb-6 inline-block w-full break-inside-avoid align-top">
          <Link href={categoryHref(parentPath, category)} onClick={close} className="block min-w-0 break-words border-b border-[#dfe7d8] pb-2 text-base font-semibold leading-6 text-[#173d2b] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{category.name}</Link>
          {renderChildren(category, [...parentPath, category.slug])}
        </section>)}
        {!groups.length && <p className="mb-4 block py-6 text-center text-sm text-text-secondary">Brak kategorii w tym dziale.</p>}
      </div>
    </section>
  </>;
}

export default function Categories() {
  const pathname = usePathname();
  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const departments = resolveStorefrontDepartments(tree);
  const selected = departments.find((item) => item.slug === active);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const scheduleClose = useCallback(() => {
    cancelScheduledClose();
    closeTimer.current = setTimeout(() => setActive(null), 180);
  }, [cancelScheduledClose]);

  const refreshTree = useCallback(() => {
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
      // Preserve the last rendered navigation if the refresh fails.
    });
  }, []);

  useEffect(() => {
    refreshTree();
    const onProducts = (event: Event) => {
      const detail = (event as CustomEvent<{ categoryIds?: unknown }>).detail;
      const ids = Array.isArray(detail?.categoryIds) ? detail.categoryIds.filter((id): id is string => typeof id === "string" && /^\d+$/.test(id)) : [];
      setTree((current) => markConfirmedProductCategories(current, ids));
    };
    window.addEventListener("natureworld:catalog-products-loaded", onProducts);
    return () => {
      window.removeEventListener("natureworld:catalog-products-loaded", onProducts);
      cancelScheduledClose();
    };
  }, [cancelScheduledClose, refreshTree]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && active) {
        setActive(null);
        triggerRefs.current.get(active)?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) setActive(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointerDown); };
  }, [active]);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? (index + 1) % departments.length : event.key === "ArrowLeft" ? (index - 1 + departments.length) % departments.length : -1;
    if (next >= 0) { event.preventDefault(); triggerRefs.current.get(departments[next].slug)?.focus(); }
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(departments[index].slug); }
  };

  return <nav ref={rootRef} aria-label="Działy sklepu" className="relative z-[60] hidden border-t border-black/10 bg-[#173d2b] text-white md:block" onMouseEnter={cancelScheduledClose} onMouseLeave={scheduleClose}>
    <ul className="mx-auto flex h-12 max-w-7xl items-stretch gap-1 px-4">
      {departments.map((department, index) => {
        const current = pathname === department.href || pathname.startsWith(`${department.href}/`) || department.roots.some(({ slugPath }) => pathname.startsWith(`/sklep/kategoria/${slugPath.join("/")}`));
        const expanded = active === department.slug;
        return <li key={department.slug} className={"group relative flex items-stretch rounded transition-colors hover:bg-white/10 after:absolute after:inset-x-5 after:bottom-0 after:h-0.5 after:origin-center after:transition-transform " + ((current || expanded) ? "text-lime-200 after:scale-x-100 after:bg-lime-200" : "text-white after:scale-x-0")} onMouseEnter={() => { cancelScheduledClose(); setActive(department.slug); }}>
          <Link href={department.href} aria-current={current ? "page" : undefined} onFocus={() => setActive(department.slug)} onClick={() => setActive(null)} className="flex h-full items-center rounded-l px-5 text-sm font-bold tracking-[0.12em] text-current transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white">{department.label}</Link>
          <button ref={(element) => { if (element) triggerRefs.current.set(department.slug, element); }} type="button" aria-label={"Pokaż podkategorie " + department.label} aria-expanded={expanded} aria-controls="storefront-megamenu" onFocus={() => setActive(department.slug)} onClick={() => { cancelScheduledClose(); setActive(department.slug); }} onKeyDown={(event) => moveFocus(event, index)} className="flex h-full items-center rounded-r px-2 text-current transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white"><ChevronDown size={15} className={"shrink-0 text-white/75 transition-transform " + (expanded ? "rotate-180" : "")} /></button>
        </li>;
      })}
    </ul>
    <div id="storefront-megamenu" aria-label={selected ? `Podkategorie ${selected.label}` : undefined} aria-hidden={!selected} className={`absolute inset-x-0 top-full z-[70] grid max-h-[calc(100dvh-10rem)] min-h-56 grid-rows-[auto_minmax(0,1fr)_auto] border-b border-black/10 bg-white text-gray-900 shadow-[0_20px_40px_-24px_rgba(0,0,0,.45)] transition-[opacity,transform,visibility] duration-150 ${selected ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`} onMouseEnter={cancelScheduledClose}>
      {selected && <DepartmentMenu department={selected} close={() => setActive(null)} />}
    </div>
  </nav>;
}
