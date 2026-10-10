import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { storeContact } from "@/app/lib/store-contact";

const departments = [
  ["ZWIERZĘTA", "/sklep/dzial/zwierzeta"],
  ["OGRÓD", "/sklep/dzial/ogrod"],
  ["DOM", "/sklep/dzial/dom"],
] as const;

export default function Footer() {
  return <footer className="mt-12 border-t border-black/10 bg-[#173d2b] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-[1.3fr_.8fr_1fr]">
      <div>
        <Link href="/" aria-label="Nature-World — strona główna" className="inline-block rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <Image src="/api/image/logo.webp" alt="Nature-World" width={180} height={48} className="h-12 w-auto object-contain brightness-0 invert" />
        </Link>
        <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">Sklep z artykułami dla zwierząt, ogrodu i domu.</p>
      </div>

      <nav aria-label="Działy sklepu">
        <h2 className="font-semibold">Sklep</h2>
        <ul className="mt-4 space-y-3 text-sm text-white/75">
          <li><Link href="/sklep" className="hover:text-white">Wszystkie produkty</Link></li>
          {departments.map(([label, href]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}
          <li><Link href="/aktualnosci" className="hover:text-white">Aktualności</Link></li>
        </ul>
      </nav>

      <div id="kontakt" className="scroll-mt-28">
        <h2 className="font-semibold">Kontakt i zakupy</h2>
        <ul className="mt-4 space-y-3 text-sm text-white/75">
          <li><a className="inline-flex items-center gap-2 hover:text-white" href={storeContact.phoneHref}><Phone size={16} />{storeContact.phone}</a></li>
          <li><a className="inline-flex items-center gap-2 hover:text-white" href={storeContact.emailHref}><Mail size={16} />{storeContact.email}</a></li>
          <li><a className="inline-flex items-start gap-2 hover:text-white" href={storeContact.mapHref} target="_blank" rel="noreferrer"><MapPin size={16} className="mt-0.5 shrink-0" />{storeContact.address}</a></li>
          <li className="pt-2 text-white/60">Dostępna metoda płatności: {storeContact.payment.toLowerCase()}.</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p>© {new Date().getFullYear()} Nature-World</p>
        <Link href="https://allegro.pl/uzytkownik/nature-world" target="_blank" rel="noreferrer" className="hover:text-white">Nature-World na Allegro</Link>
      </div>
    </div>
  </footer>;
}
