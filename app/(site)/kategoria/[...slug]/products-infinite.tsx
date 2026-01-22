"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const [sort, setSort] = useState("newest");

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /* ================= LOAD ================= */

  const load = async (reset = false) => {
    if (loading) return;
    if (!reset && end) return;

    setLoading(true);

    const url = new URL("/api/products", window.location.origin);
    url.searchParams.set("categoryIds", categoryIds.join(","));
    url.searchParams.set("sort", sort);

    if (cursor && !reset) {
      url.searchParams.set("cursor", cursor);
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.products.length === 0) {
      setEnd(true);
    } else {
      setProducts((prev) => {
        if (reset) return data.products;

        const existingIds = new Set(prev.map((p) => p.id));

        const uniqueNew = data.products.filter(
          (p: Product) => !existingIds.has(p.id),
        );

        return [...prev, ...uniqueNew];
      });
      setCursor(data.cursor);
    }

    setLoading(false);
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    load(true);
  }, []);

  /* ================= SORT CHANGE ================= */

  useEffect(() => {
    setProducts([]);
    setCursor(null);
    setEnd(false);
    load(true);
  }, [sort]);

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
      {/* SORT */}
      <div className="mb-4 flex justify-end">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="newest">Najnowsze</option>
          <option value="price-asc">Cena rosnąco</option>
          <option value="price-desc">Cena malejąco</option>
        </select>
      </div>

      {/* PRODUCTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {!end && (
        <div ref={sentinelRef} className="h-10 mt-10 flex justify-center">
          {loading && <p>Ładowanie…</p>}
        </div>
      )}
    </>
  );
}
