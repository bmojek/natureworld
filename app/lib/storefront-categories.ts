import { CategoryTree } from "@/app/lib/categories";

const primaryCategoryPaths = [
  { label: "Ogród", path: ["Dom i Ogród", "Ogród"] },
  { label: "Zwierzęta", path: ["Supermarket", "Artykuły dla zwierząt"] },
  { label: "Dom", path: ["Dom i Ogród", "Wyposażenie"] },
];

export type StorefrontCategoryLink = {
  id: string;
  label: string;
  slugPath: string[];
};

export function getPrimaryStorefrontCategories(
  tree: CategoryTree[],
): StorefrontCategoryLink[] {
  return primaryCategoryPaths.flatMap(({ label, path }) => {
    let level = tree;
    const slugs: string[] = [];
    let match: CategoryTree | undefined;

    for (const name of path) {
      match = level.find((category) => category.name === name);
      if (!match) return [];
      slugs.push(match.slug);
      level = match.children;
    }

    return match ? [{ id: match.id, label, slugPath: slugs }] : [];
  });
}