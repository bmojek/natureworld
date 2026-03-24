"use client";

import Link from "next/link";
import ProductCard from "@/app/components/ProductCard";
import { Product } from "@/app/models/product";

type Props = {
  title: string;
  products: Product[];
  href: string;
};

export default function ProductRow({ title, products, href }: Props) {
  if (!products?.length) return null;

  return (
    <section className="space-y-4">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>

        <Link href={href} className="text-sm text-primary hover:underline">
          Zobacz wszystkie
        </Link>
      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
