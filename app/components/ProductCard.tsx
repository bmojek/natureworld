import Image from "next/image";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import AddToCartButton from "./AddButton";
import { Product } from "../models/product";
import { getProductImageUrl } from "@/app/lib/product-images";

export default function ProductCard({ product }: { product: Product }) {
  const priceIsValid = Number.isFinite(product.price) && product.price >= 0;
  const available = Number.isFinite(product.stock) && product.stock > 0;
  const image = product.images?.[0];
  return <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-shadow duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg">
    <Link href={`/sklep/produkt/${product.slug}`} aria-label={`Zobacz produkt: ${product.name}`} className="relative block aspect-square overflow-hidden bg-[#ffffff] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary">
      {image ? <Image src={getProductImageUrl(image, "thumb")} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" unoptimized className="object-contain p-5 transition-transform duration-500 md:group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-[#aab7a1]"><PackageOpen size={42} strokeWidth={1.3} aria-hidden="true" /><span className="sr-only">Brak zdjęcia produktu</span></div>}
    </Link>
    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <p className={`mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${available ? "bg-[#e9f3e8] text-[#17643a]" : "bg-[#f0f1ef] text-[#59645d]"}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[#17643a]" : "bg-[#77847a]"}`} />{available ? "Dostępny" : "Chwilowo niedostępny"}</p>
      <Link href={`/sklep/produkt/${product.slug}`} className="min-h-12 text-sm font-medium leading-5 text-[#26352b] transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary sm:text-base sm:leading-6"><span className="line-clamp-2">{product.name}</span></Link>
      <div className="mt-auto pt-4">
        <p className="mb-3 text-lg font-bold tracking-tight text-[#173d2b] sm:text-xl">{priceIsValid ? <>{product.price.toFixed(2)} <span className="text-sm font-semibold">zł</span></> : <span className="text-sm font-medium text-[#59645d]">Cena niedostępna</span>}</p>
        {priceIsValid && available ? <AddToCartButton product={product} /> : <Link href={`/sklep/produkt/${product.slug}`} className="block rounded-full bg-[#edf3e9] px-4 py-3 text-center text-sm font-semibold text-[#173d2b] transition hover:bg-[#e2ecdb] focus-visible:outline-2 focus-visible:outline-primary">Zobacz produkt</Link>}
      </div>
    </div>
  </article>;
}
