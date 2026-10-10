# Przygotowanie własnych zamówień Firestore

## Zakres tego etapu

Endpoint `/api/checkout` zapisuje nowe zamówienia w Firestore. Nie ma klientowego dostępu do kolekcji zamówień. `baseOrderRequests` pozostaje tylko do odczytu dla prób rozpoczętych przez poprzednią wersję checkoutu.

## Kolekcje

- `orders/{uuid}` — pełna migawka zamówienia i jego początkowe statusy.
- `orderRequests/{idempotencyKey}` — skrót HMAC żądania, ID i numer utworzonego zamówienia. Dokument jest zachowywany bez TTL, aby późniejsze ponowienie nie utworzyło duplikatu.
- `system/orderNumberSequence` — licznik numerów `NW-0000001`, zwiększany w tej samej transakcji co zapis zamówienia.

`createFirestoreOrder` waliduje dane i tworzy migawkę z aktualnych cen, nazw, SKU, zdjęć oraz dostępności pobranych z Base.com. Wartości kwot są liczone w groszach. Obecna reguła dostawy to kurier za 15 zł lub bezpłatnie od 99 zł; rabaty nie istnieją w obecnym checkoutcie i są zapisywane jako zero. Obecny adapter katalogu nie obsługuje wariantów, dlatego snapshot jawnie zapisuje `variant: null`.

Metoda płatności i dostawy odpowiadają bieżącemu przepływowi: pobranie (`cod`) i kurier. Początkowy status płatności to `unpaid`, a realizacji `pending`. Model nie zawiera danych karty ani nieistniejącego identyfikatora zamówienia Base.

## Warstwa serwerowa

`app/lib/orders.ts` eksportuje walidację, budowanie migawki, atomowe tworzenie zamówienia oraz wewnętrzny odczyt. Moduł importuje `server-only` i korzysta z istniejącego Firebase Admin. Checkout udostępnia klientowi jedynie status próby po kluczu idempotencji. Endpoint administracyjny do odczytu lub zmiany statusów nie został dodany; przyszły endpoint musi uwierzytelnić administratora po stronie serwera i ograniczyć pola, które może zmieniać.

Firebase Admin SDK pomija Firestore Security Rules. Repozytorium nie zawierało `firebase.json` ani pliku reguł, więc nie można potwierdzić reguł wdrożonego projektu. Przed wdrożeniem należy sprawdzić istniejące reguły i zabronić klientowemu Firebase SDK odczytu/zapisu `orders`, `orderRequests` i `system`; nie zastępować w ciemno reguł używanych przez treści sklepu.

## Testy lokalne

`npm test` uruchamia testy jednostkowe czystej walidacji, migawki cen/kwot, dostępności i digestu idempotencji. Wymagają Node.js z wbudowanym type stripping (sprawdzone na Node 23). Nie obejmują transakcji Firestore ani endpointu. Repozytorium nie zawiera konfiguracji ani binariów emulatora; do testów integracyjnych należy skonfigurować osobny Firebase Emulator Suite i wskazać `FIRESTORE_EMULATOR_HOST` oraz nieprodukcyjny projekt. Nie uruchamiać ich z poświadczeniami produkcyjnymi.

Firebase CLI jest dostępny globalnie, ale lokalny emulator nie jest pobrany i brak `firebase.json`, `.firebaserc` oraz reguł Firestore. Emulator wymaga osobnej konfiguracji Firestore w `firebase.json` (np. port 8080), uruchomienia przez `firebase emulators:start --only firestore --project demo-natureworld` oraz ustawienia `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`. W tej konfiguracji testy integracyjne nie zostały dodane ani uruchomione.

## Konfiguracja

Nie dodano nowych zmiennych środowiskowych. Wymagane są dotychczasowe poświadczenia Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` i `FIREBASE_PRIVATE_KEY`. HMAC idempotencji używa istniejącego prywatnego klucza Firebase Admin. Budowanie migawki wymaga dotychczasowej konfiguracji Base.com, ponieważ ceny i dostępność są weryfikowane w katalogu źródłowym.

## Ograniczenia

- Odczyt i sprawdzenie stanu Base.com nie rezerwują towaru; wyścig zakupu ostatniej sztuki nadal wymaga osobnej decyzji.
- `baseOrderRequests` nie jest usuwana ani aktualizowana przez nowe zamówienia. Zachowuje stare wpisy dla ponowień rozpoczętych przed przełączeniem; nowe klucze trafiają do `orderRequests`.

## Etap 4: reguły i administrator

### Konfiguracja i użycie kolekcji

- Firebase Web SDK (`app/lib/firebase.ts`) inicjalizuje klienta i `Auth` z wartości `NEXT_PUBLIC_FIREBASE_*`. Logowanie i rejestracja używają Firebase Authentication email/hasło; `AuthContext` obserwuje sesję. Frontend może pobrać ID token przez `user.getIdToken()`.
- Firebase Admin SDK (`app/lib/firebase-admin.ts`) jest singletonem aplikacji. Używa `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` i `FIREBASE_PRIVATE_KEY`; `adminDb` i `adminAuth` współdzielą tę samą instancję.
- Aplikacja używa `posts`, `categories`, `orders`, `orderRequests`, `baseOrderRequests` i `system`. Publiczne API czyta wyłącznie opublikowane `posts`; panel przegląda i zmienia `categories` oraz tworzy `posts` przez Web SDK. Zamówienia, klucze idempotencji, stare żądania Base.com i sekwencja numerów są używane po stronie serwera przez Admin SDK.
- W repozytorium nie ma oddzielnych konfiguracji projektów dev/test/prod ani aliasu `.firebaserc`. `firebase.json` wskazuje lokalne reguły i emulator na porcie 8080; nie wskazuje projektu produkcyjnego.

### Reguły

`firestore.rules` odmawia klientom wszystkich operacji na `orders`, `orderRequests`, `baseOrderRequests` i `system`. Opublikowane posty są publiczne do odczytu, szkice tylko dla administratorów; zapis postów i odczyt/zapis kategorii wymagają custom claim `admin: true`. Każda inna kolekcja jest domyślnie zablokowana.

Obecne `NEXT_PUBLIC_ADMINACCOUNTS` sprawdza jedynie email w UI i nie nadaje zaufanej roli. Reguły nie uznają tej listy. Dotychczasowi administratorzy muszą otrzymać custom claim `admin: true` na kontach Firebase Authentication przez zaufaną, jednorazową operację operatora Admin SDK, zanim operacje panelu na Firestore będą dozwolone. Nie dodano publicznego endpointu nadawania roli.

Admin SDK pomija reguły Firestore. Każdy przyszły endpoint administracyjny musi wywołać `requireAdmin(request)` z `app/lib/admin-auth.ts`; helper sprawdza Bearer ID token metodą `verifyIdToken(token, true)` (weryfikacja i sprawdzenie unieważnienia), a następnie wymaga claimu `admin === true`. Klient wysyła `Authorization: Bearer ${await user.getIdToken()}`. Helper zwraca tylko UID i zgłasza 401 dla brakującego/błędnego/wygasłego tokenu oraz 403 dla użytkownika bez roli. Nie powstał jeszcze endpoint administracyjny.

### Lokalne sprawdzenie reguł

1. Zainstaluj Firebase CLI i uruchom `firebase emulators:start --only firestore --project demo-natureworld` w katalogu projektu. Użycie identyfikatora `demo-*` nie łączy się z produkcyjnym projektem.
2. Skonfiguruj klienta Firebase testowego z `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-natureworld` i `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` dla testów SDK. Nie używaj kont ani danych produkcyjnych.
3. W emulatorze sprawdź macierz poniżej. Testuj signed-in zwykłego użytkownika tokenem bez claimu oraz administratora z custom claim `admin: true`.

| Scenariusz | Oczekiwany wynik |
| --- | --- |
| Gość czyta/zapisuje zamówienie lub `orderRequests` | odmowa |
| Zwykły zalogowany użytkownik czyta dowolne zamówienie | odmowa |
| Administrator próbuje czytać zamówienie przez Web SDK | odmowa |
| Zwykły użytkownik zmienia kwotę/status zamówienia | odmowa |
| Administrator czyta opublikowany post | dozwolone |
| Gość czyta opublikowany post; próbuje szkic | dozwolone; odmowa |
| Administrator tworzy post lub zmienia kategorię | dozwolone |
| Nieznana kolekcja | odmowa |
| Endpoint z brakiem, błędnym, wygasłym lub unieważnionym ID tokenem | 401 |
| Endpoint z poprawnym tokenem bez claimu admin | 403 |
| Endpoint z poprawnym tokenem i claimem admin | autoryzacja dozwolona |
| Serwerowy zapis przez Admin SDK | reguły go nie oceniają; endpoint sam musi autoryzować i walidować |

Firebase CLI jest dostępne lokalnie, ale Firestore Emulator nie był wcześniej pobrany. Nie wdrażaj reguł z `firebase deploy --only firestore:rules` bez osobnego przeglądu i zatwierdzenia projektu docelowego. Nie umieszczaj service account ani prywatnego klucza w repozytorium.
- Pozycje wariantowe nie są obsługiwane przez obecny adapter katalogu.
- Mechanizm numeracji używa jednego dokumentu licznika; to prosta, atomowa numeracja, ale przy bardzo dużej liczbie jednoczesnych zapisów może stać się punktem kontencji.
- Digest idempotencji jest HMAC z kluczem `FIREBASE_PRIVATE_KEY`; rotacja klucza zmieni digesty dla ponowień starych żądań. Należy uwzględnić to przy rotacji poświadczeń.
- `getFirestoreOrder` jest wyłącznie serwerowym prymitywem odczytu; samo wywołanie nie autoryzuje użytkownika.

## Etap 5: odczyt zamówień w panelu

Panel listy znajduje się pod `/adminpanel/orders`, a szczegóły pod `/adminpanel/orders/{id}`. Endpointy `GET /api/admin/orders` oraz `GET /api/admin/orders/{id}` wymagają Bearer ID tokenu i `requireAdmin`; odpowiedzi są `private, no-store`. Nie udostępniają `idempotencyKey` ani pól spoza jawnego DTO.

Lista sortuje po `createdAt` malejąco i pobiera maksymalnie 25 dokumentów na żądanie. `status` przyjmuje `all` lub status płatności/realizacji; `number` dopasowuje numer NW dokładnie (krótkie numery są dopełniane zerami). Kursor jest walidowany po stronie serwera. `firestore.indexes.json` zawiera indeksy wymagane do filtrowania statusu i sortowania. Panel nie zmienia danych ani statusów zamówień.

## Zarządzanie statusem realizacji

Zmiana używa istniejącego pola `fulfillmentStatus`; nie zmienia statusu płatności. Nowe zamówienia otrzymują `new`. Dozwolone przejścia: `new → processing → ready_to_ship → shipped → completed`; anulowanie jest możliwe z `new`, `processing` i `ready_to_ship`. Statusy `completed` i `cancelled` są końcowe.

Starsze dokumenty mogą nadal mieć `pending` lub `delivered`: panel prezentuje je jako odpowiednio `new` i `completed`, bez migracji istniejących danych. Endpoint PATCH wymaga aktualnej wartości `expectedStatus`, sprawdza przejście w transakcji i aktualizuje wyłącznie `fulfillmentStatus`, `updatedAt` oraz `statusHistory` (status poprzedni/nowy, czas i UID administratora). Historia nie może być zmieniana z żądania klienta.

Ta sekcja aktualizuje opis panelu powyżej: szczegóły zamówienia pozwalają administratorowi zmienić wyłącznie status realizacji zgodnie z wymienionymi przejściami.
