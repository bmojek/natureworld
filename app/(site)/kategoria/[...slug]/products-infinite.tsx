"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/app/models/product";

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <Link key={p.id} href={`/produkt/${p.slug}`}>
            <div className="border rounded-xl p-4 hover:shadow transition">
              {p.images?.[0] && (
                <Image
                  src={`/api/image/${p.images[0]}`}
                  alt={p.name}
                  width={200}
                  height={200}
                />
              )}
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-text-secondary">
                {p.price.toFixed(2)} zł
              </p>
            </div>
          </Link>
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
