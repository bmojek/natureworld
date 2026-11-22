import type { MetadataRoute } from "next";
import { buildCategoryTree } from "@/app/lib/categories";
import { getBaseCategories, getBaseProductSitemapSlugs } from "@/app/lib/base-store";
import { resolveStorefrontDepartments } from "@/app/lib/storefront-categories";

const siteUrl = new URL(
  (process.env.NEXT_PUBLIC_SITE_URL || "https://nature-world.pl").replace(/\/+$/, ""),
);

// Product and category paths are refreshed daily. The catalog helper reads the
// shared BaseLinker cache and does not request individual product details.
export const revalidate = 86_400;

const staticEntries: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/sklep", changeFrequency: "daily", priority: 0.9 },
  { path: "/sklep/dzial/zwierzeta", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sklep/dzial/ogrod", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sklep/dzial/dom", changeFrequency: "weekly", priority: 0.8 },
  { path: "/aktualnosci", changeFrequency: "weekly", priority: 0.7 },
  { path: "/sklep/artykuly", changeFrequency: "weekly", priority: 0.7 },
  { path: "/dostawa-i-zwroty", changeFrequency: "monthly", priority: 0.5 },
  { path: "/regulamin", changeFrequency: "yearly", priority: 0.3 },
  { path: "/polityka-prywatnosci", changeFrequency: "yearly", priority: 0.3 },
  { path: "/formularz-odstapienia", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = new Map(staticEntries.map((entry) => [entry.path, entry]));
  const [categoriesResult, productsResult] = await Promise.allSettled([
    getBaseCategories(),
    getBaseProductSitemapSlugs(),
  ]);

  if (categoriesResult.status === "fulfilled") {
    try {
      const tree = buildCategoryTree(categoriesResult.value);

      for (const department of resolveStorefrontDepartments(tree)) {
        for (const root of department.roots) {
          const visit = (category: (typeof root)["category"], slugs: string[]) => {
            if (category.hasProducts !== false) {
              const path = `/sklep/kategoria/${slugs.map(encodeURIComponent).join("/")}`;
              entries.set(path, { path, changeFrequency: "weekly", priority: 0.6 });
            }
            for (const child of category.children) visit(child, [...slugs, child.slug]);
          };

          visit(root.category, root.slugPath);
        }
      }
    } catch {
      // Keep static pages available if category conversion fails.
    }
  }

  if (productsResult.status === "fulfilled") {
    for (const slug of productsResult.value) {
      const path = `/sklep/produkt/${encodeURIComponent(slug)}`;
      entries.set(path, { path, changeFrequency: "weekly", priority: 0.7 });
    }
  }

  return [...entries.values()].map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority,
  }));
}
