import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddButton";
import { Product } from "../models/product";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div
      className="
        group
        h-full
        rounded-2xl
        bg-white/80
        shadow-sm
        transition
        duration-300
        ease-out
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      {/* WRAPPER */}
      <div className="flex flex-row md:flex-col">
        {/* IMAGE – 50% */}
        <Link
          href={`/produkt/${product.slug}`}
          className="block w-1/2 md:w-full shrink-0"
        >
          <div
            className="
              relative
              aspect-square
              rounded-l-2xl md:rounded-t-2xl md:rounded-l-none
              bg-linear-to-b from-white to-neutral-100
              p-4
              overflow-hidden
            "
          >
            {product.images?.[0] && (
              <Image
                src={`/api/image/${product.images[0]}_thumb.webp`}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="
                  object-contain
                  transition-transform
                  duration-300
                  ease-out
                  group-hover:scale-105
                "
              />
            )}
          </div>
        </Link>

        {/* CONTENT – 50% */}
        <div
          className="
            flex
            flex-col
            w-1/2 md:w-full
            p-4 md:p-5
            min-h-[200px]
          "
        >
          {/* NAME */}
          <Link href={`/produkt/${product.slug}`}>
            <p
              className="
                font-medium
                leading-snug
                line-clamp-2
                group-hover:text-primary
                transition-colors
              "
            >
              {product.name}
            </p>
          </Link>

          {/* SPACER */}
          <div className="flex-1" />

          {/* PRICE */}
          <p className="text-lg font-semibold tracking-tight mb-2">
            {product.price.toFixed(2)} zł
          </p>

          {/* CTA */}
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
