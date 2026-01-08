import Link from "next/link";
import { getCategories } from "@/app/lib/firestore-categories";
import { buildCategoryTree } from "@/app/lib/categories";
import {
  findCategoryBySlugPath,
  collectCategoryIds,
  findParentCategory,
} from "@/app/lib/category-utils";
import { getProductsByCategoryIds } from "@/app/lib/firestore-products";
import Image from "next/image";

type PageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const categories = await getCategories();
  const tree = buildCategoryTree(categories);

  const category = findCategoryBySlugPath(tree, slug);

  if (!category) {
    return <div className="p-12">Nie znaleziono kategorii</div>;
  }

  const categoryIds = collectCategoryIds(category);

  const products = await getProductsByCategoryIds(categoryIds);

  const parentCategory = findParentCategory(tree, category.parentId);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
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
            <input type="range" min={0} max={500} className="w-full" />
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
        <nav className="text-sm text-text-secondary mb-4">
          {slug.map((s, i) => (
            <span key={i}>
              {" / "}
              <Link href={`/kategoria/${slug.slice(0, i + 1).join("/")}`}>
                {s.replaceAll("-", " ")}
              </Link>
            </span>
          ))}
        </nav>

        <h1 className="text-2xl font-bold mb-6">{category.name}</h1>

        {products.length === 0 ? (
          <p className="text-text-secondary">Brak produktów w tej kategorii</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className=" rounded-xl p-4 hover:shadow transition"
              >
                <Image
                  src={"/api/image/" + p.images[0]}
                  alt="Produkt"
                  width={200}
                  height={200}
                />
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-text-secondary">
                  {p.price.toFixed(2)} zł
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
