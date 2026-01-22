import Link from "next/link";
import { headers } from "next/headers";
import { buildCategoryTree } from "@/app/lib/categories";
import {
  findCategoryBySlugPath,
  collectCategoryIds,
  findParentCategory,
} from "@/app/lib/category-utils";
import ProductsInfinite from "./products-infinite";
import { CategoryModel } from "@/app/models/category";
import { House } from "lucide-react";

type PageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

// 🔑 FETCH Z API – TYLKO TUTAJ
async function fetchCategories(): Promise<CategoryModel[]> {
  const h = await headers();
  const host = h.get("host");

  if (!host) {
    throw new Error("Missing host header");
  }

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/categories`, {
    next: { revalidate: 300 }, // cache Next.js
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
}

export default async function CategoryPage({ params }: PageProps) {
  // 🔑 ZAWSZE await params
  const { slug } = await params;

  // ✅ API zamiast Firestore
  const categories = await fetchCategories();
  const tree = buildCategoryTree(categories);

  const category = findCategoryBySlugPath(tree, slug);
  if (!category) {
    return <div className="p-12">Nie znaleziono kategorii</div>;
  }

  const categoryIds = collectCategoryIds(category);
  const parentCategory = findParentCategory(tree, category.parentId);

  return (
    <main className="max-w-7xl min-h-screen mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* ================= SIDEBAR ================= */}
      <aside className="space-y-8">
        {/* KATEGORIE */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Kategorie</h2>

          {/* ⬆️ POWRÓT WYŻEJ */}
          {parentCategory && (
            <Link
              href={`/kategoria/${slug.slice(0, -1).join("/")}`}
              className="block text-sm text-primary mb-3"
            >
              ← {parentCategory.name}
            </Link>
          )}

          {/* ⬇️ PODKATEGORIE */}
          {category.children.length > 0 ? (
            <ul className="space-y-2">
              {category.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/kategoria/${[...slug, child.slug].join("/")}`}
                    className="text-sm hover:underline"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">Brak podkategorii</p>
          )}
        </div>

        {/* FILTRY */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Filtry</h2>

          <div className="mb-4">
            <p className="font-medium mb-2">Cena</p>
            <input type="range" min={0} max={500} className="w-full " />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Tylko dostępne
          </label>
        </div>
      </aside>

      {/* ================= PRODUKTY ================= */}
      <section className="md:col-span-3">
        {/* BREADCRUMBS */}
        <nav className="text-sm text-text-secondary mb-4 flex items-center gap-1">
          <Link href="/" className="flex items-center">
            <House size={14} />
          </Link>

          {slug.map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>/</span>
              <Link href={`/kategoria/${slug.slice(0, i + 1).join("/")}`}>
                {s.replaceAll("-", " ")}
              </Link>
            </span>
          ))}
        </nav>

        <h1 className="text-2xl font-bold mb-6">{category.name}</h1>

        <ProductsInfinite categoryIds={categoryIds} />
      </section>
    </main>
  );
}
