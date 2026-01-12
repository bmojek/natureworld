import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

/* ================= FETCH ================= */

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
  params: { slug: string };
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return <div className="p-12 text-center">Produkt nie znaleziony</div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* ================= BREADCRUMBS ================= */}
      <nav className="text-sm text-text-secondary mb-6 flex items-center gap-2">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span>/</span>
        <span className="font-medium">{product.name}</span>
      </nav>

      {/* ================= GŁÓWNA SEKCJA ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* ===== GALERIA ===== */}
        <div className="space-y-4 md:sticky md:top-24">
          <div className="relative w-full aspect-square bg-white rounded-2xl border">
            {product.images?.[0] && (
              <Image
                src={`/api/image/${product.images[0]}`}
                alt={product.name}
                width={600}
                height={600}
                priority
                className="object-contain p-6"
              />
            )}
          </div>

          {/* MINIATURY */}
          {product.images?.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className="relative w-20 h-20 bg-white border rounded-xl cursor-pointer hover:ring-2 hover:ring-primary"
                >
                  <Image
                    src={`/api/image/${img}`}
                    alt=""
                    fill
                    className="object-contain p-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== INFO ===== */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>

          {/* CENA + STAN */}
          <div className="flex items-center gap-4">
            <p className="text-3xl font-semibold text-primary">
              {product.price.toFixed(2)} zł
            </p>

            {product.stock > 0 ? (
              <span className="text-sm text-green-600 font-medium">
                ● Dostępny
              </span>
            ) : (
              <span className="text-sm text-red-600 font-medium">
                ● Brak w magazynie
              </span>
            )}
          </div>

          {/* OPIS KRÓTKI */}
          <p className="text-text-secondary leading-relaxed">
            {product.description}
          </p>

          {/* AKCJE */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              disabled={product.stock <= 0}
              className="bg-primary text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dodaj do koszyka
            </button>

            <button className="px-8 py-4 rounded-full border font-medium hover:bg-gray-50">
              ❤ Dodaj do ulubionych
            </button>
          </div>

          {/* BOX DOSTAWY */}
          <div className="rounded-xl border bg-green-50 p-4 text-sm space-y-2">
            <p className="font-medium text-green-700">
              🚚 Darmowa dostawa od 99 zł
            </p>
            <p className="text-text-secondary">
              Zwrot do 30 dni · wysyłamy kurierem
            </p>
          </div>

          {/* INFO TECH */}
          <div className="pt-6 border-t text-sm text-text-secondary space-y-1">
            <p>SKU: {product.id}</p>
            <p>Dostawa: 1–3 dni robocze</p>
          </div>
        </div>
      </div>

      {/* ================= NAJCZĘŚCIEJ KUPOWANE ================= */}
      <section className="mt-20">
        <h2 className="text-xl font-semibold mb-6">
          Najczęściej kupowane razem
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <Image
              src={`/api/image/${product.images[0]}`}
              width={80}
              height={80}
              alt=""
            />
            <span className="text-xl font-bold">+</span>
            <div className="w-20 h-20 bg-gray-200 rounded-xl" />
          </div>

          <div className="md:ml-auto text-right">
            <p className="font-medium">Razem</p>
            <p className="text-xl font-semibold text-primary">
              {(product.price + 9.99).toFixed(2)} zł
            </p>

            <button className="mt-2 bg-primary text-white px-6 py-2 rounded-full">
              Dodaj do koszyka
            </button>
          </div>
        </div>
      </section>

      {/* ================= OPIS / TABS ================= */}
      <section className="mt-20 max-w-4xl space-y-4">
        <details open className="border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">
            Opis produktu
          </summary>
          <p className="mt-3 text-text-secondary">{product.description}</p>
        </details>

        <details className="border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">
            Specyfikacja
          </summary>
          <ul className="mt-3 text-sm text-text-secondary list-disc pl-5">
            <li>Materiał: —</li>
            <li>Wymiary: —</li>
            <li>Przeznaczenie: —</li>
          </ul>
        </details>

        <details className="border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">
            Dostawa i zwroty
          </summary>
          <p className="mt-3 text-sm text-text-secondary">
            Darmowy zwrot do 30 dni. Wysyłka kurierem.
          </p>
        </details>
      </section>
    </main>
  );
}
