"use client";

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useState } from "react";

type ProductSeed = {
  name: string;
  slug: string;
  price: number;
  categorySlugs: string[];
};

const products: ProductSeed[] = [
  // 🐶 PSY – 20 produktów
  {
    name: "Sucha karma Premium dla psa",
    slug: "karma-premium-pies-sucha",
    price: 129.99,
    categorySlugs: ["psy-karmy-suche"],
  },
  {
    name: "Karma dla szczeniąt 2kg",
    slug: "karma-szczeniat-2kg",
    price: 119.99,
    categorySlugs: ["psy-karmy-suche"],
  },
  {
    name: "Karma hipoalergiczna 2kg",
    slug: "karma-hipoalergiczna-pies",
    price: 159.99,
    categorySlugs: ["psy-karmy-suche"],
  },
  {
    name: "Karma bez zbóż 1.5kg",
    slug: "karma-bez-zboz-1-5kg",
    price: 139.99,
    categorySlugs: ["psy-karmy-suche"],
  },
  {
    name: "Mokra karma wołowina 400g",
    slug: "karma-mokra-wolowina-pies",
    price: 9.99,
    categorySlugs: ["psy-karmy-mokre"],
  },
  {
    name: "Mokra karma kurczak 400g",
    slug: "karma-mokra-kurczak-pies",
    price: 8.99,
    categorySlugs: ["psy-karmy-mokre"],
  },
  {
    name: "Mokra karma indyk 400g",
    slug: "karma-mokra-indyk-pies",
    price: 9.49,
    categorySlugs: ["psy-karmy-mokre"],
  },
  {
    name: "Zabawka gumowa dla psa",
    slug: "zabawka-gumowa-pies",
    price: 24.99,
    categorySlugs: ["psy-zabawki"],
  },
  {
    name: "Piłka tenisowa dla psa",
    slug: "pilka-tenisowa-pies",
    price: 14.99,
    categorySlugs: ["psy-zabawki"],
  },
  {
    name: "Kong klasyczny",
    slug: "kong-klasyczny",
    price: 34.99,
    categorySlugs: ["psy-zabawki"],
  },
  {
    name: "Smycz regulowana 2m",
    slug: "smycz-regulowana-2m",
    price: 39.99,
    categorySlugs: ["psy-smycze"],
  },
  {
    name: "Obroża skórzana M",
    slug: "obroza-skorzana-m",
    price: 49.99,
    categorySlugs: ["psy-smycze"],
  },
  {
    name: "Smycz automatyczna 5m",
    slug: "smycz-automatyczna-5m",
    price: 59.99,
    categorySlugs: ["psy-smycze"],
  },
  {
    name: "Legowisko ortopedyczne XL",
    slug: "legowisko-ortopedyczne-xl",
    price: 349.99,
    categorySlugs: ["psy-zabawki"],
  },
  {
    name: "Legowisko pluszowe M",
    slug: "legowisko-pluszowe-m",
    price: 179.99,
    categorySlugs: ["psy-zabawki"],
  },
  {
    name: "Przysmaki dentystyczne 200g",
    slug: "przysmaki-dentystyczne-200g",
    price: 29.99,
    categorySlugs: ["psy-karmy-mokre"],
  },
  {
    name: "Przysmaki mięsne 150g",
    slug: "przysmaki-miesne-150g",
    price: 19.99,
    categorySlugs: ["psy-karmy-mokre"],
  },
  {
    name: "Karma z rybą 1kg",
    slug: "karma-ryba-1kg",
    price: 119.99,
    categorySlugs: ["psy-karmy-suche"],
  },
  {
    name: "Karma dla seniora 2kg",
    slug: "karma-senior-2kg",
    price: 129.99,
    categorySlugs: ["psy-karmy-suche"],
  },
  {
    name: "Zabawka szarpak XL",
    slug: "zabawka-szarpak-xl",
    price: 39.99,
    categorySlugs: ["psy-zabawki"],
  },

  // 🐱 KOTY – 20 produktów
  {
    name: "Sucha karma Adult dla kota",
    slug: "karma-sucha-adult-kot",
    price: 99.99,
    categorySlugs: ["koty-karmy-suche"],
  },
  {
    name: "Karma dla kotów sterylizowanych",
    slug: "karma-sterylizowane-koty",
    price: 89.99,
    categorySlugs: ["koty-karmy-suche"],
  },
  {
    name: "Karma z łososiem 1.5kg",
    slug: "karma-losos-1-5kg",
    price: 119.99,
    categorySlugs: ["koty-karmy-suche"],
  },
  {
    name: "Mokra karma indyk 85g",
    slug: "karma-mokra-indyk-kot",
    price: 6.99,
    categorySlugs: ["koty-karmy-mokre"],
  },
  {
    name: "Mokra karma łosoś 85g",
    slug: "karma-mokra-losos-kot",
    price: 7.49,
    categorySlugs: ["koty-karmy-mokre"],
  },
  {
    name: "Mokra karma tuńczyk 85g",
    slug: "karma-mokra-tunczyk-kot",
    price: 7.99,
    categorySlugs: ["koty-karmy-mokre"],
  },
  {
    name: "Drapak stojący XL",
    slug: "drapak-stojacy-xl",
    price: 249.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Drapak wiszący średni",
    slug: "drapak-wiszacy-sredni",
    price: 149.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Tunel zabawowy dla kota",
    slug: "tunel-zabawowy-kot",
    price: 49.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Kuweta zamknięta",
    slug: "kuweta-zamknieta",
    price: 89.99,
    categorySlugs: ["koty-kuwety"],
  },
  {
    name: "Kuweta otwarta mała",
    slug: "kuweta-otwarta-mala",
    price: 49.99,
    categorySlugs: ["koty-kuwety"],
  },
  {
    name: "Żwirek bentonitowy 10L",
    slug: "zwirek-bentonitowy-10l",
    price: 29.99,
    categorySlugs: ["koty-kuwety"],
  },
  {
    name: "Legowisko dla kota z poduszką",
    slug: "legowisko-kot-poduszka",
    price: 129.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Legowisko pluszowe M",
    slug: "legowisko-pluszowe-kot-m",
    price: 89.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Przysmaki kocie 100g",
    slug: "przysmaki-kocie-100g",
    price: 14.99,
    categorySlugs: ["koty-karmy-mokre"],
  },
  {
    name: "Karma dla kota seniora 1.5kg",
    slug: "karma-senior-kot-1-5kg",
    price: 109.99,
    categorySlugs: ["koty-karmy-suche"],
  },
  {
    name: "Karma bezzbożowa 1kg",
    slug: "karma-bezzbozowa-kot-1kg",
    price: 129.99,
    categorySlugs: ["koty-karmy-suche"],
  },
  {
    name: "Zabawka wędka dla kota",
    slug: "zabawka-wedka-kot",
    price: 24.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Piłeczki kocie 5szt",
    slug: "pileczki-kocie-5szt",
    price: 19.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Tuna mousse 85g",
    slug: "tuna-mousse-85g",
    price: 8.99,
    categorySlugs: ["koty-karmy-mokre"],
  },

  // 🐠 AKWARYSTYKA – 15 produktów
  {
    name: "Akwarium szklane 60L",
    slug: "akwarium-60l",
    price: 299.99,
    categorySlugs: ["akwaria-male"],
  },
  {
    name: "Akwarium szklane 30L",
    slug: "akwarium-30l",
    price: 199.99,
    categorySlugs: ["akwaria-male"],
  },
  {
    name: "Akwarium panoramiczne 200L",
    slug: "akwarium-200l",
    price: 999.99,
    categorySlugs: ["akwaria-duze"],
  },
  {
    name: "Akwarium panoramiczne 150L",
    slug: "akwarium-150l",
    price: 799.99,
    categorySlugs: ["akwaria-duze"],
  },
  {
    name: "Filtr wewnętrzny AquaClean",
    slug: "filtr-wewnetrzny-aquaclean",
    price: 79.99,
    categorySlugs: ["filtry"],
  },
  {
    name: "Filtr zewnętrzny 300L/h",
    slug: "filtr-zewnetrzny-300l",
    price: 199.99,
    categorySlugs: ["filtry"],
  },
  {
    name: "Oświetlenie LED do akwarium",
    slug: "oswietlenie-led-akwarium",
    price: 119.99,
    categorySlugs: ["oswietlenie"],
  },
  {
    name: "Oświetlenie LED RGB 60cm",
    slug: "oswietlenie-rgb-60cm",
    price: 149.99,
    categorySlugs: ["oswietlenie"],
  },
  {
    name: "Grzałka akwariowa 100W",
    slug: "grzalka-akwariowa-100w",
    price: 49.99,
    categorySlugs: ["filtry"],
  },
  {
    name: "Rośliny sztuczne 5szt",
    slug: "rosliny-sztuczne-5szt",
    price: 34.99,
    categorySlugs: ["oswietlenie"],
  },
  {
    name: "Podłoże naturalne 10kg",
    slug: "podloze-naturalne-10kg",
    price: 79.99,
    categorySlugs: ["filtry"],
  },
  {
    name: "Akwarium nano 20L",
    slug: "akwarium-nano-20l",
    price: 149.99,
    categorySlugs: ["akwaria-male"],
  },
  {
    name: "Filtr gąbkowy 50L/h",
    slug: "filtr-gabkowy-50l",
    price: 29.99,
    categorySlugs: ["filtry"],
  },
  {
    name: "Oświetlenie LED 30cm",
    slug: "oswietlenie-led-30cm",
    price: 89.99,
    categorySlugs: ["oswietlenie"],
  },
  {
    name: "Grzałka mini 50W",
    slug: "grzalka-mini-50w",
    price: 39.99,
    categorySlugs: ["filtry"],
  },

  // 🐦 PTAKI – 10 produktów
  {
    name: "Klatka dla małych ptaków",
    slug: "klatka-male-ptaki",
    price: 159.99,
    categorySlugs: ["klatki-male-ptaki"],
  },
  {
    name: "Klatka dla dużych ptaków",
    slug: "klatka-duze-ptaki",
    price: 299.99,
    categorySlugs: ["klatki-duze-ptaki"],
  },
  {
    name: "Ziarna premium dla ptaków",
    slug: "ziarna-premium-ptaki",
    price: 12.99,
    categorySlugs: ["ptaki-ziarna"],
  },
  {
    name: "Mieszanka ziaren deluxe",
    slug: "mieszanka-ziaren-deluxe",
    price: 16.99,
    categorySlugs: ["ptaki-mieszanki"],
  },
  {
    name: "Ziarna słonecznika 1kg",
    slug: "ziarna-slonecznika-1kg",
    price: 9.99,
    categorySlugs: ["ptaki-ziarna"],
  },
  {
    name: "Mieszanka egzotyczna 500g",
    slug: "mieszanka-egzotyczna-500g",
    price: 14.99,
    categorySlugs: ["ptaki-mieszanki"],
  },
  {
    name: "Bloczki mineralne dla ptaków",
    slug: "bloczek-mineralny-ptaki",
    price: 9.99,
    categorySlugs: ["ptaki-mieszanki"],
  },
  {
    name: "Huśtawka dla ptaków",
    slug: "hustawka-ptaki",
    price: 29.99,
    categorySlugs: ["ptaki-mieszanki"],
  },
  {
    name: "Podkarmka dla ptaków",
    slug: "podkarmka-ptaki",
    price: 19.99,
    categorySlugs: ["ptaki-ziarna"],
  },
  {
    name: "Zabawka dla papug",
    slug: "zabawka-papugi",
    price: 34.99,
    categorySlugs: ["ptaki-mieszanki"],
  },

  // 🌱 OGRODNICZY – 15 produktów
  {
    name: "Nasiona marchwi",
    slug: "nasiona-marchwi",
    price: 4.99,
    categorySlugs: ["nasiona-warzywa"],
  },
  {
    name: "Nasiona sałaty",
    slug: "nasiona-salaty",
    price: 3.99,
    categorySlugs: ["nasiona-warzywa"],
  },
  {
    name: "Nasiona pomidorów cherry",
    slug: "nasiona-pomidorow-cherry",
    price: 6.49,
    categorySlugs: ["nasiona-warzywa"],
  },
  {
    name: "Nasiona ogórka gruntowego",
    slug: "nasiona-ogorka-gruntowego",
    price: 5.99,
    categorySlugs: ["nasiona-warzywa"],
  },
  {
    name: "Nasiona kwiatów ogrodowych",
    slug: "nasiona-kwiaty-ogrodowe",
    price: 5.99,
    categorySlugs: ["nasiona-kwiaty"],
  },
  {
    name: "Nasiona kwiatów jednorocznych",
    slug: "nasiona-kwiaty-jednoroczne",
    price: 4.99,
    categorySlugs: ["nasiona-kwiaty"],
  },
  {
    name: "Doniczka ceramiczna 20cm",
    slug: "doniczka-ceramiczna-20cm",
    price: 29.99,
    categorySlugs: ["doniczki"],
  },
  {
    name: "Doniczka plastikowa 15cm",
    slug: "doniczka-plastikowa-15cm",
    price: 14.99,
    categorySlugs: ["doniczki"],
  },
  {
    name: "Doniczka prostokątna 30cm",
    slug: "doniczka-prostokatna-30cm",
    price: 39.99,
    categorySlugs: ["doniczki"],
  },
  {
    name: "Ziemia uniwersalna 20L",
    slug: "ziemia-uniwersalna-20l",
    price: 19.99,
    categorySlugs: ["ziemia"],
  },
  {
    name: "Ziemia do storczyków 5L",
    slug: "ziemia-storczyki-5l",
    price: 24.99,
    categorySlugs: ["ziemia"],
  },
  {
    name: "Ziemia torfowa 10L",
    slug: "ziemia-torfowa-10l",
    price: 14.99,
    categorySlugs: ["ziemia"],
  },
  {
    name: "Nawóz organiczny 1kg",
    slug: "nawoz-organiczny-1kg",
    price: 29.99,
    categorySlugs: ["ziemia"],
  },
  {
    name: "Sekator ogrodowy",
    slug: "sekator-ogrodowy",
    price: 34.99,
    categorySlugs: ["doniczki"],
  },
  {
    name: "Grabie ogrodowe",
    slug: "grabie-ogrodowe",
    price: 24.99,
    categorySlugs: ["doniczki"],
  },
];

export default function SeedProductsPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seed = async () => {
    setLoading(true);

    // 🔹 mapowanie slug → id kategorii
    const catSnap = await getDocs(collection(db, "categories"));
    const slugToId: Record<string, string> = {};

    catSnap.forEach((doc) => {
      slugToId[doc.data().slug] = doc.id;
    });

    for (const product of products) {
      const categoryIds = product.categorySlugs.map((slug) => {
        const id = slugToId[slug];
        if (!id) throw new Error(`Brak kategorii: ${slug}`);
        return id;
      });

      await addDoc(collection(db, "products"), {
        name: product.name,
        slug: product.slug,
        description: "Przykładowy opis produktu",
        price: product.price,
        images: ["logo.webp"],
        categoryIds,
        stock: 25,
        active: true,
        createdAt: serverTimestamp(),
      });
    }

    setLoading(false);
    setDone(true);
  };

  return (
    <main className="p-12 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">DEV – Seed produktów</h1>

      <button
        onClick={seed}
        disabled={loading || done}
        className="bg-primary text-white px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? "Seeding..." : done ? "Zrobione ✅" : "Seed produktów"}
      </button>

      <p className="mt-6 text-sm text-text-secondary">
        ⚠️ Uruchom raz i usuń plik
      </p>
    </main>
  );
}
