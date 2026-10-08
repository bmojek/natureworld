"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { getPrimaryStorefrontCategories } from "@/app/lib/storefront-categories";
import { extraMenuLinks } from "@/app/lib/menu-links";

export default function Categories() {
  const [tree, setTree] = useState<CategoryTree[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const categories = await getCategories();
      setTree(buildCategoryTree(categories));
    };

    load().catch(() => setTree([]));
  }, []);

  if (!tree) {
    return (
      <nav className="bg-primary">
        <div className="max-w-7xl mx-auto p-3 flex justify-between gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 rounded bg-white/20 animate-pulse"
            />
          ))}
        </div>
      </nav>
    );
  }

  const primaryCategories = getPrimaryStorefrontCategories(tree);

  return (
    <nav className="bg-primary relative z-40 md:block hidden">
      <ul className="mx-auto flex max-w-7xl flex-wrap justify-start gap-x-2 px-4 p-1">
        {primaryCategories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/sklep/kategoria/${category.slugPath.join("/")}`}
              className="flex items-center gap-1 whitespace-nowrap px-4 py-3 font-bold text-white hover:bg-green-800"
            >
              {category.label}
            </Link>
          </li>
        ))}

        {/* EXTRA LINKS */}
        {extraMenuLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block whitespace-nowrap px-4 py-3 font-bold text-white hover:bg-green-800 ${
                item.highlight ? "text-accent" : ""
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
