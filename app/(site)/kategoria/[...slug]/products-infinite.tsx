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
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [end, setEnd] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (loading || end) return;

    setLoading(true);

    const url = new URL("/api/products", window.location.origin);
    url.searchParams.set("categoryIds", categoryIds.join(","));
    if (cursor) url.searchParams.set("cursor", cursor.toString());

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.products.length === 0) {
      setEnd(true);
    } else {
      setProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        data.products.forEach((p: any) => map.set(p.id, p));
        return Array.from(map.values());
      });

      setCursor(data.cursor);
    }

    setLoading(false);
  };

  // 🔹 pierwsze ładowanie
  useEffect(() => {
    load();
  }, []);

  // 🔹 infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          load();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [sentinelRef.current, cursor, end]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <Link key={p.id} href={`/produkt/${p.slug}`} className="block">
            <div key={p.id} className="p-4  rounded-xl hover:shadow transition">
              {p.images[0] && (
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

      {/* sentinel */}
      {!end && (
        <div ref={sentinelRef} className="h-10 mt-10 flex justify-center">
          {loading && <p>Ładowanie...</p>}
        </div>
      )}
    </>
  );
}
