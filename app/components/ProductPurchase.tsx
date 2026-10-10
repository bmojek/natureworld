"use client";

import { useState } from "react";
import { Product } from "@/app/models/product";
import AddToCartButton from "@/app/components/AddButton";

export default function ProductPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const stock = Math.max(1, Math.floor(product.stock));
  const update = (value: number) => setQuantity(Math.min(stock, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1)));
  return <div className="w-full max-w-sm space-y-3">
    <label htmlFor="product-quantity" className="block text-sm font-medium text-[#304a37]">Ilość</label>
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Zmniejsz ilość" disabled={quantity <= 1} onClick={() => update(quantity - 1)} className="h-10 w-10 rounded-full border border-[#d8e1d4] text-lg disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-primary">−</button>
      <input id="product-quantity" type="number" inputMode="numeric" min={1} max={stock} value={quantity} onChange={(event) => update(Number(event.target.value))} className="h-10 w-20 rounded-lg border border-[#d8e1d4] text-center focus-visible:outline-2 focus-visible:outline-primary" />
      <button type="button" aria-label="Zwiększ ilość" disabled={quantity >= stock} onClick={() => update(quantity + 1)} className="h-10 w-10 rounded-full border border-[#d8e1d4] text-lg disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-primary">+</button>
      <span className="text-xs text-text-secondary">Dostępne: {product.stock}</span>
    </div>
    <AddToCartButton product={product} quantity={quantity} />
  </div>;
}
