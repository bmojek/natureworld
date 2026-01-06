"use client";

import Link from "next/link";
import { ShoppingCart, User, Heart } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import Image from "next/image";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className=" shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between gap-4 items-center p-4">
        <Link href="/">
          <Image
            src="/api/image/logot.webp"
            alt="Logo NatureWorld"
            width={200}
            height={40}
            loading="eager"
          />
        </Link>
        <input
          type="text"
          placeholder="Szukaj produktów..."
          className="bg-[#d2dad7] border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-1/2"
        />
        {/* Menu */}
        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <button
                onClick={logout}
                className="text-secondary hover:text-text-main flex items-center gap-1 cursor-pointer"
              >
                <User size={25} />
                Wyloguj
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-secondary hover:text-text-main flex items-center gap-1"
            >
              <User size={25} />
            </Link>
          )}
          <Link
            href="/cart"
            className="text-secondary hover:text-text-main flex items-center gap-1"
          >
            <Heart size={25} />
          </Link>
          {/* Koszyk */}
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
