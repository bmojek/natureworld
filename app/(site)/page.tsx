import Image from "next/image";
import Link from "next/link";
import { ArrowRight, House, Leaf, Mail, MapPin, PawPrint, Phone, Search, SlidersHorizontal, Store } from "lucide-react";
import HomeContent from "@/app/components/HomeContent";
import { storeContact } from "@/app/lib/store-contact";

const departments = [
  { title: "ZWIERZĘTA", description: "Akcesoria i produkty dla zwierząt oraz akwarystyka.", href: "/sklep/dzial/zwierzeta", icon: PawPrint, theme: "bg-[#eff4e9]", iconTheme: "bg-[#dfead6] text-[#315d37]" },
  { title: "OGRÓD", description: "Artykuły ogrodowe, pielęgnacja roślin i wyposażenie.", href: "/sklep/dzial/ogrod", icon: Leaf, theme: "bg-[#eaf2e6]", iconTheme: "bg-[#d9e9d3] text-[#315d37]" },
  { title: "DOM", description: "Wyposażenie, dekoracje i praktyczne dodatki do domu.", href: "/sklep/dzial/dom", icon: House, theme: "bg-[#f4f0e7]", iconTheme: "bg-[#e9e0cf] text-[#68573a]" },
];

const catalogSteps = [
  { number: "01", title: "Wybierz dział", description: "Zacznij od produktów dla zwierząt, ogrodu albo domu.", icon: Store },
  { number: "02", title: "Otwórz kategorię", description: "Przejdź do właściwej grupy produktów i jej podkategorii.", icon: SlidersHorizontal },
  { number: "03", title: "Szukaj po nazwie", description: "Użyj wyszukiwarki, jeśli wiesz, czego potrzebujesz.", icon: Search },
];

export default function HomePage() {
  return <main>
    <section className="relative isolate overflow-hidden bg-[#173d2b] text-white">
      <Image src="/api/image/main_ogrod.webp" alt="Asortyment Nature-World do domu, ogrodu i dla zwierząt" fill priority sizes="100vw" className="-z-20 object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102c20] via-[#173d2b]/85 to-[#173d2b]/20" />
      <div className="mx-auto grid min-h-[430px] max-w-7xl items-center gap-8 px-5 py-16 md:min-h-[500px] md:grid-cols-[1fr_auto] md:px-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[.18em] text-lime-200"><Store size={17} />Nature-World</p>
          <h1 style={{ color: "#ffffff" }} className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight !text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] md:text-6xl">Dla domu, ogrodu i Twoich zwierząt</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/90 md:text-lg">Poznaj ofertę Nature-World i wybierz dział, którego szukasz.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/sklep" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-[#173d2b] transition hover:bg-lime-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Odkryj ofertę <ArrowRight size={18} /></Link><Link href="/sklep/dzial/ogrod" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/60 bg-[#173d2b]/60 px-6 font-semibold text-white transition hover:bg-[#173d2b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Dział OGRÓD</Link></div>
        </div>
        <div className="hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm md:block">
          <p className="text-sm text-white/80">Znajdź swój dział</p>
          <ul className="mt-4 space-y-2">{departments.map(({ title, href, icon: Icon }) => <li key={title}><Link className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold text-white transition hover:bg-white/10" href={href}><Icon size={19} className="text-lime-200" />{title}<ArrowRight size={16} className="ml-auto" /></Link></li>)}</ul>
        </div>
      </div>
    </section>

    <section aria-labelledby="departments-heading" className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Odkryj Nature-World</p><h2 id="departments-heading" className="mt-2 text-3xl font-semibold text-[#173d2b] md:text-4xl">Wybierz dział</h2><p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Trzy przejrzyste ścieżki do katalogu — wybierz tę, która pasuje do Twoich potrzeb.</p></div>
        <Link href="/sklep" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Cały katalog <ArrowRight size={16} /></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {departments.map(({ title, description, href, icon: Icon, theme, iconTheme }, index) => <Link href={href} key={title} className={"group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-sm ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-72 md:p-7 " + theme}>
          <span aria-hidden="true" className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[24px] border-white/45 transition-transform duration-500 group-hover:scale-110" />
          <div className="relative flex items-start justify-between">
            <span className={"flex h-14 w-14 items-center justify-center rounded-2xl " + iconTheme}><Icon size={27} strokeWidth={1.7} /></span>
            <span className="text-xs font-bold tracking-[.16em] text-[#6b7d69]">0{index + 1}</span>
          </div>
          <div className="relative mt-10">
            <h3 className="text-2xl font-bold tracking-wide text-[#173d2b]">{title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[#50634f]">{description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Przeglądaj dział <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
          </div>
        </Link>)}
      </div>
    </section>

    <HomeContent />

    <section aria-labelledby="catalog-guide-heading" className="border-y border-[#dfe7d8] bg-[#f7f9f5]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Wygodne zakupy</p><h2 id="catalog-guide-heading" className="mt-2 text-3xl font-semibold tracking-tight text-[#173d2b]">Jak znaleźć właściwy produkt?</h2><p className="mt-3 text-sm leading-6 text-text-secondary">Skorzystaj z katalogu, kategorii albo wyszukiwarki — przejdź do produktów w kilku prostych krokach.</p></div>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {catalogSteps.map(({ number, title, description, icon: Icon }) => <li key={number} className="rounded-2xl border border-[#e1e8dc] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.16em] text-primary">{number}</span><Icon size={20} className="text-primary" /></div>
            <h3 className="mt-5 text-lg font-semibold text-[#173d2b]">{title}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
          </li>)}
        </ol>
        <Link href="/sklep" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#24652a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Przejdź do katalogu <ArrowRight size={16} /></Link>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 md:grid-cols-[.9fr_1.1fr] md:items-center md:px-8 md:py-16">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-[#edf3e9]"><Image src="/api/image/main_onas3.webp" alt="Asortyment sklepu Nature-World" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /></div>
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">O Nature-World</p><h2 className="mt-2 text-3xl font-semibold text-[#173d2b]">Asortyment do domu, ogrodu i dla zwierząt</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">Nature-World łączy trzy obszary oferty: produkty zoologiczne, artykuły ogrodowe oraz wyposażenie i dodatki do domu. Przeglądaj katalog według działów lub użyj wyszukiwarki.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/sklep" className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 font-semibold text-white hover:bg-[#24652a]">Przeglądaj ofertę</Link><Link href="/#kontakt" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/25 px-5 font-semibold text-primary hover:bg-[#edf3e9]">Kontakt ze sklepem</Link></div></div>
    </section>

    <section id="kontakt" aria-labelledby="contact-heading" className="border-t border-[#dfe7d8] bg-[#f7f9f5]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-[.9fr_1.1fr] md:px-8 md:py-16">
        <div className="rounded-3xl bg-[#173d2b] p-7 text-white md:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-lime-200">Nature-World</p>
          <h2 id="contact-heading" style={{ color: "#ffffff" }} className="mt-3 text-3xl font-semibold !text-white">Kontakt ze sklepem</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">Masz pytanie dotyczące oferty lub zamówienia? Skontaktuj się z nami.</p>
          <div className="mt-7 space-y-4">
            <a href={storeContact.phoneHref} className="flex items-center gap-3 rounded-xl px-3 py-2 text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><Phone size={18} /></span><span><span className="block text-xs text-white/60">Telefon</span><span className="font-semibold">{storeContact.phone}</span></span></a>
            <a href={storeContact.emailHref} className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2 text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"><Mail size={18} /></span><span className="min-w-0"><span className="block text-xs text-white/60">E-mail</span><span className="break-all font-semibold">{storeContact.email}</span></span></a>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-[#e1e8dc] bg-white p-6 shadow-sm sm:col-span-2 md:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf3e9] text-primary"><MapPin size={21} /></span>
            <h3 className="mt-5 text-xl font-semibold text-[#173d2b]">Adres sklepu</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{storeContact.address}</p>
            <a href={storeContact.mapHref} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-[#edf3e9] px-4 text-sm font-semibold text-[#173d2b] transition hover:bg-[#e2ecdb] focus-visible:outline-2 focus-visible:outline-primary">Otwórz mapę <ArrowRight size={16} /></a>
          </div>
          <div className="rounded-3xl border border-[#e1e8dc] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Płatność</p>
            <h3 className="mt-2 text-lg font-semibold text-[#173d2b]">{storeContact.payment}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Aktualnie dostępna forma płatności w sklepie.</p>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-[#edf3e9] p-6">
            <div><p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Oferta</p><h3 className="mt-2 text-lg font-semibold text-[#173d2b]">Dom, ogród i zwierzęta</h3><p className="mt-2 text-sm leading-6 text-gray-600">Przejdź do katalogu Nature-World.</p></div>
            <Link href="/sklep" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#24652a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Przejdź do sklepu <ArrowRight size={17} /></Link>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
