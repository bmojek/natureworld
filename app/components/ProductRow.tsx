"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
};

export default function ProductRow({
  title,
  products,
  href,
}: {
  title: string;
  products: Product[];
  href: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* ================= SCROLL STATE ================= */

  const updateScrollState = () => {
    if (!ref.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = ref.current;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    updateScrollState();
    const el = ref.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  /* ================= SCROLL ACTION ================= */

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;

    const { clientWidth } = ref.current;

    ref.current.scrollBy({
      left: dir === "left" ? -clientWidth : clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>

        <Link
          href={href}
          className="text-sm text-primary font-medium hover:underline"
        >
          Zobacz wszystkie →
        </Link>
      </div>

      {/* ================= ROW ================= */}
      <div className="relative">
        {/* ← */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10
                       w-10 h-10 rounded-full bg-white shadow
                       items-center justify-center hover:scale-105 transition"
          >
            ←
          </button>
        )}

        {/* → */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10
                       w-10 h-10 rounded-full bg-white shadow
                       items-center justify-center hover:scale-105 transition"
          >
            →
          </button>
        )}

        {/* ================= PRODUCTS ================= */}
        <div
          ref={ref}
          className="
            flex gap-4 overflow-x-auto scroll-smooth
            pb-2
            [&::-webkit-scrollbar]:hidden
            [-ms-overflow-style:none]
            [scrollbar-width:none]
          "
        >
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/produkt/${p.slug}`}
              className="
                min-w-40 sm:min-w-45 lg:min-w-50
                bg-white border rounded-lg p-4
                hover:shadow transition
              "
            >
              <div className="relative w-full aspect-square mb-3">
                <Image
                  src={`/api/image/${p.image}`}
                  alt={p.name}
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>

              <p className="font-medium text-sm leading-tight line-clamp-2">
                {p.name}
              </p>

              <p className="text-primary font-semibold mt-1">
                {p.price.toFixed(2)} zł
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
