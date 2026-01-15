"use client";

import { useCart } from "@/app/context/cart-context";

export default function AddToCartButton({ product }: { product: any }) {
  const { addItem } = useCart();

  return (
    <button
      onClick={() =>
        addItem({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          qty: 1,
        })
      }
      className="bg-primary text-white px-8 py-4 rounded-full font-semibold cursor-pointer hover:opacity-90 transition"
    >
      Dodaj do koszyka
    </button>
  );
}
