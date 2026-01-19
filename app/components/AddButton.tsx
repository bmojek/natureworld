"use client";

import { useCart } from "@/app/context/cart-context";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

export default function AddToCartButton({ product }: { product: any }) {
  const { addItem } = useCart();
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  const handleAdd = () => {
    if (state !== "idle") return;

    setState("adding");

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      qty: 1,
    });

    setTimeout(() => setState("added"), 300);
    setTimeout(() => setState("idle"), 1600);
  };

  return (
    <button
      onClick={handleAdd}
      className="
        relative overflow-hidden
        h-14 px-8
        rounded-full font-semibold
        bg-primary text-white
        flex items-center justify-center
        transition-colors duration-300
        hover:bg-primary/90
        active:scale-[0.99]
      "
    >
      <span className="invisible flex items-center gap-2">
        <ShoppingCart size={18} />
        Dodaj do koszyka
      </span>

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
          absolute flex items-center gap-2
          transition-all duration-200
          ${state === "idle" ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        <ShoppingCart size={18} />
        Dodaj do koszyka
      </span>

      {/* ADDING */}
      <span
        className={`
          absolute flex items-center gap-2
          transition-all duration-200
          ${state === "adding" ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        <ShoppingCart size={18} className="animate-pulse" />
      </span>

      {/* ADDED */}
      <span
        className={`
          absolute flex items-center gap-2
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
