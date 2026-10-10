"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Menu, Search, ShoppingCart, ShieldCheck, User, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { useCart } from "@/app/context/cart-context";
import Categories from "./Categories";
import MobileCategories from "./MobileCategories";
import { searchProducts } from "@/app/lib/search";
import { Product } from "@/app/models/product";
import { getProductImageUrl } from "@/app/lib/product-images";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const cart = useCart();
  const [userOpen, setUserOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  const adminAccounts = process.env.NEXT_PUBLIC_ADMINACCOUNTS?.split(",").map((email) => email.trim()) ?? [];
  const isAdmin = adminAccounts.includes(user?.email ?? "");

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); setSearchOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchProducts(query.trim())); setSearchOpen(true); }
      finally { setLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const inside = desktopSearchRef.current?.contains(event.target as Node) || mobileSearchRef.current?.contains(event.target as Node);
      if (!inside) setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const sync = () => setQuery(new URLSearchParams(window.location.search).get("search") ?? "");
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (!userOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserOpen(false);
        userButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(`/sklep?search=${encodeURIComponent(value)}`);
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("natureworld:catalog-search", { detail: value })));
  };

  const searchBox = (className: string, mobile: boolean) => <div ref={mobile ? mobileSearchRef : desktopSearchRef} className={`relative ${className}`}>
    <form onSubmit={submitSearch} role="search" className="flex w-full overflow-hidden rounded-lg border border-black/15 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
      <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => { if (results.length) setSearchOpen(true); }} placeholder="Szukaj produktów…" aria-label="Szukaj produktów" className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none" />
      <button type="submit" aria-label="Szukaj" className="border-l border-black/10 px-3 text-primary hover:bg-[#f2f7ee] focus-visible:outline-2 focus-visible:outline-primary"><Search size={19} /></button>
    </form>
    {searchOpen && <div className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-96 overflow-auto rounded-lg border border-black/10 bg-white shadow-xl">
      {loading && <p className="p-4 text-sm text-text-secondary">Wyszukiwanie…</p>}
      {!loading && results.length === 0 && <p className="p-4 text-sm text-text-secondary">Brak podpowiedzi. Naciśnij Enter, aby zobaczyć wyniki.</p>}
      {results.map((item) => <Link key={item.id} href={`/sklep/produkt/${item.slug}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 p-3 hover:bg-[#f2f7ee] focus-visible:outline-2 focus-visible:outline-primary">
        <Image src={getProductImageUrl(item.images?.[0], "thumb")} alt={item.name} width={48} height={48} unoptimized className="rounded object-contain" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.name}</span><span className="text-xs text-text-secondary">{item.price} zł</span></span>
      </Link>)}
    </div>}
  </div>;

  return <>
    <header className="relative z-50 border-b border-black/10 bg-background shadow-sm md:z-[90]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-5">
        <button ref={menuButtonRef} type="button" aria-label="Otwórz menu kategorii" aria-expanded={mobileMenuOpen} aria-controls="mobile-storefront-menu" onClick={() => setMobileMenuOpen(true)} className="rounded p-2 text-primary hover:bg-[#edf3e9] focus-visible:outline-2 focus-visible:outline-primary md:hidden"><Menu /></button>
        <Link href="/" aria-label="Nature-World — strona główna" className="shrink-0"><Image src="/api/image/logo.webp" alt="Nature-World" width={170} height={43} priority className="h-auto w-[128px] sm:w-[160px]" /></Link>
        {searchBox("hidden min-w-0 flex-1 md:block", false)}
        <nav aria-label="Konto i koszyk" className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
          {user ? <div ref={userMenuRef} className="relative">
            <button ref={userButtonRef} type="button" aria-label="Menu konta" aria-haspopup="menu" aria-expanded={userOpen} onClick={() => setUserOpen((open) => !open)} className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${userOpen ? "border-primary/20 bg-[#edf3e9] text-primary" : "border-transparent text-primary hover:bg-[#edf3e9]"}`}><User aria-hidden="true" size={20} /></button>
            {userOpen && <div role="menu" aria-label="Menu konta" className="absolute right-0 top-full z-[100] mt-3 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dfe7d8] bg-white shadow-[0_20px_50px_-20px_rgba(23,61,43,.35)] ring-1 ring-black/5">
              <div className="bg-gradient-to-br from-[#f3f7ef] to-white p-4">
                <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#173d2b] text-white"><UserRound size={20} /></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Twoje konto</p><p className="mt-0.5 truncate text-sm font-semibold text-[#173d2b]" title={user.email ?? undefined}>{user.email}</p></div></div>
              </div>
              <div className="space-y-1 p-2">
                <Link role="menuitem" href="/sklep/profil" onClick={() => setUserOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#304a37] transition-colors hover:bg-[#f3f6ef] focus-visible:outline-2 focus-visible:outline-primary"><UserRound size={17} className="text-primary" />Profil</Link>
                {isAdmin && <Link role="menuitem" href="/adminpanel" onClick={() => setUserOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#304a37] transition-colors hover:bg-[#f3f6ef] focus-visible:outline-2 focus-visible:outline-primary"><LayoutDashboard size={17} className="text-primary" />Panel administratora<ShieldCheck size={15} className="ml-auto text-primary/70" /></Link>}
              </div>
              <div className="border-t border-black/5 p-2"><button role="menuitem" onClick={() => { logout(); setUserOpen(false); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600"><LogOut size={17} />Wyloguj</button></div>
            </div>}
          </div> : <Link href="/login" aria-label="Zaloguj się" className="rounded p-2 hover:bg-[#edf3e9] focus-visible:outline-2 focus-visible:outline-primary"><User /></Link>}
          <Link href="/sklep/koszyk" aria-label={`Koszyk${cart.items.length ? `, ${cart.items.length} produktów` : ""}`} className="relative rounded p-2 text-primary hover:bg-[#edf3e9] focus-visible:outline-2 focus-visible:outline-primary"><ShoppingCart />{cart.items.length > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-white">{cart.items.length}</span>}</Link>
        </nav>
      </div>
      {searchBox("mx-auto max-w-7xl px-4 pb-3 md:hidden", true)}
    </header>
    <Categories />
    {mobileMenuOpen && <MobileCategories onClose={closeMobileMenu} />}
  </>;
}
