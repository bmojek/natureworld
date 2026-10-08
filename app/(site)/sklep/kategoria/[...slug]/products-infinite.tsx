"use client";

import { useEffect, useRef, useState } from "react";
import { Product } from "@/app/models/product";
import ProductCard from "@/app/components/ProductCard";

export default function ProductsInfinite({
  categoryIds,
}: {
  categoryIds: string[];
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [end, setEnd] = useState(false);
  const [catalogUnavailable, setCatalogUnavailable] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /* ================= LOAD ================= */

  const load = async (reset = false) => {
    if (loading) return;
    if (!reset && end) return;

    setLoading(true);

    const url = new URL("/api/products", window.location.origin);
    url.searchParams.set("categoryIds", categoryIds.join(","));
    if (cursor && !reset) {
      url.searchParams.set("cursor", cursor);
    }

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        setCatalogUnavailable(true);
        setEnd(true);
        return;
      }

      const data = (await res.json()) as {
        products: Product[];
        cursor: string | null;
      };

      if (data.products.length === 0) {
        setEnd(true);
      } else {
        setProducts((prev) => {
          if (reset) return data.products;

          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = data.products.filter(
            (product) => !existingIds.has(product.id),
          );

          return [...prev, ...uniqueNew];
        });
        setCursor(data.cursor);
      }
    } catch {
      setCatalogUnavailable(true);
      setEnd(true);
    } finally {
      setLoading(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    load(true);
  }, []);

  /* ================= INFINITE SCROLL ================= */

  useEffect(() => {
    if (!sentinelRef.current || end) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load();
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, end]);

  return (
    <>
      {/* PRODUCTS */}
      {catalogUnavailable ? (
        <div className="border border-amber-300 bg-amber-50 p-6 text-sm text-amber-950">
          Nie udało się pobrać produktów z magazynu Base. Spróbuj ponownie za chwilę.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!catalogUnavailable && end && products.length === 0 && (
        <p className="mt-6 text-sm text-text-secondary">
          Brak produktów w tej kategorii.
        </p>
      )}

      {!end && (
        <div ref={sentinelRef} className="h-10 mt-10 flex justify-center">
          {loading && <p>Ładowanie…</p>}
        </div>
      )}
    </>
  );
}
