import { headers } from "next/headers";
import ProductGallery from "@/app/components/ProductGallery";
import AddToCartButton from "@/app/components/AddButton";
import { Heart, Truck, ShieldCheck } from "lucide-react";
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

/* ================= parser ================= */

function parseContent(content: string) {
  try {
    const json = JSON.parse(content);

    let html = "";

    json.sections?.forEach((s: any) => {
      s.items?.forEach((i: any) => {
        if (i.type === "TEXT") {
          html += i.content;
        }
      });
    });

    return html;
  } catch {
    return content;
  }
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
    return <div className="p-20 text-center">Produkt nie znaleziony</div>;
  }

  const description = parseContent(product.content || "");

  return (
    <main className="bg-background">
      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* GALLERY */}

        <ProductGallery images={product.images} name={product.name} />

        {/* INFO */}

        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-semibold">{product.name}</h1>

          <p className="text-3xl font-bold text-primary">
            {product.price.toFixed(2)} zł
          </p>

          <div>
            {product.stock > 0 ? (
              <span className="text-primary">✔ Dostępny ({product.stock})</span>
            ) : (
              <span className="text-red-500">Brak</span>
            )}
          </div>

          <AddToCartButton product={product} />

          <div className="grid gap-2 text-sm text-text-secondary">
            <div className="flex gap-2">
              <Truck size={16} />
              Wysyłka 24h
            </div>

            <div className="flex gap-2">
              <ShieldCheck size={16} />
              Gwarancja
            </div>
          </div>
        </div>
      </section>

      {/* OPIS */}

      {description && (
        <section className="bg-white border-t">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-2xl mb-6">Opis produktu</h2>

            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: description,
              }}
            />
          </div>
        </section>
      )}
    </main>
  );
}
