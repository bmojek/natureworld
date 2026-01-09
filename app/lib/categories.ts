import { CategoryModel } from "@/app/models/category";

export interface CategoryTree extends CategoryModel {
  children: CategoryTree[];
}

let cachedTree: CategoryTree[] | null = null;
export function buildCategoryTree(categories: CategoryModel[]): CategoryTree[] {
  const map = new Map<string, CategoryTree>();

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  const tree: CategoryTree[] = [];

  map.forEach((cat) => {
    if (cat.parentId) {
      map.get(cat.parentId)?.children.push(cat);
    } else {
      tree.push(cat);
    }
  });

  return tree;
}

export function getCachedCategoryTree(
  categories: CategoryModel[]
): CategoryTree[] {
  if (!cachedTree) {
    cachedTree = buildCategoryTree(categories);
  }
  return cachedTree;
}
