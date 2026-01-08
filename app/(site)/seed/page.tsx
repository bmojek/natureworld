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
  // 🐶 PSY
  {
    name: "Sucha karma Premium dla psa",
    slug: "karma-premium-pies-sucha",
    price: 129.99,
    categorySlugs: ["psy-karmy-suche"],
  },
  {
    name: "Mokra karma wołowina 400g",
    slug: "karma-mokra-wolowina-pies",
    price: 9.99,
    categorySlugs: ["psy-karmy-mokre"],
  },
  {
    name: "Zabawka gumowa dla psa",
    slug: "zabawka-gumowa-pies",
    price: 24.99,
    categorySlugs: ["psy-zabawki"],
  },
  {
    name: "Smycz regulowana 2m",
    slug: "smycz-regulowana-2m",
    price: 39.99,
    categorySlugs: ["psy-smycze"],
  },

  // 🐱 KOTY
  {
    name: "Sucha karma Adult dla kota",
    slug: "karma-sucha-adult-kot",
    price: 99.99,
    categorySlugs: ["koty-karmy-suche"],
  },
  {
    name: "Mokra karma indyk 85g",
    slug: "karma-mokra-indyk-kot",
    price: 6.99,
    categorySlugs: ["koty-karmy-mokre"],
  },
  {
    name: "Drapak stojący XL",
    slug: "drapak-stojacy-xl",
    price: 249.99,
    categorySlugs: ["koty-drapaki"],
  },
  {
    name: "Kuweta zamknięta",
    slug: "kuweta-zamknieta",
    price: 89.99,
    categorySlugs: ["koty-kuwety"],
  },

  // 🐠 AKWARYSTYKA
  {
    name: "Akwarium szklane 60L",
    slug: "akwarium-60l",
    price: 299.99,
    categorySlugs: ["akwaria-male"],
  },
  {
    name: "Akwarium panoramiczne 200L",
    slug: "akwarium-200l",
    price: 999.99,
    categorySlugs: ["akwaria-duze"],
  },
  {
    name: "Filtr wewnętrzny AquaClean",
    slug: "filtr-wewnetrzny-aquaclean",
    price: 79.99,
    categorySlugs: ["filtry"],
  },
  {
    name: "Oświetlenie LED do akwarium",
    slug: "oswietlenie-led-akwarium",
    price: 119.99,
    categorySlugs: ["oswietlenie"],
  },

  // 🐦 PTAKI
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

  // 🌱 OGRODNICZY
  {
    name: "Nasiona marchwi",
    slug: "nasiona-marchwi",
    price: 4.99,
    categorySlugs: ["nasiona-warzywa"],
  },
  {
    name: "Nasiona kwiatów ogrodowych",
    slug: "nasiona-kwiaty-ogrodowe",
    price: 5.99,
    categorySlugs: ["nasiona-kwiaty"],
  },
  {
    name: "Doniczka ceramiczna 20cm",
    slug: "doniczka-ceramiczna-20cm",
    price: 29.99,
    categorySlugs: ["doniczki"],
  },
  {
    name: "Ziemia uniwersalna 20L",
    slug: "ziemia-uniwersalna-20l",
    price: 19.99,
    categorySlugs: ["ziemia"],
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
