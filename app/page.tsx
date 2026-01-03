import Image from "next/image";

export default function Home() {
  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold">NatureWorld</h1>

      <div className="w-64 h-64 relative">
        <Image
          src="/api/image/logo.jpg"
          alt="Logo"
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, 256px"
          loading="eager"
        />
      </div>

      <p className="mt-6 text-gray-600 text-center max-w-xl">
        Sklep zoologiczno-ogrodniczy – Next.js + Firebase + Cloudflare R2
        (Private Bucket + Proxy API)
      </p>
    </main>
  );
}
