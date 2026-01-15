"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductRow from "@/app/components/ProductRow";
/* ================= KARUZELA ================= */

const banners = ["banner-hero.webp", "logo.webp", "banner-hero.webp"]; // później możesz dodać więcej
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
    <section className="relative w-full h-50 sm:h-75 md:h-100 rounded-2xl overflow-hidden max-h-screen">
      {/* SLIDES */}
      {banners.map((img, i) => (
        <Image
          key={i}
          src={`/api/image/${img}`}
          alt="Banner"
          fill
          priority={i === 0}
          sizes="100vw"
          className={`
            object-cover absolute inset-0
            transition-opacity duration-700 ease-in-out
            ${i === index ? "opacity-100" : "opacity-0"}
          `}
        />
      ))}

      {/* KROPKI */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slajd ${i + 1}`}
              className={`
                w-3 h-3 rounded-full transition
                ${
                  i === index
                    ? "bg-primary"
                    : "border border-primary bg-transparent"
                }
              `}
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
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-16">
      {/* ================= KARUZELA ================= */}
      <BannerCarousel />

      {/* ================= HERO (TEKST POD BANEREM) ================= */}
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
            href="/kategoria/psy"
            className="bg-primary text-white px-6 py-3 rounded-full font-semibold"
          >
            Dla psa
          </Link>
          <Link
            href="/kategoria/promocje"
            className="border px-6 py-3 rounded-full font-semibold"
          >
            Promocje
          </Link>
        </div>
      </section>

      {/* ================= KATEGORIE ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Kategorie</h2>

        <div className="flex gap-4 overflow-x-auto sm:grid sm:grid-cols-5 sm:gap-6">
          {[
            { name: "Psy", slug: "psy" },
            { name: "Koty", slug: "koty" },
            { name: "Akwarystyka", slug: "akwarystyka" },
            { name: "Ptaki", slug: "ptaki" },
            { name: "Ogród", slug: "ogrodniczy" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/kategoria/${cat.slug}`}
              className="min-w-30 flex flex-col items-center gap-2 bg-white border rounded-xl p-4 hover:shadow transition"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full" />
              <span className="font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= POLECANE ================= */}
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
                  sizes="(max-width: 640px) 50vw, 25vw"
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
      {/* ================= USP ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="border rounded-xl p-6">
          🚚 <p className="font-semibold mt-2">Darmowa dostawa</p>
          <p className="text-sm text-text-secondary">od 99 zł</p>
        </div>
        <div className="border rounded-xl p-6">
          🔄 <p className="font-semibold mt-2">30 dni na zwrot</p>
          <p className="text-sm text-text-secondary">bez problemu</p>
        </div>
        <div className="border rounded-xl p-6">
          🌿 <p className="font-semibold mt-2">Naturalne produkty</p>
          <p className="text-sm text-text-secondary">dla zwierząt</p>
        </div>
      </section>
    </main>
  );
}
