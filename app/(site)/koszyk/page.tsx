"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/app/context/cart-context";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  const deliveryCost = total >= 99 ? 0 : 15;
  const grandTotal = total + deliveryCost;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <h1 className="text-2xl font-bold text-text-main mb-4">
          Twój koszyk jest pusty
        </h1>
        <Link href="/" className="text-primary underline">
          Wróć do zakupów
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-8">
      {/* ================= LEFT ================= */}

      <section className="flex-1 space-y-6">
        <h1 className="text-2xl font-bold text-text-main">
          Zawartość Twojego koszyka
        </h1>

        {/* INFO */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-text-main">
          🚚 Darmowa dostawa od <strong>99 zł</strong>
        </div>

        {/* ITEMS */}
        <div className="bg-white border border-border rounded-xl divide-y">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 p-4">
              {/* IMAGE */}
              <Image
                src={`/api/image/${item.image}`}
                alt={item.name}
                width={80}
                height={80}
                className="object-contain"
              />

              {/* NAME */}
              <div className="flex-1">
                <p className="font-medium text-text-main">{item.name}</p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-secondary hover:underline mt-1"
                >
                  Usuń
                </button>
              </div>

              {/* QTY */}
              <div className="flex items-center gap-2 bg-bg-muted rounded-full px-3 py-1">
                <button
                  onClick={() =>
                    updateQty(item.productId, Math.max(1, item.qty - 1))
                  }
                  className="text-text-main"
                >
                  <Minus size={16} />
                </button>

                <span className="w-6 text-center text-text-main">
                  {item.qty}
                </span>

                <button
                  onClick={() => updateQty(item.productId, item.qty + 1)}
                  className="text-text-main"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* PRICE */}
              <div className="w-24 text-right font-medium text-text-main">
                {(item.price * item.qty).toFixed(2)} zł
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= RIGHT ================= */}
      <aside className="w-full lg:w-90 bg-bg-muted border border-border rounded-xl p-6 space-y-4 h-fit lg:sticky lg:top-24">
        <Link
          href="/checkout"
          className="block bg-primary hover:opacity-90 text-white text-center font-semibold py-3 rounded-full"
        >
          Do kasy
        </Link>

        <div className="space-y-2 text-sm text-text-main">
          <div className="flex justify-between">
            <span>Suma</span>
            <span>{total.toFixed(2)} zł</span>
          </div>

          <div className="flex justify-between">
            <span>Koszt dostawy</span>
            <span>
              {deliveryCost === 0 ? "Gratis" : `${deliveryCost.toFixed(2)} zł`}
            </span>
          </div>

          <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
            <span>Cena razem</span>
            <span>{grandTotal.toFixed(2)} zł</span>
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Wszystkie ceny zawierają VAT
        </p>
      </aside>
    </main>
  );
}
