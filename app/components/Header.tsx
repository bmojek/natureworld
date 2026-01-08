"use client";

import Link from "next/link";
import { ShoppingCart, User, Heart, LogOut } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // zamykanie po kliknięciu poza menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between gap-4 items-center p-4">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/api/image/logot.webp"
            alt="Logo NatureWorld"
            width={200}
            height={40}
            priority
          />
        </Link>

        {/* Search */}
        <input
          type="text"
          placeholder="Szukaj produktów..."
          className="bg-[#d2dad7] border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-1/2"
        />

        {/* Menu */}
        <nav className="flex items-center space-x-4 relative">
          {user ? (
            <div className="relative" ref={menuRef}>
              {/* User icon */}
              <button
                onClick={() => setOpen(!open)}
                className="text-secondary hover:text-text-main flex items-center gap-1 cursor-pointer"
              >
                <User size={25} />
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute z-100 right-0 mt-3 w-48 rounded-xl border bg-white shadow-lg overflow-hidden ">
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    Profil
                  </Link>
                  <Link
                    href="/zamowienia"
                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    Zamówienia
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
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
            <Link
              href="/login"
              className="text-secondary hover:text-text-main flex items-center gap-1"
            >
              <User size={25} />
            </Link>
          )}

          <button className="text-secondary hover:text-text-main flex items-center gap-1 cursor-pointer">
            <Heart size={25} />
          </button>

          <Link
            href="/cart"
            className="text-secondary hover:text-text-main flex items-center gap-1"
          >
            <ShoppingCart size={25} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
