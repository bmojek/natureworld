# Integracja BaseLinker

## Stan

Serwerowy transport znajduje się w `app/lib/base-linker.ts`, a mapowanie katalogu w `app/lib/base-store.ts`. Token jest wysyłany do Base w nagłówku `X-BLToken`; kod klienta go nie otrzymuje.

Sklep pobiera kategorie metodą `getInventoryCategories`, listy metodą `getInventoryProductsList`, a opisy i zdjęcia metodą `getInventoryProductsData`. Stany czytane są z magazynu `bl_47289` po odjęciu rezerwacji, a ceny z grupy `25779`. Base zwraca nazwy kategorii jako ścieżki, które adapter zamienia w drzewo nawigacji. Zdjęcia z Base są wyświetlane z ich URL-i.

Produkty i kategorie sklepu pochodzą z Base, nie z kolekcji `products`/`categories` Firestore. Listing ma krótkie cache serwerowe. Checkout nadal weryfikuje aktualne ceny i stany w Base, ale nowe zamówienia zapisuje w Firestore. Dostępna płatność to COD; płatności online nie są podłączone.

## Konfiguracja

1. Wygeneruj token API w panelu BaseLinker i skopiuj pełną wartość.
2. Ustaw go jako `BASELINKER_API_TOKEN` w `.env.local`.
3. Nie commituj `.env.local` i nie wystawiaj tokena przez `NEXT_PUBLIC_*`.

Obecna konfiguracja używa katalogu `29152`, grupy cenowej `25779` i magazynu `bl_47289`. Wartości nie są sekretami; token API jest sekretem.

## Docelowy przepływ

Checkout ponownie waliduje ceny i dostępność po stronie serwera. Nowe zamówienia oraz migawki danych klientów są zapisywane w Firestore `orders`, a `orderRequests` zapewnia idempotencję. `baseOrderRequests` pozostaje do obsługi prób z poprzedniej wersji checkoutu i nie jest kasowana. Włącz TTL w Firestore dla pola `expireAt` w tej starej kolekcji, jeśli nie jest już włączony. Koszyk przeglądarki nie jest źródłem prawdy dla ceny ani stanu. Odczyt z Base nie rezerwuje towaru.

## Dane poza katalogiem

Firebase Authentication działa bez Firestore. Firestore pozostaje używany do treści redakcyjnych i nadal jest dostępny w starym panelu kategorii, ale kategorie widoczne w sklepie są pobierane z Base.
