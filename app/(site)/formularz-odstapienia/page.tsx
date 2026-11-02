import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/app/components/LegalPage";
import { storeContact } from "@/app/lib/store-contact";

export const metadata: Metadata = {
  title: "Wzór formularza odstąpienia od umowy",
  description: "Dobrowolny wzór oświadczenia o odstąpieniu od umowy zawartej na odległość ze sklepem Nature-World.",
  alternates: { canonical: "/formularz-odstapienia" },
};

export default function WithdrawalFormPage() {
  return <LegalPage title="Wzór formularza odstąpienia" intro="Możesz skopiować poniższy wzór i wysłać go e-mailem albo pocztą. Skorzystanie z formularza nie jest obowiązkowe.">
    <LegalSection title="Oświadczenie">
      <div className="space-y-4 rounded-xl bg-[#f7f9f5] p-5 text-[#26352b]">
        <p>Adresat: NATURE-WORLD SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ, ul. Generała Józefa Bema 4-8, 33-100 Tarnów, e-mail: {storeContact.email}.</p>
        <p>Ja/My (*) niniejszym informuję/informujemy (*) o odstąpieniu od umowy sprzedaży następujących towarów:</p>
        <p>....................................................................................................................</p>
        <p>Numer zamówienia: ....................................................................................</p>
        <p>Data zawarcia umowy / odbioru towaru: ....................................................</p>
        <p>Imię i nazwisko konsumenta(-ów): ............................................................</p>
        <p>Adres konsumenta(-ów): ...........................................................................</p>
        <p>Numer rachunku do zwrotu płatności za zamówienie za pobraniem (jeśli dotyczy): ........................................................................................................</p>
        <p>Podpis konsumenta(-ów) — tylko jeśli formularz jest wysyłany w wersji papierowej: ........................................................................................................</p>
        <p>Data: ............................................................................................................</p>
        <p className="text-xs text-text-secondary">(*) Niepotrzebne skreślić.</p>
      </div>
    </LegalSection>
  </LegalPage>;
}
