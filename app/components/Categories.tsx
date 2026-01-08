"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";

export default function Categories() {
  const [tree, setTree] = useState<CategoryTree[]>([]);

  useEffect(() => {
    const load = async () => {
      const categories = await getCategories();
      setTree(buildCategoryTree(categories));
    };
    load();
  }, []);

  return (
    <nav className="bg-primary shadow relative z-50">
      <ul className="flex justify-between max-w-7xl mx-auto p-2">
        {tree.map((cat) => (
          <li key={cat.id} className="group">
            {/* Kategoria główna */}
            <Link
              href={`/kategoria/${cat.slug}`}
              className="px-4 py-2 font-bold text-white cursor-pointer hover:bg-green-800 rounded block"
            >
              {cat.name}
            </Link>

            {/* Mega menu */}
            {cat.children.length > 0 && (
              <div className="absolute top-full left-0 w-screen bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ">
                <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6 p-6">
                  {cat.children.map((sub) => (
                    <div key={sub.id}>
                      <Link
                        href={`/kategoria/${cat.slug}/${sub.slug}`}
                        className="font-semibold block mb-2 hover:underline"
                      >
                        {sub.name}
                      </Link>

                      {/* poziom 3 */}
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
