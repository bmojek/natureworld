"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";

export default function Categories() {
  const [tree, setTree] = useState<CategoryTree[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const categories = await getCategories();
      setTree(buildCategoryTree(categories));
    };
    load();
  }, []);

  /* ================= SKELETON ================= */
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

  /* ================= REAL MENU ================= */
  return (
    <nav className="bg-primary relative z-40 md:block hidden">
      <ul className="flex max-w-7xl mx-auto px-4 p-1 justify-between">
        {tree.map((cat) => (
          <li key={cat.id} className="group">
            <Link
              href={`/kategoria/${cat.slug}`}
              className="block px-4 py-3 font-bold text-white hover:bg-green-800 rounded"
            >
              {cat.name}
            </Link>

            {/* MEGA MENU */}
            {cat.children.length > 0 && (
              <div className="absolute left-0 right-0 top-full bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6 p-6">
                  {cat.children.map((sub) => (
                    <div key={sub.id}>
                      <Link
                        href={`/kategoria/${cat.slug}/${sub.slug}`}
                        className="font-semibold block mb-2 hover:underline"
                      >
                        {sub.name}
                      </Link>

                      <ul className="space-y-1">
                        {sub.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/kategoria/${cat.slug}/${sub.slug}/${child.slug}`}
                              className="text-sm text-text-secondary hover:text-primary"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
