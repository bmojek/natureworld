import { CategoryTree } from "./categories";

export function findCategoryBySlugPath(
  tree: CategoryTree[],
  slugPath: string[]
): CategoryTree | null {
  let current: CategoryTree | null = null;
  let level = tree;

  for (const slug of slugPath) {
    current = level.find((c) => c.slug === slug) || null;
    if (!current) return null;
    level = current.children;
  }

  return current;
}

export function collectCategoryIds(category: CategoryTree): string[] {
  const ids = [category.id];
  for (const child of category.children) {
    ids.push(...collectCategoryIds(child));
  }
  return ids;
}
export function findParentCategory(tree: any[], parentId: string | null) {
  if (!parentId) return null;

  const stack = [...tree];

  while (stack.length) {
    const node = stack.pop();
    if (node.id === parentId) return node;
    if (node.children) stack.push(...node.children);
  }

  return null;
}
