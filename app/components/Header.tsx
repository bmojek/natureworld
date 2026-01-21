"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Heart, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { useCart } from "@/app/context/cart-context";
import { useEffect, useRef, useState } from "react";
import Categories from "./Categories";
import MobileCategories from "./MobileCategories";

export default function Header() {
  const { user, logout } = useAuth();
  const cart = useCart();

  const [userOpen, setUserOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);

  /* ===== zamykanie dropdowna usera ===== */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* ================= HEADER TOP ================= */}
      <header className="shadow-md bg-background relative z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-3">
          {/* ===== MOBILE HAMBURGER ===== */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden cursor-pointer"
            aria-label="Menu"
          >
            <Menu size={28} />
          </button>

          {/* ===== LOGO ===== */}
          <Link href="/" className="shrink-0">
            <Image
              src="/api/image/logo.webp"
              alt="NatureWorld"
              width={180}
              height={45}
              priority
            />
          </Link>

          {/* ===== SEARCH (desktop) ===== */}
          <input
            type="text"
            placeholder="Szukaj produktów…"
            className="hidden md:block max-w-2xl mx-auto flex-1 bg-[#d2dad7] border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* ===== ICONS ===== */}
          <nav className="flex items-center gap-4 ml-auto relative">
            {/* USER */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="hover:text-primary cursor-pointer flex items-center"
                >
                  <User size={24} />
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border rounded-xl shadow-lg overflow-hidden">
                    <Link
                      href="/profil"
                      className="block px-4 py-3 text-sm hover:bg-gray-100"
                      onClick={() => setUserOpen(false)}
                    >
                      Profil
                    </Link>
                    <Link
                      href="/zamowienia"
                      className="block px-4 py-3 text-sm hover:bg-gray-100"
                      onClick={() => setUserOpen(false)}
                    >
                      Zamówienia
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Wyloguj
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hover:text-primary">
                <User size={24} />
              </Link>
            )}

            {/* FAVORITES */}
            <Link href="/ulubione" className="hover:text-primary">
              <Heart size={24} />
            </Link>

            {/* CART */}
            <Link href="/koszyk" className="relative hover:text-primary">
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

      {/* ================= DESKTOP CATEGORIES ================= */}
      <Categories />

      {/* ================= MOBILE DRAWER ================= */}
      {mobileMenuOpen && (
        <MobileCategories onClose={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
}
