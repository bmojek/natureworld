import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-9 md:px-8 md:py-14">
    <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#405b48] transition hover:bg-[#edf3e9] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft size={16} />Strona główna</Link>
    <header className="mt-5 rounded-3xl bg-[#173d2b] p-6 text-white md:p-9">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-lime-200">Nature-World · informacje</p>
      <h1 className="mt-3 text-3xl font-semibold !text-white md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80">{intro}</p>
    </header>
    <div className="mt-8 space-y-6">{children}</div>
  </main>;
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-[#e1e8dc] bg-white p-5 shadow-sm md:p-7">
    <h2 className="text-xl font-semibold text-[#173d2b]">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-7 text-[#405148]">{children}</div>
  </section>;
}
