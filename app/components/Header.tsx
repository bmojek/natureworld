"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Heart, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { useCart } from "@/app/context/cart-context";
import { useEffect, useRef, useState } from "react";
import Categories from "./Categories";
import MobileCategories from "./MobileCategories";
import { searchProducts } from "@/app/lib/search";

export default function Header() {
  const { user, logout } = useAuth();
  const cart = useCart();

  const [userOpen, setUserOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const adminAccounts =
    process.env.NEXT_PUBLIC_ADMINACCOUNTS?.split(",").map((e) => e.trim()) ??
    [];

  const isAdmin = adminAccounts.includes(user?.email ?? "");

  /* ===== CLOSE DROPDOWNS ===== */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ===== SEARCH ===== */
  useEffect(() => {
    const trimmed = query.trim();

    // 🔥 MIN 3 ZNAKI
    if (trimmed.length < 3) {
      setResults([]);
      setSearchOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchProducts(trimmed);
      setResults(res);
      setSearchOpen(true);
      setLoading(false);
    }, 300);
  }, [query]);
  return (
    <>
      <header className="shadow-md bg-background relative z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-3">
          {/* MOBILE */}
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden">
            <Menu size={28} />
          </button>

          {/* LOGO */}
          <Link href="/" className="shrink-0">
            <Image
              src="/api/image/logo.webp"
              alt="NatureWorld"
              width={180}
              height={45}
              priority
            />
          </Link>

          {/* SEARCH */}
          <div
            ref={searchRef}
            className="hidden md:flex flex-1 max-w-2xl mx-auto relative"
          >
            <div className="flex w-full border border-black/10 bg-background rounded-md overflow-hidden">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj produktów..."
                className="flex-1 px-3 py-2 text-sm outline-none"
              />

              <button className="px-3 border-l border-black/10">
                <Search size={18} />
              </button>
            </div>

            {/* RESULTS */}
            {searchOpen && (
              <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-xl z-50 max-h-96 overflow-auto">
                {loading && (
                  <div className="p-4 text-sm text-gray-500">Szukanie...</div>
                )}

                {!loading && results.length === 0 && (
                  <div className="p-4 text-sm text-gray-500">Brak wyników</div>
                )}

                {!loading &&
                  results.map((item) => (
                    <Link
                      key={item.id}
                      href={`/produkt/${item.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
                    >
                      <Image
                        src={`/api/image/${item.images?.[0] + "_thumb.webp"}`}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="object-contain rounded"
                      />

                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.price} zł
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* ICONS */}
          <nav className="flex items-center gap-4 ml-auto relative">
            {user ? (
              <div className="relative" ref={userRef}>
                <button onClick={() => setUserOpen(!userOpen)}>
                  <User size={24} />
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg border shadow-xl">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium">Moje konto</p>
                      <p className="text-xs truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profil"
                      onClick={() => setUserOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-50"
                    >
                      Profil
                    </Link>

                    <Link
                      href="/zamowienia"
                      onClick={() => setUserOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-50"
                    >
                      Zamówienia
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/adminpanel"
                        onClick={() => setUserOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-50"
                      >
                        Panel admina
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Wyloguj
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <User size={24} />
              </Link>
            )}

            <Link href="/ulubione">
              <Heart size={24} />
            </Link>

            <Link href="/koszyk" className="relative">
              {cart.items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.items.length}
                </span>
              )}
              <ShoppingCart size={24} />
            </Link>
          </nav>
        </div>
      </header>

      <Categories />

      {mobileMenuOpen && (
        <MobileCategories onClose={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
}
