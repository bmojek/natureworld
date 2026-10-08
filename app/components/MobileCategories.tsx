"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { getPrimaryStorefrontCategories } from "@/app/lib/storefront-categories";

export default function MobileCategories({ onClose }: { onClose: () => void }) {
  const [tree, setTree] = useState<CategoryTree[]>([]);

  useEffect(() => {
    const load = async () => {
      const categories = await getCategories();
      setTree(buildCategoryTree(categories));
    };
    load().catch(() => setTree([]));
  }, []);

  const primaryCategories = getPrimaryStorefrontCategories(tree);

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      {/* PANEL */}
      <div className="absolute left-0 top-0 h-full w-80 bg-background shadow-xl p-4 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-lg font-semibold">Główne działy</p>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* LISTA */}
        <ul className="space-y-2">
          {primaryCategories.map((category) => (
            <li key={category.id} className="border-b pb-2">
              <Link
                href={`/sklep/kategoria/${category.slugPath.join("/")}`}
                onClick={onClose}
                className="block py-3 font-medium"
              >
                {category.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
