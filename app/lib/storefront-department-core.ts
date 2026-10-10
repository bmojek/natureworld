export type DepartmentCategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  hasAvailableProducts?: boolean;
  hasProducts?: boolean;
  children: DepartmentCategoryNode[];
};

export function markConfirmedProductCategories<T extends DepartmentCategoryNode>(nodes: T[], ids: string[]): T[] {
  const confirmed = new Set(ids.filter((id) => /^\d+$/.test(id)));
  const visit = (node: T): T => ({
    ...node,
    hasAvailableProducts: node.hasAvailableProducts === true || confirmed.has(node.id) ? true : node.hasAvailableProducts,
    children: node.children.map((child) => visit(child as T)),
  });
  return nodes.map(visit);
}

export const storefrontDepartmentConfig = [
  {
    slug: "zwierzeta",
    label: "ZWIERZĘTA",
    description: "Produkty przypisane w katalogu do działu artykułów dla zwierząt.",
    paths: [["supermarket", "artykuly-dla-zwierzat"]],
  },
  {
    slug: "ogrod",
    label: "OGRÓD",
    description: "Produkty przypisane do kategorii ogrodowych w katalogu Nature-World.",
    paths: [["dom-i-ogrod", "ogrod"]],
  },
  {
    slug: "dom",
    label: "DOM",
    description: "Wyposażenie, oświetlenie, meble, narzędzia oraz budownictwo z działu Dom i Ogród.",
    paths: [
      ["dom-i-ogrod", "wyposazenie"],
      ["dom-i-ogrod", "oswietlenie"],
      ["dom-i-ogrod", "budownictwo-i-akcesoria"],
      ["dom-i-ogrod", "meble"],
      ["dom-i-ogrod", "narzedzia"],
    ],
  },
] as const;

export type StorefrontDepartment = {
  slug: string;
  label: string;
  description: string;
  href: string;
  roots: { category: DepartmentCategoryNode; slugPath: string[] }[];
  categoryIds: string[];
};

export function collectDepartmentCategoryIds(category: DepartmentCategoryNode): string[] {
  return [
    ...( /^\d+$/.test(category.id) ? [category.id] : []),
    ...category.children.flatMap(collectDepartmentCategoryIds),
  ];
}

export function categoryHasCatalogIds(category: DepartmentCategoryNode) {
  return collectDepartmentCategoryIds(category).length > 0;
}

export function categoryHasAvailableProducts(category: DepartmentCategoryNode) {
  const ids = collectDepartmentCategoryIds(category);
  if (!ids.length) return false;
  const known = ids.map((id) => findNodeById(category, id)?.hasAvailableProducts);
  if (known.some((value) => value === true)) return true;
  // A cold instance has no cached availability snapshot. Keep it discoverable
  // until a normal catalog request can establish its stock state.
  return known.some((value) => value === undefined);
}

export function categoryHasMenuProducts(category: DepartmentCategoryNode) {
  const ids = collectDepartmentCategoryIds(category);
  if (!ids.length) return false;
  const known = ids.map((id) => findNodeById(category, id)?.hasProducts);
  if (known.some((value) => value === true)) return true;
  if (known.every((value) => value === false)) return false;
  // Keep categories discoverable if Base.com could not confirm the listing.
  return true;
}

export function categoryHasConfirmedAvailableProducts(category: DepartmentCategoryNode) {
  return collectDepartmentCategoryIds(category).some(
    (id) => findNodeById(category, id)?.hasAvailableProducts === true,
  );
}

export function getConfirmedCategoryChildren(category: DepartmentCategoryNode) {
  return category.children.filter(categoryHasConfirmedAvailableProducts);
}

export function getMenuCategoryChildren(category: DepartmentCategoryNode) {
  return category.children.filter(categoryHasMenuProducts);
}

export function sortMenuGroupsByChildren<T extends { category: DepartmentCategoryNode }>(groups: T[]) {
  return groups
    .map((group, index) => ({ group, index, childCount: getMenuCategoryChildren(group.category).length }))
    .sort((left, right) => right.childCount - left.childCount || left.index - right.index)
    .map(({ group }) => group);
}

function findNodeById(node: DepartmentCategoryNode, id: string): DepartmentCategoryNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children) {
    const match = findNodeById(child, id);
    if (match) return match;
  }
  return undefined;
}

export function resolveStorefrontDepartments(tree: DepartmentCategoryNode[]): StorefrontDepartment[] {
  return storefrontDepartmentConfig.map((definition) => {
    const roots = definition.paths.flatMap((slugPath) => {
      const category = findCategoryBySlugPath(tree, [...slugPath]);
      return category ? [{ category, slugPath: [...slugPath] }] : [];
    });
    return {
      slug: definition.slug,
      label: definition.label,
      description: definition.description,
      href: `/sklep/dzial/${definition.slug}`,
      roots,
      categoryIds: [...new Set(roots.flatMap(({ category }) => collectDepartmentCategoryIds(category)))],
    };
  });
}

export function findCategoryBySlugPath(tree: DepartmentCategoryNode[], path: string[]) {
  let level = tree;
  let found: DepartmentCategoryNode | undefined;
  for (const slug of path) {
    found = level.find((category) => category.slug === slug);
    if (!found) return undefined;
    level = found.children;
  }
  return found;
}

export function getDepartmentBySlug(slug: string) {
  return storefrontDepartmentConfig.find((department) => department.slug === slug);
}
