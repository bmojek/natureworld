import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/app/components/LegalPage";
import { storeContact } from "@/app/lib/store-contact";

export const metadata: Metadata = {
  title: "Dostawa, zwroty i reklamacje",
  description: "Sprawdź dostawę kurierem, koszty wysyłki, 14-dniowe odstąpienie od umowy z przesyłką zwrotną na koszt Nature-World oraz reklamację.",
  alternates: { canonical: "/dostawa-i-zwroty" },
};

export default function DeliveryReturnsPage() {
  return <LegalPage title="Dostawa, zwroty i reklamacje" intro="Najważniejsze informacje o dostawie zamówień Nature-World, odstąpieniu od umowy i zgłaszaniu reklamacji.">
    <LegalSection title="Dostawa i płatność">
      <p>Zamówienia wysyłamy kurierem za stałą opłatą 10 zł za zamówienie, niezależnie od wartości zakupów. Dostępne metody płatności są wskazane w checkoutcie: pobranie lub płatność online obsługiwana przez Stripe, w tym BLIK, karty i portfele Apple Pay lub Google Pay, jeśli są dostępne dla urządzenia i transakcji.</p>
      <p>Produkty oznaczone jako dostępne wysyłamy w ciągu 24 godzin w dni robocze. Czas doręczenia przez przewoźnika zależy od jego usługi i nie jest tym samym co czas przygotowania przesyłki.</p>
    </LegalSection>
    <LegalSection title="Odstąpienie od umowy w ciągu 14 dni">
      <p>Konsument oraz osoba fizyczna prowadząca działalność gospodarczą, której przysługują prawa konsumenta, może odstąpić od umowy w ciągu 14 dni od odebrania produktu bez podawania przyczyny. Przy zamówieniu dostarczanym osobno termin liczy się od otrzymania ostatniego produktu. Wystarczy wysłać oświadczenie przed upływem terminu e-mailem na <a className="font-semibold text-primary underline" href={storeContact.emailHref}>{storeContact.email}</a> albo listownie.</p>
      <p>Po wysłaniu oświadczenia odeślij produkt w ciągu kolejnych 14 dni na adres: <strong>{storeContact.address}</strong>. To adres sklepu do zwrotów. Prosimy o dołączenie numeru zamówienia, abyśmy mogli sprawnie zidentyfikować przesyłkę.</p>
      <p><strong>Bezpośredni koszt przesyłki zwrotnej przy odstąpieniu od umowy ponosi kupujący.</strong> To koszt nadania produktu z powrotem do sklepu. Ta informacja jest podana przed zakupem. Nie wysyłaj przesyłki za pobraniem.</p>
      <p>Zwrot płatności, w tym kosztu najtańszej zwykłej dostawy oferowanej przy zakupie, nastąpi nie później niż w ciągu 14 dni od otrzymania oświadczenia. Możemy wstrzymać zwrot do chwili otrzymania produktu lub dowodu jego odesłania. Zwrot płatności online wykonamy z użyciem pierwotnej metody płatności, chyba że uzgodnimy z kupującym inną bezkosztową metodę. Przy zamówieniu za pobraniem skontaktujemy się w sprawie bezpiecznej formy zwrotu pieniędzy.</p>
      <p>Możesz sprawdzić produkt w zakresie potrzebnym do oceny jego charakteru, cech i działania. Odpowiadasz za zmniejszenie wartości wynikające z korzystania z niego w szerszym zakresie. Prawo odstąpienia nie obejmuje ustawowych wyjątków, jeśli mają zastosowanie do danego produktu.</p>
      <p>Skorzystaj z <Link className="font-semibold text-primary underline" href="/formularz-odstapienia">wzoru formularza odstąpienia</Link>; użycie formularza jest dobrowolne.</p>
    </LegalSection>
    <LegalSection title="Reklamacje">
      <p>Jeśli produkt jest niezgodny z umową lub został uszkodzony, napisz na {storeContact.email} albo wyślij zgłoszenie na adres siedziby: NATURE-WORLD SP. Z O.O., ul. Generała Józefa Bema 4-8, 33-100 Tarnów. Podaj numer zamówienia, opisz problem i — jeśli to pomocne — dołącz zdjęcia.</p>
      <p>Złożenie reklamacji z tytułu niezgodności towaru z umową jest bezpłatne. Sprzedawca pokrywa koszty wymagane przepisami, w tym odebrania lub odesłania reklamowanego towaru oraz naprawy albo wymiany. Sklep odpowie w ustawowym terminie. Nie naliczamy opłaty za samo złożenie reklamacji.</p>
    </LegalSection>
    <LegalSection title="Kontakt">
      <p>Telefon: <a className="font-semibold text-primary underline" href={storeContact.phoneHref}>{storeContact.phone}</a><br />E-mail: <a className="font-semibold text-primary underline" href={storeContact.emailHref}>{storeContact.email}</a><br />Adres sklepu i zwrotów: {storeContact.address}</p>
    </LegalSection>
  </LegalPage>;
}
