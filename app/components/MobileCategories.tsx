"use client";

import Link from "next/link";
import { X, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";

export default function MobileCategories({ onClose }: { onClose: () => void }) {
  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const categories = await getCategories();
      setTree(buildCategoryTree(categories));
    };
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      {/* PANEL */}
      <div className="absolute left-0 top-0 h-full w-80 bg-background shadow-xl p-4 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-lg font-semibold">Kategorie</p>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* LISTA */}
        <ul className="space-y-2">
          {tree.map((cat) => {
            const isOpen = openId === cat.id;

            return (
              <li key={cat.id} className="border-b pb-2">
                <button
                  onClick={() => setOpenId(isOpen ? null : cat.id)}
                  className="w-full flex justify-between items-center font-medium py-2"
                >
                  {cat.name}
                  <ChevronDown
                    size={18}
                    className={`transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* PODKATEGORIE */}
                {isOpen && (
                  <ul className="pl-4 mt-2 space-y-2">
                    {cat.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/kategoria/${cat.slug}/${sub.slug}`}
                          onClick={onClose}
                          className="block text-sm font-medium"
                        >
                          {sub.name}
                        </Link>

                        {/* poziom 3 */}
                        {sub.children.length > 0 && (
                          <ul className="pl-4 mt-1 space-y-1">
                            {sub.children.map((child) => (
                              <li key={child.id}>
                                <Link
                                  href={`/kategoria/${cat.slug}/${sub.slug}/${child.slug}`}
                                  onClick={onClose}
                                  className="block text-sm text-text-secondary"
                                >
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
