import type { MetadataRoute } from "next";
import { buildCategoryTree } from "@/app/lib/categories";
import { getBaseCategories } from "@/app/lib/base-store";
import { resolveStorefrontDepartments } from "@/app/lib/storefront-categories";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nature-world.pl");

// Refresh the sitemap daily. Category data uses the existing shared BaseLinker
// cache; this does not enumerate products or fan out into per-category queries.
export const revalidate = 86_400;

const staticPaths = [
  "/",
  "/sklep",
  "/sklep/dzial/zwierzeta",
  "/sklep/dzial/ogrod",
  "/sklep/dzial/dom",
  "/aktualnosci",
  "/sklep/artykuly",
  "/regulamin",
  "/polityka-prywatnosci",
  "/dostawa-i-zwroty",
  "/formularz-odstapienia",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let paths = [...staticPaths];

  try {
    const tree = buildCategoryTree(await getBaseCategories());
    const dynamicPaths = new Set<string>();

    for (const department of resolveStorefrontDepartments(tree)) {
      for (const root of department.roots) {
        const visit = (category: (typeof root)["category"], slugs: string[]) => {
          if (category.hasProducts !== false) {
            dynamicPaths.add(`/sklep/kategoria/${slugs.map(encodeURIComponent).join("/")}`);
          }
          for (const child of category.children) {
            visit(child, [...slugs, child.slug]);
          }
        };
        visit(root.category, root.slugPath);
      }
    }

    paths = [...paths, ...dynamicPaths];
  } catch {
    // Keep the known public sitemap available if BaseLinker is temporarily down.
  }

  const uniquePaths = [...new Set(paths)];
  return uniquePaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === "/" || path === "/sklep" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/sklep" ? 0.9 : 0.6,
  }));
}
