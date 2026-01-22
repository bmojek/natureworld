import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Heart, Truck, ShieldCheck } from "lucide-react";
import AddToCartButton from "@/app/components/AddButton";
import { Product } from "@/app/models/product";

/* ================= API ================= */

async function fetchProduct(slug: string) {
  const h = await headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/product?slug=${slug}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;
  return res.json();
}

/* ================= PAGE ================= */

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product: Product = await fetchProduct(slug);

  if (!product) {
    return (
      <div className="p-20 text-center text-text-secondary">
        Produkt nie znaleziony
      </div>
    );
  }

  const { attributes = {}, nutrition = {} } = product;

  return (
    <main className="bg-background">
      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* GALLERY */}
        <div>
          <div className="bg-white rounded-2xl p-6 flex items-center justify-center">
            <Image
              src={`/api/image/${product.images[0] + "_main.webp"}`}
              alt={product.name}
              width={520}
              height={520}
              priority
              className="object-contain"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className="w-20 h-20 bg-white  rounded-lg hover:border-primary transition flex items-center justify-center"
                >
                  <Image
                    src={`/api/image/${img + "_thumb.webp"}`}
                    alt={`${product.name} ${i + 1}`}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-4xl font-semibold text-text-main">
              {product.name}
            </h1>

            <button
              aria-label="Dodaj do ulubionych"
              className="p-2 rounded-full hover:bg-red-50 transition"
            >
              <Heart className="text-red-500" />
            </button>
          </div>

          {product.shortDescription && (
            <p className="text-text-secondary text-lg">
              {product.shortDescription}
            </p>
          )}

          <p className="text-3xl font-bold text-primary">
            {product.price.toFixed(2)} zł
          </p>

          <div className="text-sm">
            {product.stock > 0 ? (
              <span className="text-primary font-medium">
                ✔ Dostępny ({product.stock} szt.)
              </span>
            ) : (
              <span className="text-red-500 font-medium">
                ✖ Brak w magazynie
              </span>
            )}
          </div>

          <AddToCartButton product={product} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-text-secondary mt-4">
            <div className="flex gap-2 items-center">
              <Truck size={16} /> Wysyłka 24–48h
            </div>
            <div className="flex gap-2 items-center">
              <ShieldCheck size={16} /> Gwarancja jakości
            </div>
          </div>
        </div>
      </section>

      {/* ================= DETAILS ================= */}
      <section className="bg-white border-t">
        <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
          {/* DESCRIPTION */}
          {product.description && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Opis produktu</h2>
              <p className="text-text-secondary leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* ATTRIBUTES */}
          {Object.keys(attributes).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Specyfikacja</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {attributes.weightKg && (
                  <Spec label="Waga" value={`${attributes.weightKg} kg`} />
                )}
                {attributes.lengthCm && (
                  <Spec label="Długość" value={`${attributes.lengthCm} cm`} />
                )}
                {attributes.widthCm && (
                  <Spec label="Szerokość" value={`${attributes.widthCm} cm`} />
                )}
                {attributes.heightCm && (
                  <Spec label="Wysokość" value={`${attributes.heightCm} cm`} />
                )}
                {attributes.material && (
                  <Spec label="Materiał" value={attributes.material} />
                )}
                {attributes.flavor && (
                  <Spec label="Smak" value={attributes.flavor} />
                )}
                {attributes.ageGroup && (
                  <Spec label="Wiek" value={attributes.ageGroup} />
                )}
              </div>
            </div>
          )}

          {/* NUTRITION */}
          {Object.keys(nutrition).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Wartości odżywcze</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {nutrition.protein && (
                  <Spec label="Białko" value={`${nutrition.protein}%`} />
                )}
                {nutrition.fat && (
                  <Spec label="Tłuszcz" value={`${nutrition.fat}%`} />
                )}
                {nutrition.fiber && (
                  <Spec label="Błonnik" value={`${nutrition.fiber}%`} />
                )}
                {nutrition.ash && (
                  <Spec label="Popiół" value={`${nutrition.ash}%`} />
                )}
                {nutrition.moisture && (
                  <Spec label="Wilgotność" value={`${nutrition.moisture}%`} />
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ================= HELPERS ================= */

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-main">{value}</span>
    </div>
  );
}
