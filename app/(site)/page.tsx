"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductRow from "@/app/components/ProductRow";
import PostsSnippet from "@/app/components/PostsSnippet";
import { Product } from "@/app/models/product";
/* ================= KARUZELA ================= */

const banners = ["bilbordsharp.webp", "banerwide2.webp"];

const demoProducts: Product[] = Array.from({ length: 4 }).map((_, i) => ({
  id: String(i),

  name: `Produkt ${i + 1}`,

  slug: "przykladowy-produkt",

  price: 19.99 + i,

  images: ["grabki-szerokie-113x392-cm-geolia-n1_0"],

  categoryIds: [],

  stock: 10,

  isActive: true,

  createdAt: new Date(),
}));

function BannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative w-full aspect-3/1 sm:aspect-5/2 md:aspect-16/5">
        {banners.map((img, i) => (
          <Image
            key={i}
            src={`/api/image/${img}`}
            alt="Banner"
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-contain absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

/* ================= HOME ================= */

export default function Home() {
  return (
    <main>
      {/* ===== BANNER ===== */}

      <BannerCarousel />

      {/* ===== CONTENT ===== */}

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {/* ================= HERO ================= */}

        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Wszystko dla zwierząt i ogrodu
          </h1>

          <p className="text-text-secondary max-w-2xl mx-auto">
            Sklep zoologiczno-ogrodniczy – karma, akcesoria, nawozy, rośliny i
            naturalne rozwiązania dla domu i ogrodu
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/kategoria/ogrod"
              className="bg-primary text-white px-6 py-3 font-medium"
            >
              Ogród
            </Link>

            <Link
              href="/kategoria/zwierzeta"
              className="border px-6 py-3 font-medium"
            >
              Zwierzęta
            </Link>
          </div>
        </section>

        {/* ================= NEWS ================= */}

        <PostsSnippet />

        {/* ================= FEATURED ================= */}

        <ProductRow
          title="Promocje"
          href="/kategoria/promocje"
          products={demoProducts}
        />

        {/* ================= ROWS ================= */}

        <ProductRow
          title="Dla psa"
          href="/kategoria/psy"
          products={demoProducts}
        />

        <ProductRow
          title="Dla kota"
          href="/kategoria/koty"
          products={demoProducts}
        />

        <ProductRow
          title="Ogród"
          href="/kategoria/ogrodniczy"
          products={demoProducts}
        />

        {/* ================= USP ================= */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center border-t pt-10">
          <div>
            <p className="text-lg font-semibold">Darmowa dostawa</p>
            <p className="text-sm text-text-secondary">od 99 zł</p>
          </div>

          <div>
            <p className="text-lg font-semibold">30 dni na zwrot</p>
            <p className="text-sm text-text-secondary">bez problemu</p>
          </div>

          <div>
            <p className="text-lg font-semibold">Naturalne produkty</p>
            <p className="text-sm text-text-secondary">dla zwierząt i ogrodu</p>
          </div>
        </section>
      </div>
    </main>
  );
}
