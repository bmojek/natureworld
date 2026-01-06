import Image from "next/image";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto p-8 flex flex-col items-center">
      {/* Hero */}
      <div className="w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold text-text-main mt-6">NatureWorld</h1>
        <p className="mt-4 text-text-secondary text-center max-w-xl">
          Sklep zoologiczno-ogrodniczy – Next.js + Firebase + Cloudflare R2
          (Private Bucket + Proxy API)
        </p>
      </div>

      {/* Sekcja polecane */}
      <section className="mt-12 w-full">
        <h2 className="text-2xl font-semibold text-primary mb-6">
          Polecane produkty
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Tutaj będą miniaturki produktów */}
          <div className="border rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col items-center">
            <div className="w-40 h-40 relative">
              <Image
                src="/api/image/logo.webp"
                alt="Produkt"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 160px"
              />
            </div>
            <h3 className="mt-4 font-semibold text-textMain">Produkt 1</h3>
            <p className="text-textSecondary mt-1">99 zł</p>
          </div>
        </div>
      </section>
    </main>
  );
}
