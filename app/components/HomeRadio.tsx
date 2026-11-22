import Link from "next/link";
import { ArrowUpRight, Headphones, Radio } from "lucide-react";

const radioUrl = "https://radio.nature-world.pl/";

export default function HomeRadio() {
  return (
    <section aria-labelledby="home-radio-title" className="border-y border-white/10 bg-[#173d2b] px-4 py-5 text-white md:px-8 md:py-7">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl border border-white/10 bg-[#214b36] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#c9e2bb] sm:size-16">
            <Radio size={28} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#c9e2bb]"><Headphones size={14} /> Radio Nature-World</p>
            <h2 id="home-radio-title" className="mt-1 text-lg font-semibold leading-snug !text-white sm:text-xl">Dobre dźwięki na dobry dzień</h2>
            <p className="mt-1 text-sm leading-5 text-white/75">Otwórz nasze radio internetowe i słuchaj online.</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div aria-hidden="true" className="hidden h-9 items-center gap-[3px] sm:flex">
            {[12, 22, 15, 29, 18, 25, 11, 21, 30, 16, 24, 13, 20, 10].map((height, index) => (
              <span key={index} className="w-[3px] rounded-full bg-[#9fc58e]" style={{ height }} />
            ))}
          </div>
          <Link href={radioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#173d2b] transition hover:bg-[#eaf2e5] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white sm:w-auto">
            Słuchaj radia <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
