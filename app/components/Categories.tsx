"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { ChevronDown } from "lucide-react";
import { extraMenuLinks } from "@/app/lib/menu-links";

export default function Categories() {
  const [tree, setTree] = useState<CategoryTree[] | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const categories = await getCategories();
      setTree(buildCategoryTree(categories));
    };

    load();
  }, []);

  /* ================= MENU CONTROL ================= */

  const openMenu = (id: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
    }

    setOpenId(id);
  };

  const closeMenu = () => {
    const t = setTimeout(() => {
      setOpenId(null);
    }, 200);

    setCloseTimeout(t);
  };

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

  /* ================= MENU ================= */

  return (
    <nav className="bg-primary relative z-40 md:block hidden">
      <ul className="flex max-w-7xl mx-auto px-4 p-1 justify-between">
        {tree.map((cat) => (
          <li
            key={cat.id}
            onMouseEnter={() => openMenu(cat.id)}
            onMouseLeave={closeMenu}
          >
            <Link
              href={`/kategoria/${cat.slug}`}
              onClick={() => setOpenId(null)}
              className="flex items-center gap-1 px-4 py-3 font-bold text-white hover:bg-green-800"
            >
              {cat.name}

              {cat.children.length > 0 && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    openId === cat.id ? "rotate-180" : ""
                  }`}
                />
              )}
            </Link>

            {/* MEGA MENU */}

            {cat.children.length > 0 && (
              <div
                onMouseEnter={() => openMenu(cat.id)}
                onMouseLeave={closeMenu}
                className={`
                  absolute left-0 right-0 top-full bg-background shadow-lg
                  transition-all duration-200
                  ${
                    openId === cat.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }
                `}
              >
                <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6 p-6">
                  {cat.children.map((sub) => (
                    <div key={sub.id}>
                      <Link
                        href={`/kategoria/${cat.slug}/${sub.slug}`}
                        onClick={() => setOpenId(null)}
                        className="font-semibold block mb-2 hover:underline"
                      >
                        {sub.name}
                      </Link>

                      <ul className="space-y-1">
                        {sub.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/kategoria/${cat.slug}/${sub.slug}/${child.slug}`}
                              onClick={() => setOpenId(null)}
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

        {/* EXTRA LINKS */}

        {extraMenuLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpenId(null)}
              className={`block px-4 py-3 font-bold text-white hover:bg-green-800 ${
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
