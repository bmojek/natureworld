"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductRow from "@/app/components/ProductRow";
import PostsSnippet from "@/app/components/PostsSnippet";

/* ================= KARUZELA ================= */

const banners = ["baner.webp", "bilbord.webp", "banner-hero.webp"];

const demoProducts = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i),
  name: `Produkt ${i + 1}`,
  price: 19.99 + i,
  image: "logo.webp",
  slug: "przykladowy-produkt",
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
    <section className="relative w-full overflow-hidden">
      {/* ratio jak w sklepach */}
      <div className="relative w-full aspect-3/1 sm:aspect-5/2 md:aspect-16/5">
        {banners.map((img, i) => (
          <Image
            key={i}
            src={`/api/image/${img}`}
            alt="Banner"
            fill
            priority={i === 0}
            sizes="100vw"
            className={`
              object-contain
              absolute inset-0
              transition-opacity duration-700
              ${i === index ? "opacity-100" : "opacity-0"}
            `}
          />
        ))}
      </div>

      {/* dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-3 h-3 rounded-full ${
                i === index ? "bg-primary" : "border border-primary"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
/* ================= HOME ================= */

export default function Home() {
  return (
    <main>
      {/* FULL WIDTH BANNER */}
      <BannerCarousel />

      {/* CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 pt-10 space-y-16">
        {/* HERO */}
        <section className="flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl font-bold">
            Wszystko dla zwierząt i ogrodu 🌿
          </h1>

          <p className="text-text-secondary max-w-xl">
            Sklep zoologiczno-ogrodniczy – karma, akcesoria i naturalne
            rozwiązania
          </p>

          <div className="flex gap-4">
            <Link
              href="/kategoria/ogrod"
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold"
            >
              Ogród
            </Link>

            <Link
              href="/kategoria/zwierzeta"
              className="border px-6 py-3 rounded-full font-semibold"
            >
              Zwierzęta
            </Link>
          </div>
        </section>
        <PostsSnippet />
        {/* POLECANE */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Polecane produkty</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Link
                key={i}
                href="/produkt/przykladowy-produkt"
                className="border rounded-xl p-4 hover:shadow transition flex flex-col"
              >
                <div className="relative w-full aspect-square mb-3">
                  <Image
                    src="/api/image/logo.webp"
                    alt="Produkt"
                    fill
                    className="object-contain"
                  />
                </div>

                <p className="font-medium">Produkt {i}</p>

                <p className="text-text-secondary text-sm">99,00 zł</p>
              </Link>
            ))}
          </div>
        </section>

        <ProductRow
          title="Dla psa 🐶"
          href="/kategoria/psy"
          products={demoProducts}
        />

        <ProductRow
          title="Dla kota 🐱"
          href="/kategoria/koty"
          products={demoProducts}
        />

        <ProductRow
          title="Ogród 🌿"
          href="/kategoria/ogrodniczy"
          products={demoProducts}
        />

        {/* USP */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="border rounded-xl p-6">
            🚚
            <p className="font-semibold mt-2">Darmowa dostawa</p>
            <p className="text-sm text-text-secondary">od 99 zł</p>
          </div>

          <div className="border rounded-xl p-6">
            🔄
            <p className="font-semibold mt-2">30 dni na zwrot</p>
            <p className="text-sm text-text-secondary">bez problemu</p>
          </div>

          <div className="border rounded-xl p-6">
            🌿
            <p className="font-semibold mt-2">Naturalne produkty</p>
            <p className="text-sm text-text-secondary">dla zwierząt</p>
          </div>
        </section>
      </div>
    </main>
  );
}
