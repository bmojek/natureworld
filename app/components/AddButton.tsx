"use client";

import { useCart } from "@/app/context/cart-context";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Product } from "@/app/models/product";

export default function AddToCartButton({ product, quantity = 1, compact = false }: { product: Product; quantity?: number; compact?: boolean }) {
  const { addItem, items } = useCart();
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const inCart = items.find((item) => item.productId === product.id)?.qty ?? 0;
  const limitReached = inCart >= product.stock;

  const handleAdd = () => {
    if (state !== "idle" || limitReached) return;

    setState("adding");

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      slug: product.slug,
      stock: product.stock,
      qty: Math.max(1, Math.floor(quantity)),
    });

    setTimeout(() => setState("added"), 300);
    setTimeout(() => setState("idle"), 1600);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={limitReached}
      className={`
        relative overflow-hidden
        w-full font-semibold
        bg-primary text-white
        flex items-center justify-center
        transition-colors duration-300
        hover:bg-[#24652a]
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-60
        ${compact ? "h-11 rounded-xl px-2 text-sm sm:h-12 sm:rounded-full sm:px-3" : "h-12 rounded-full px-4 text-sm"}
      `}
    >
      {/* SHINE */}
      <span
        className={`
          pointer-events-none absolute inset-0
          bg-linear-to-r from-transparent via-white/20 to-transparent
          transition-opacity duration-300
          ${state === "adding" ? "opacity-100 animate-shine" : "opacity-0"}
        `}
      />

      {/* IDLE */}
      <span
        className={`
          absolute inset-x-1 flex items-center justify-center gap-1.5 whitespace-nowrap
          transition-all duration-200
          ${state === "idle" ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        <ShoppingCart size={18} />
        {limitReached ? (compact ? "Limit w koszyku" : "Limit dostępny w koszyku") : (compact ? <><span className="sm:hidden">Do koszyka</span><span className="hidden sm:inline">Dodaj do koszyka</span></> : "Dodaj do koszyka")}
      </span>

      {/* ADDING */}
      <span
        className={`
          absolute inset-x-1 flex items-center justify-center gap-2
          transition-all duration-200
          ${state === "adding" ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        <ShoppingCart size={18} className="animate-pulse" />
      </span>

      {/* ADDED */}
      <span
        className={`
          absolute inset-x-1 flex items-center justify-center gap-2
          transition-all duration-300
          ${state === "added" ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        <Check size={18} />
        Dodano
      </span>
    </button>
  );
}
