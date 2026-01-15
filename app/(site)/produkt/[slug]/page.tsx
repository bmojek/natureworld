import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Truck, Leaf, ShieldCheck } from "lucide-react";
import AddToCartButton from "@/app/components/AddButton";

/* ---------------------------------- API --------------------------------- */

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

async function fetchSimilarProducts(categoryIds: string[]) {
  const h = await headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(
    `${protocol}://${host}/api/products?categories=${categoryIds.join(",")}`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) return [];
  return res.json();
}

/* --------------------------------- PAGE --------------------------------- */

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return (
      <div className="p-20 text-center text-text-secondary">
        Produkt nie znaleziony
      </div>
    );
  }

  const similarProducts = [
    {
      id: "mock-1",
      name: "Ekologiczny nawóz uniwersalny",
      slug: "ekologiczny-nawoz-uniwersalny",
      price: 29.99,
      images: ["logo.webp"],
    },
    {
      id: "mock-2",
      name: "Naturalna ziemia ogrodowa premium",
      slug: "naturalna-ziemia-ogrodowa-premium",
      price: 19.99,
      images: ["logo.webp"],
    },
  ];

  return (
    <main className="bg-background">
      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 gap-14">
        {/* GALLERY */}
        <div>
          <div className="bg-white  rounded-2xl  p-6 flex items-center justify-center">
            <Image
              src={`/api/image/${product.images[0]}`}
              alt={product.name}
              width={520}
              height={520}
              priority
              className="object-contain"
            />
          </div>

          <div className="flex gap-3 mt-4">
            {product.images.map((img: string, i: number) => (
              <div
                key={i}
                className="w-20 h-20 bg-white border rounded-lg hover:border-primary transition flex items-center justify-center"
              >
                <Image
                  src={`/api/image/${img}`}
                  alt={`${product.name} ${i + 1}`}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-4xl font-heading font-semibold text-text-main">
              {product.name}
            </h1>

            <button
              aria-label="Dodaj do ulubionych"
              className="p-2 rounded-full hover:bg-red-50 transition"
            >
              <Heart className="text-red-500" />
            </button>
          </div>

          <p className="text-3xl font-bold text-primary">
            {product.price.toFixed(2)} zł
          </p>

          <p className="text-text-secondary leading-relaxed">
            {product.description}
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
        </div>
      </section>

      {/* ================= DETAILS ================= */}
      <section className="bg-white border-t">
        <div className="max-w-5xl mx-auto px-6 py-16 grid gap-12">
          <div>
            <h2 className="text-2xl font-heading font-semibold mb-4">
              Opis produktu
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {product.description}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Dlaczego warto?</h3>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex gap-2">
                <Leaf className="text-primary" /> Naturalne składniki
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="text-primary" /> Produkt premium
              </li>
              <li className="flex gap-2">
                <Truck className="text-primary" /> Szybka wysyłka 24–48h
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section className="bg-background">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {[
            ["🌱 Ekologiczny wybór", "Bezpieczny dla Ciebie i środowiska"],
            ["📦 Szybka dostawa", "Wysyłka w 24–48h"],
            ["⭐ Jakość premium", "Starannie wyselekcjonowane produkty"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SIMILAR ================= */}
      <section className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-heading font-semibold mb-10">
            Podobne produkty
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {similarProducts.map((p: any) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="bg-background rounded-xl p-4 hover:shadow-md transition"
              >
                <Image
                  src={`/api/image/${p.images[0]}`}
                  alt={p.name}
                  width={200}
                  height={200}
                  className="h-40 mx-auto object-contain"
                />
                <h3 className="mt-4 font-medium text-text-main">{p.name}</h3>
                <p className="text-primary font-semibold mt-1">
                  {p.price.toFixed(2)} zł
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
