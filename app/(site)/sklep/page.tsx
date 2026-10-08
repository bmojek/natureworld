"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryModel } from "@/app/models/category";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";

export default function Home() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => {
        if (!response.ok) throw new Error("Nie udało się pobrać kategorii");
        return response.json() as Promise<CategoryModel[]>;
      })
      .then((data) => setCategories(buildCategoryTree(data)))
      .catch(() => {
        setCategories([]);
        setCategoryError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      <section className="relative isolate overflow-hidden bg-[#173d2b] text-white">
        <Image
          src="/api/image/main_ogrod.webp"
          alt="Rośliny i produkty do ogrodu"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover opacity-35"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102c20] via-[#173d2b]/85 to-transparent" />
        <div className="mx-auto flex min-h-80 max-w-7xl flex-col justify-center px-6 py-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-lime-200">
            Nature World
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold md:text-5xl">
            Sklep dla domu, ogrodu i zwierząt
          </h1>
          <p className="mt-4 max-w-xl text-white/80">
            Przeglądaj działy i aktualne produkty dostępne w katalogu sklepu.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Oferta</p>
            <h2 className="mt-1 text-2xl font-semibold">Wybierz kategorię</h2>
          </div>
          <Link href="/aktualnosci" className="hidden items-center gap-2 text-sm font-medium hover:text-primary sm:flex">
            Aktualności <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse bg-black/5" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/sklep/kategoria/${category.slug}`}
                className="group flex min-h-28 items-center justify-between bg-white p-6 transition-colors hover:bg-[#f2f7ee]"
              >
                <span>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg font-semibold">{category.name}</span>
                  <span className="mt-1 block text-sm text-text-secondary">
                    {category.children.length > 0
                      ? `${category.children.length} działów`
                      : "Zobacz produkty"}
                  </span>
                </span>
                <ArrowRight className="text-primary transition-transform group-hover:translate-x-1" size={20} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-black/10 px-6 py-10 text-center">
            <Boxes className="mx-auto mb-3 text-primary" size={28} />
            <h3 className="font-semibold">
              {categoryError ? "Katalog Base jest chwilowo niedostępny" : "Brak kategorii w katalogu"}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {categoryError
                ? "Nie udało się pobrać kategorii. Spróbuj ponownie za chwilę."
                : "W Base nie ma jeszcze kategorii do wyświetlenia."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
