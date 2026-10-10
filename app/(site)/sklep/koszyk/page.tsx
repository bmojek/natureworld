"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/app/context/cart-context";
import { getProductImageUrl } from "@/app/lib/product-images";

export default function CartPage() {
  const { items, ready, updateQty, removeItem, total } = useCart();
  const deliveryCost = total >= 99 ? 0 : 15;
  const grandTotal = total + deliveryCost;

  if (!ready) return <main className="mx-auto min-h-[55vh] max-w-7xl px-5 py-16"><div className="h-48 animate-pulse rounded-3xl bg-[#edf1e9]" /></main>;
  if (items.length === 0) return <main className="mx-auto flex min-h-[55vh] max-w-7xl flex-col items-center justify-center px-5 py-16 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#edf3e9] text-primary"><ShoppingBag size={34} /></span><h1 className="mt-6 text-3xl font-semibold text-[#173d2b]">Koszyk jest pusty</h1><p className="mt-3 max-w-md text-text-secondary">Wybierz dział i dodaj produkty, które chcesz zamówić.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/sklep" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-white hover:bg-[#24652a]">Przeglądaj produkty <ArrowRight size={17} /></Link><Link href="/sklep/dzial/zwierzeta" className="inline-flex min-h-12 items-center rounded-full bg-[#edf3e9] px-6 font-semibold text-[#173d2b] hover:bg-[#e2ecdb]">Dział zwierzęta</Link></div></main>;

  return <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-8 md:px-8 md:py-12">
    <nav aria-label="Okruszki" className="mb-5 text-sm text-text-secondary"><Link href="/sklep" className="hover:text-primary">Sklep</Link><span className="mx-2">/</span><span aria-current="page">Koszyk</span></nav>
    <h1 className="text-3xl font-semibold text-[#173d2b] md:text-4xl">Twój koszyk</h1>
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_350px]">
      <section aria-label="Produkty w koszyku" className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <ul className="divide-y divide-black/5">{items.map((item) => <li key={item.productId} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-5 sm:p-6">
          <Link href={`/sklep/produkt/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#ffffff] sm:h-24 sm:w-24"><Image src={getProductImageUrl(item.image, "thumb")} alt={item.name} fill sizes="96px" unoptimized className="object-contain p-2" /></Link>
          <div className="min-w-0 flex-1"><Link href={`/sklep/produkt/${item.slug}`} className="font-medium leading-6 text-[#173d2b] hover:text-primary">{item.name}</Link><p className="mt-1 text-sm text-text-secondary">{item.price.toFixed(2)} zł / szt.</p></div>
          <div className="flex w-full items-center justify-between sm:w-auto sm:justify-start sm:gap-5">
            <div className="inline-flex h-10 items-center gap-3 rounded-full border border-black/10 px-3"><button type="button" onClick={() => item.qty === 1 ? removeItem(item.productId) : updateQty(item.productId, item.qty - 1)} aria-label={item.qty === 1 ? `Usuń ${item.name}` : `Zmniejsz ilość: ${item.name}`} className="rounded p-1 text-text-secondary hover:text-primary">{item.qty === 1 ? <Trash2 size={16} /> : <Minus size={16} />}</button><span className="min-w-4 text-center text-sm font-medium" aria-live="polite">{item.qty}</span><button type="button" onClick={() => updateQty(item.productId, item.qty + 1)} aria-label={`Zwiększ ilość: ${item.name}`} className="rounded p-1 text-text-secondary hover:text-primary"><Plus size={16} /></button></div>
            <p className="w-24 text-right font-semibold text-[#173d2b]">{(item.price * item.qty).toFixed(2)} zł</p>
          </div>
        </li>)}</ul>
        <div className="border-t border-black/5 p-4 sm:p-6"><Link href="/sklep" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowRight className="rotate-180" size={16} />Kontynuuj zakupy</Link></div>
      </section>
      <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-28 sm:p-6">
        <h2 className="text-xl font-semibold text-[#173d2b]">Podsumowanie</h2>
        <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-text-secondary">Produkty</dt><dd>{total.toFixed(2)} zł</dd></div><div className="flex justify-between gap-3"><dt className="text-text-secondary">Dostawa</dt><dd>{deliveryCost === 0 ? "0,00 zł" : `${deliveryCost.toFixed(2)} zł`}</dd></div><div className="flex justify-between gap-3 border-t border-black/10 pt-4 text-base font-semibold"><dt>Razem</dt><dd>{grandTotal.toFixed(2)} zł</dd></div></dl>
        <p className="mt-4 text-xs leading-5 text-text-secondary">Podsumowanie ma charakter orientacyjny. Cena i dostępność są ponownie sprawdzane przy składaniu zamówienia.</p>
        <Link href="/sklep/checkout" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-white transition hover:bg-[#24652a]">Przejdź do kasy <ArrowRight size={17} /></Link>
      </aside>
    </div>
  </main>;
}
