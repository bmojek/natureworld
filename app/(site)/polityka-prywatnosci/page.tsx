import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/app/components/LegalPage";
import { storeContact } from "@/app/lib/store-contact";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Informacje o danych osobowych, kontach, zamówieniach i technologiach używanych przez sklep internetowy Nature-World.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default function PrivacyPage() {
  return <LegalPage title="Polityka prywatności" intro="Wyjaśniamy, jakie dane są przetwarzane podczas korzystania ze sklepu Nature-World, składania zamówień i kontaktu ze sprzedawcą.">
    <LegalSection title="1. Administrator danych">
      <p>Administratorem danych jest NATURE-WORLD SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ, KRS 0000912969, NIP 8733280643, REGON 389518126, ul. Generała Józefa Bema 4-8, 33-100 Tarnów. Kontakt w sprawach danych: <a className="font-semibold text-primary underline" href={storeContact.emailHref}>{storeContact.email}</a> lub {storeContact.phone}.</p>
    </LegalSection>
    <LegalSection title="2. Jakie dane i w jakim celu">
      <ul className="list-disc space-y-2 pl-5">
        <li>Dane kontaktowe i adresowe podane przy zamówieniu — obsługa zamówienia, dostawa, kontakt i obsługa reklamacji.</li>
        <li>Dane konta i uwierzytelnienia — utworzenie konta, logowanie i obsługa historii zamówień.</li>
        <li>Dane wymagane dokumentami księgowymi, w tym NIP podany przy prośbie o fakturę — rozliczenia i obowiązki prawne.</li>
        <li>Dane z korespondencji — odpowiedź na pytania i ustalenia dotyczące zamówień.</li>
        <li>Dane techniczne żądania, np. adres IP i informacje o urządzeniu, w zakresie koniecznym do działania, ochrony i diagnozowania sklepu.</li>
      </ul>
    </LegalSection>
    <LegalSection title="3. Podstawy i okres przechowywania">
      <p>Dane są przetwarzane w celu zawarcia i wykonania umowy, wypełnienia obowiązków prawnych, obsługi roszczeń oraz — gdy jest to potrzebne — na podstawie prawnie uzasadnionego interesu administratora. Dane zamówień przechowujemy przez okres wymagany przepisami rachunkowymi i podatkowymi oraz niezbędny do obsługi roszczeń. Dane konta przechowujemy do czasu usunięcia konta, z zastrzeżeniem danych, które musimy zachować na podstawie prawa.</p>
    </LegalSection>
    <LegalSection title="4. Odbiorcy danych">
      <p>Dane mogą być przekazywane w niezbędnym zakresie dostawcom usług IT i hostingu, Firebase/Google (uwierzytelnianie i baza zamówień), BaseLinker (weryfikacja produktów, cen i stanów), Vercel (hosting), Upstash (cache katalogu), Cloudflare (dostarczanie obrazów) oraz przewoźnikowi realizującemu dostawę. Sklep obecnie oferuje płatność za pobraniem i nie przekazuje danych do internetowej bramki płatniczej.</p>
      <p>Dostawcy usług mogą przetwarzać dane w państwach poza Europejskim Obszarem Gospodarczym. W takim przypadku przekazanie odbywa się z zastosowaniem mechanizmu wymaganego przez przepisy o ochronie danych.</p>
    </LegalSection>
    <LegalSection title="5. Prawa użytkownika">
      <p>Możesz żądać dostępu do danych, ich sprostowania, usunięcia lub ograniczenia przetwarzania, wnieść sprzeciw, zażądać przeniesienia danych, a także złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych. Wnioski kieruj na {storeContact.email}. Podanie danych niezbędnych do zamówienia jest dobrowolne, ale konieczne do jego realizacji.</p>
    </LegalSection>
    <LegalSection title="6. Pamięć przeglądarki i cookies">
      <p>Sklep zapisuje w pamięci przeglądarki zawartość koszyka, stan logowania zapewniany przez Firebase oraz techniczne informacje potrzebne do dokończenia lub sprawdzenia zamówienia. Session storage może przechowywać krótkotrwały wybór kategorii i klucz ponowienia checkoutu. W kodzie sklepu nie znaleziono narzędzi analitycznych ani reklamowych wymagających zgody na marketingowe cookies.</p>
      <p>Możesz zarządzać pamięcią przeglądarki w ustawieniach urządzenia. Wyłączenie niezbędnych danych lokalnych może uniemożliwić działanie koszyka, logowania lub checkoutu.</p>
    </LegalSection>
    <LegalSection title="7. Zmiany polityki">
      <p>Polityka może być aktualizowana, gdy zmieni się sposób działania sklepu lub obowiązujące przepisy. Aktualna wersja jest publikowana na tej stronie.</p>
      <p>Data aktualizacji: 2 listopada 2026 r.</p>
    </LegalSection>
  </LegalPage>;
}
