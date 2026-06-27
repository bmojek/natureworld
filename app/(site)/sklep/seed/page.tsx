"use client";

import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

type Cat = {
  name: string;
  slug: string;
  parent?: string;
};

const cats: Cat[] = [
  { name: "Ogród", slug: "ogrod" },
  { name: "Zwierzęta", slug: "zwierzeta" },
  { name: "Święta", slug: "swieta" },

  { name: "Nasiona", slug: "nasiona", parent: "ogrod" },
  { name: "Warzywa", slug: "warzywa", parent: "nasiona" },
  { name: "Zioła", slug: "ziola", parent: "nasiona" },
  { name: "Ozdobne", slug: "ozdobne", parent: "nasiona" },

  { name: "Doniczki", slug: "doniczki", parent: "ogrod" },
  { name: "Osłonki", slug: "oslonki", parent: "doniczki" },

  { name: "Nawozy", slug: "nawozy", parent: "ogrod" },
  { name: "Podłoża", slug: "podloza", parent: "ogrod" },

  { name: "Psy", slug: "psy", parent: "zwierzeta" },
  { name: "Koty", slug: "koty", parent: "zwierzeta" },
  { name: "Akwarystyka", slug: "akwarystyka", parent: "zwierzeta" },

  { name: "Wielkanoc", slug: "wielkanoc", parent: "swieta" },
  { name: "Figurki", slug: "figurki", parent: "wielkanoc" },
  { name: "Zawieszki", slug: "zawieszki", parent: "wielkanoc" },
  { name: "Koszyczki", slug: "koszyczki", parent: "wielkanoc" },
];

export default function SeedCategories() {
  const seed = async () => {
    const slugToId: Record<string, string> = {};
    const slugToLevel: Record<string, number> = {};

    for (const cat of cats) {
      let parentId = null;
      let level = 0;

      if (cat.parent) {
        parentId = slugToId[cat.parent];
        level = (slugToLevel[cat.parent] ?? 0) + 1;
      }

      const ref = await addDoc(collection(db, "categories"), {
        name: cat.name,
        slug: cat.slug,
        parentId,
        level,
      });

      slugToId[cat.slug] = ref.id;
      slugToLevel[cat.slug] = level;
    }

    alert("DONE");
  };

  return (
    <div className="p-10">
      <button onClick={seed} className="bg-black text-white px-6 py-3">
        Seed categories
      </button>
    </div>
  );
}
