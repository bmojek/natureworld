"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/app/context/cart-context";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  const deliveryCost = total >= 99 ? 0 : 15;
  const grandTotal = total + deliveryCost;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Twój koszyk jest pusty</h1>
        <Link href="/" className="text-primary underline">
          Wróć do zakupów
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-10">
      {/* ================= LEFT ================= */}
      <section className="flex-1 space-y-6">
        <h1 className="text-2xl font-bold">Koszyk</h1>

        {/* INFO */}
        <div className="bg-primary/10 rounded-xl p-4 text-sm">
          🚚 Darmowa dostawa od <strong>99 zł</strong>
        </div>

        {/* ITEMS */}
        <div className="bg-white rounded-xl divide-y">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 py-4 px-2"
            >
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
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-text-secondary">
                  {item.price.toFixed(2)} zł / szt.
                </p>
              </div>

              {/* QTY */}
              <div className="flex items-center gap-2 bg-bg-muted rounded-full px-3 py-1">
                <button
                  onClick={() => {
                    if (item.qty === 1) {
                      removeItem(item.productId);
                    } else {
                      updateQty(item.productId, item.qty - 1);
                    }
                  }}
                  className="text-text-main hover:text-primary"
                  aria-label="Zmniejsz ilość"
                >
                  {item.qty === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                </button>

                <span className="w-6 text-center">{item.qty}</span>

                <button
                  onClick={() => updateQty(item.productId, item.qty + 1)}
                  className="text-text-main hover:text-primary"
                  aria-label="Zwiększ ilość"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* PRICE */}
              <div className="w-24 text-right font-medium">
                {(item.price * item.qty).toFixed(2)} zł
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= RIGHT ================= */}
      <aside className="w-full lg:w-96 bg-bg-muted rounded-xl p-6 space-y-5 h-fit lg:sticky lg:top-24">
        <Link
          href="/checkout"
          className="block bg-primary hover:opacity-90 text-white text-center font-semibold py-3 rounded-full"
        >
          Przejdź do kasy
        </Link>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Suma</span>
            <span>{total.toFixed(2)} zł</span>
          </div>

          <div className="flex justify-between">
            <span>Dostawa</span>
            <span>
              {deliveryCost === 0 ? "Gratis" : `${deliveryCost.toFixed(2)} zł`}
            </span>
          </div>

          <div className="border-t pt-3 flex justify-between font-semibold text-lg">
            <span>Razem</span>
            <span>{grandTotal.toFixed(2)} zł</span>
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Ceny zawierają podatek VAT
        </p>
      </aside>
    </main>
  );
}
