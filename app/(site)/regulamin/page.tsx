import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/app/components/LegalPage";
import { storeContact } from "@/app/lib/store-contact";

export const metadata: Metadata = {
  title: "Regulamin sklepu internetowego",
  description: "Regulamin zakupów w sklepie internetowym Nature-World: składanie zamówień, płatność za pobraniem, dostawa, odstąpienie i reklamacje.",
  alternates: { canonical: "/regulamin" },
};

export default function TermsPage() {
  return <LegalPage title="Regulamin sklepu" intro="Zasady zakupów w sklepie internetowym Nature-World. Przed złożeniem zamówienia zapoznaj się z informacjami o płatności, dostawie, odstąpieniu od umowy i reklamacjach.">
    <LegalSection title="1. Sprzedawca i kontakt">
      <p>Sprzedawcą jest <strong>NATURE-WORLD SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ</strong>, KRS 0000912969, NIP 8733280643, REGON 389518126, z siedzibą przy ul. Generała Józefa Bema 4-8, 33-100 Tarnów.</p>
      <p>Kontakt: <a className="font-semibold text-primary underline" href={storeContact.emailHref}>{storeContact.email}</a>, telefon <a className="font-semibold text-primary underline" href={storeContact.phoneHref}>{storeContact.phone}</a>. Adres sklepu i adres do zwrotów: {storeContact.address}.</p>
    </LegalSection>
    <LegalSection title="2. Składanie i realizacja zamówień">
      <p>Informacje o produktach i cenach są prezentowane w sklepie. Ceny podawane są w złotych polskich i obejmują podatki. Koszty dostawy są pokazane w koszyku i przed złożeniem zamówienia.</p>
      <p>Aby złożyć zamówienie, wybierz produkty, przejdź do koszyka, podaj dane potrzebne do dostawy, zaakceptuj regulamin i wybierz przycisk „Złóż zamówienie za pobraniem”. Sklep potwierdzi przyjęcie zamówienia na stronie po jego zapisaniu.</p>
      <p>Jeśli produktu zabraknie lub jego cena zmieni się przed potwierdzeniem zamówienia, sklep poinformuje o tym i nie potwierdzi zakupu na nieaktualnych warunkach.</p>
    </LegalSection>
    <LegalSection title="3. Płatność i dostawa">
      <p>Aktualnie dostępna metoda płatności to płatność za pobraniem — przy odbiorze przesyłki.</p>
      <p>Sklep oferuje dostawę kurierem za stałą opłatą 10 zł za zamówienie. Koszt jest doliczany niezależnie od wartości produktów. Informacja wyświetlona w koszyku przed wysłaniem zamówienia jest wiążącym podsumowaniem kosztów.</p>
      <p>Informacja o wysyłce w ciągu 24 godzin dotyczy produktów dostępnych na stanie i jest liczona w dniach roboczych. W razie okoliczności mogących opóźnić wysyłkę sklep skontaktuje się z klientem.</p>
    </LegalSection>
    <LegalSection title="4. Odstąpienie od umowy">
      <p>Konsument oraz uprawniony przedsiębiorca mogą odstąpić od umowy zawartej na odległość w terminie 14 dni od otrzymania produktu (lub ostatniego produktu, jeśli zamówienie dostarczano osobno), bez podawania przyczyny. Bezpośredni koszt odesłania produktu przy odstąpieniu ponosi kupujący. Procedura, adres i formularz są opisane na stronie <Link className="font-semibold text-primary underline" href="/dostawa-i-zwroty">Dostawa, zwroty i reklamacje</Link>.</p>
      <p>Prawo odstąpienia nie przysługuje w przypadkach określonych w przepisach, w szczególności dla rzeczy wykonanych na indywidualne zamówienie lub szybko psujących się, jeśli dany wyjątek ma zastosowanie do konkretnego produktu.</p>
    </LegalSection>
    <LegalSection title="5. Reklamacje">
      <p>Sprzedawca odpowiada wobec konsumenta za zgodność towaru z umową na zasadach określonych w obowiązujących przepisach. Reklamację można wysłać na adres {storeContact.email} albo listownie na adres siedziby spółki wskazany w pkt 1. W zgłoszeniu warto podać numer zamówienia, opis problemu i oczekiwany sposób rozwiązania.</p>
      <p>Sklep odpowie na reklamację w terminie wynikającym z obowiązujących przepisów. Reklamacja towaru niezgodnego z umową jest bezpłatna; wymagane prawem koszty odebrania, przewozu, naprawy lub wymiany ponosi sprzedawca.</p>
    </LegalSection>
    <LegalSection title="6. Dane osobowe i postanowienia końcowe">
      <p>Informacje o przetwarzaniu danych osobowych znajdują się w <Link className="font-semibold text-primary underline" href="/polityka-prywatnosci">polityce prywatności</Link>. W sprawach nieuregulowanych regulaminem stosuje się prawo polskie, z zachowaniem praw konsumenta wynikających z bezwzględnie obowiązujących przepisów.</p>
      <p>Regulamin obowiązuje od 2 listopada 2026 r. Zmiany regulaminu nie wpływają na zamówienia złożone przed ich wejściem w życie.</p>
    </LegalSection>
  </LegalPage>;
}
