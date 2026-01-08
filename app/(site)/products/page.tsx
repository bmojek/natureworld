import { getProducts } from "@/app/lib/firestore";
import Image from "next/image";
import Link from "next/link";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="max-w-7xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/product/${product.slug}`}
          className="border rounded-xl p-4 hover:shadow-lg transition"
        >
          <div className="relative w-full aspect-square mb-3">
            <Image
              src={`/api/image/${product.images[0]}`}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>

          <h3 className="font-medium">{product.name}</h3>
          <p className="text-primary font-semibold">
            {(product.price / 100).toFixed(2)} zł
          </p>
        </Link>
      ))}
    </main>
  );
}
