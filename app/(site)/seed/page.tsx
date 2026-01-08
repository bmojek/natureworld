"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useState } from "react";

type CategorySeed = {
  name: string;
  slug: string;
  parentSlug: string | null;
  level: number;
};

const categories: CategorySeed[] = [
  // 🐶 Psy
  { name: "Psy", slug: "psy", parentSlug: null, level: 0 },
  { name: "Karmy", slug: "psy-karmy", parentSlug: "psy", level: 1 },
  {
    name: "Suche karmy",
    slug: "psy-karmy-suche",
    parentSlug: "psy-karmy",
    level: 2,
  },
  {
    name: "Mokre karmy",
    slug: "psy-karmy-mokre",
    parentSlug: "psy-karmy",
    level: 2,
  },
  { name: "Akcesoria", slug: "psy-akcesoria", parentSlug: "psy", level: 1 },
  { name: "Smycze", slug: "psy-smycze", parentSlug: "psy-akcesoria", level: 2 },
  {
    name: "Zabawki",
    slug: "psy-zabawki",
    parentSlug: "psy-akcesoria",
    level: 2,
  },

  // 🐱 Koty
  { name: "Koty", slug: "koty", parentSlug: null, level: 0 },
  { name: "Karmy", slug: "koty-karmy", parentSlug: "koty", level: 1 },
  {
    name: "Suche karmy",
    slug: "koty-karmy-suche",
    parentSlug: "koty-karmy",
    level: 2,
  },
  {
    name: "Mokre karmy",
    slug: "koty-karmy-mokre",
    parentSlug: "koty-karmy",
    level: 2,
  },
  { name: "Akcesoria", slug: "koty-akcesoria", parentSlug: "koty", level: 1 },
  {
    name: "Kuwety",
    slug: "koty-kuwety",
    parentSlug: "koty-akcesoria",
    level: 2,
  },
  {
    name: "Drapaki",
    slug: "koty-drapaki",
    parentSlug: "koty-akcesoria",
    level: 2,
  },

  // 🐠 Akwarystyka
  { name: "Akwarystyka", slug: "akwarystyka", parentSlug: null, level: 0 },
  { name: "Akwaria", slug: "akwaria", parentSlug: "akwarystyka", level: 1 },
  {
    name: "Małe akwaria",
    slug: "akwaria-male",
    parentSlug: "akwaria",
    level: 2,
  },
  {
    name: "Duże akwaria",
    slug: "akwaria-duze",
    parentSlug: "akwaria",
    level: 2,
  },
  {
    name: "Akcesoria",
    slug: "akwarystyka-akcesoria",
    parentSlug: "akwarystyka",
    level: 1,
  },
  {
    name: "Filtry",
    slug: "filtry",
    parentSlug: "akwarystyka-akcesoria",
    level: 2,
  },
  {
    name: "Oświetlenie",
    slug: "oswietlenie",
    parentSlug: "akwarystyka-akcesoria",
    level: 2,
  },

  // 🐦 Ptaki
  { name: "Ptaki", slug: "ptaki", parentSlug: null, level: 0 },
  { name: "Klatki", slug: "ptaki-klatki", parentSlug: "ptaki", level: 1 },
  {
    name: "Małe ptaki",
    slug: "klatki-male-ptaki",
    parentSlug: "ptaki-klatki",
    level: 2,
  },
  {
    name: "Duże ptaki",
    slug: "klatki-duze-ptaki",
    parentSlug: "ptaki-klatki",
    level: 2,
  },
  { name: "Karmy", slug: "ptaki-karmy", parentSlug: "ptaki", level: 1 },
  { name: "Ziarna", slug: "ptaki-ziarna", parentSlug: "ptaki-karmy", level: 2 },
  {
    name: "Mieszanki",
    slug: "ptaki-mieszanki",
    parentSlug: "ptaki-karmy",
    level: 2,
  },

  // 🌱 Ogrodniczy
  { name: "Ogrodniczy", slug: "ogrodniczy", parentSlug: null, level: 0 },
  { name: "Nasiona", slug: "nasiona", parentSlug: "ogrodniczy", level: 1 },
  { name: "Warzywa", slug: "nasiona-warzywa", parentSlug: "nasiona", level: 2 },
  { name: "Kwiaty", slug: "nasiona-kwiaty", parentSlug: "nasiona", level: 2 },
  {
    name: "Akcesoria",
    slug: "ogrodniczy-akcesoria",
    parentSlug: "ogrodniczy",
    level: 1,
  },
  {
    name: "Doniczki",
    slug: "doniczki",
    parentSlug: "ogrodniczy-akcesoria",
    level: 2,
  },
  {
    name: "Ziemia",
    slug: "ziemia",
    parentSlug: "ogrodniczy-akcesoria",
    level: 2,
  },
];

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seed = async () => {
    setLoading(true);

    const slugToId: Record<string, string> = {};

    for (const cat of categories) {
      const ref = await addDoc(collection(db, "categories"), {
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentSlug ? slugToId[cat.parentSlug] : null,
        level: cat.level,
        createdAt: serverTimestamp(),
      });

      slugToId[cat.slug] = ref.id;
    }

    setLoading(false);
    setDone(true);
  };

  return (
    <main className="p-12 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">DEV – Seed kategorii</h1>

      <button
        onClick={seed}
        disabled={loading || done}
        className="bg-primary text-white px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? "Seeding..." : done ? "Zrobione ✅" : "Seed kategorii"}
      </button>

      <p className="mt-6 text-sm text-text-secondary">
        ⚠️ Uruchom raz i usuń plik
      </p>
    </main>
  );
}
