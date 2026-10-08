import "server-only";

import { BaseLinkerError, callBaseLinker } from "@/app/lib/base-linker";
import { CategoryModel } from "@/app/models/category";
import { Product } from "@/app/models/product";

const BASE_PAGE_SIZE = 1000;
const PRODUCT_PAGE_CACHE_MS = 30_000;
const CATEGORY_PRODUCTS_CACHE_MS = 120_000;
const CATEGORY_REQUEST_CONCURRENCY = 4;

type BaseResponse = {
  status: "SUCCESS" | "ERROR";
  error_code?: string;
  error_message?: string;
  [key: string]: unknown;
};

type BaseProductRecord = {
  id: number;
  parent_id?: number;
  name: string;
  sku?: string;
  ean?: string;
  prices?: Record<string, number>;
  stock?: Record<string, number>;
};

type BaseProductDetails = BaseProductRecord & {
  category_id?: number;
  tax_rate?: number;
  images?: Record<string, string>;
  reservations?: Record<string, number>;
  text_fields?: Record<string, unknown>;
};

type ProductPage = {
  products: Product[];
  cursor: string | null;
};

const productPageCache = new Map<
  string,
  { expiresAt: number; value: ProductPage }
>();
const categoryProductsCache = new Map<
  string,
  { expiresAt: number; products: BaseProductRecord[] }
>();

function inventoryId() {
  const id = Number(process.env.BASELINKER_INVENTORY_ID);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BaseLinkerError(
      "BASELINKER_INVENTORY_ID is not configured.",
      "NOT_CONFIGURED",
    );
  }
  return id;
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[łŁ]/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productSlug(name: string, id: number) {
  return `${slugify(name) || "produkt"}-${id}`;
}

function productIdFromSlug(slug: string) {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function priceFor(prices: Record<string, number> | undefined) {
  if (!prices) return 0;

  const defaultPriceGroup = process.env.BASELINKER_PRICE_GROUP_ID;
  const configuredPrice = defaultPriceGroup
    ? prices[defaultPriceGroup]
    : undefined;
  const price = configuredPrice ?? Object.values(prices)[0] ?? 0;

  return Number(price) || 0;
}

function stockFor(
  stock: Record<string, number> | undefined,
  reservations: Record<string, number> | undefined,
) {
  if (!stock) return 0;

  const warehouseId = process.env.BASELINKER_WAREHOUSE_ID;
  const quantity = warehouseId
    ? stock[warehouseId]
    : Object.values(stock)[0];
  const reserved = warehouseId
    ? reservations?.[warehouseId]
    : Object.values(reservations ?? {})[0];

  return Math.max(0, Number(quantity ?? 0) - Number(reserved ?? 0));
}

function imagesFor(images: Record<string, string> | undefined) {
  if (!images) return [];

  return Object.entries(images)
    .filter(([key, url]) => /^\d+$/.test(key) && Boolean(url))
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([, url]) => url);
}

function productFromBase(
  baseProduct: BaseProductRecord,
  details?: BaseProductDetails,
): Product {
  const textFields = details?.text_fields ?? {};
  const content = textFields.description;
  const sku = details?.sku ?? baseProduct.sku ?? "";

  return {
    id: String(baseProduct.id),
    name: details?.name ?? baseProduct.name,
    slug: productSlug(details?.name ?? baseProduct.name, baseProduct.id),
    sku,
    price: priceFor(details?.prices ?? baseProduct.prices),
    taxRate: Number(details?.tax_rate ?? 23),
    stock: stockFor(
      details?.stock ?? baseProduct.stock,
      details?.reservations,
    ),
    images: imagesFor(details?.images),
    content: typeof content === "string" ? content : "",
    categoryIds: details?.category_id
      ? [String(details.category_id)]
      : [],
    isActive: true,
  };
}

export async function getBaseCategories(): Promise<CategoryModel[]> {
  const response = await callBaseLinker<
    BaseResponse & {
      categories?: Array<{
        category_id: number;
        name: string;
        parent_id: number;
      }>;
    }
  >("getInventoryCategories", { inventory_id: inventoryId() });

  const categories = response.categories ?? [];
  if (!categories.some((category) => category.name.includes("/"))) {
    const categoryById = new Map(
      categories.map((category) => [category.category_id, category]),
    );

    return categories.map((category) => {
      let level = 0;
      let parentId = category.parent_id || 0;
      const visited = new Set<number>();

      while (parentId && categoryById.has(parentId) && !visited.has(parentId)) {
        visited.add(parentId);
        level += 1;
        parentId = categoryById.get(parentId)?.parent_id || 0;
      }

      return {
        id: String(category.category_id),
        name: category.name,
        slug: slugify(category.name) || `kategoria-${category.category_id}`,
        parentId: category.parent_id ? String(category.parent_id) : null,
        level,
      };
    });
  }

  const pathCategories = categories.map((category) => ({
    category,
    parts: category.name.split("/").map((part) => part.trim()).filter(Boolean),
  }));
  const idByPath = new Map(
    pathCategories.map(({ category, parts }) => [
      parts.join("/"),
      String(category.category_id),
    ]),
  );
  const siblingNames = new Map<string, Set<string>>();

  for (const { parts } of pathCategories) {
    parts.forEach((part, index) => {
      const parentPath = parts.slice(0, index).join("/");
      const key = `${parentPath}\u0000${slugify(part)}`;
      const names = siblingNames.get(key) ?? new Set<string>();
      names.add(part);
      siblingNames.set(key, names);
    });
  }

  const nodes = new Map<string, CategoryModel>();

  for (const { parts } of pathCategories) {
    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join("/");
      const parentPath = parts.slice(0, index).join("/");
      const id = idByPath.get(path) ?? `path:${slugify(path)}`;

      if (nodes.has(id)) return;

      const siblingKey = `${parentPath}\u0000${slugify(part)}`;
      const duplicateSlug = (siblingNames.get(siblingKey)?.size ?? 0) > 1;
      const baseSlug = slugify(part) || "kategoria";

      nodes.set(id, {
        id,
        name: part,
        slug: duplicateSlug ? `${baseSlug}-${slugify(path)}` : baseSlug,
        parentId: parentPath
          ? (idByPath.get(parentPath) ?? `path:${slugify(parentPath)}`)
          : null,
        level: index,
      });
    });
  }

  return [...nodes.values()];
}

export async function getBaseProductsPage({
  categoryId,
  categoryIds = categoryId ? [categoryId] : [],
  search,
  page = 1,
  pageSize = 6,
}: {
  categoryId?: string;
  categoryIds?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProductPage> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(24, Math.floor(pageSize)));
  const normalizedCategoryIds = [
    ...new Set(categoryIds.filter((id) => /^\d+$/.test(id))),
  ];
  if (categoryIds.length > 0 && normalizedCategoryIds.length === 0) {
    return { products: [], cursor: null };
  }

  const totalOffset = (safePage - 1) * safePageSize;
  const searchKey = search?.trim().toLowerCase() ?? "";
  const cacheKey = `${normalizedCategoryIds.join(",") || "all"}:${searchKey}:${safePage}:${safePageSize}`;
  const cached = productPageCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let allProducts: BaseProductRecord[];
  if (normalizedCategoryIds.length > 0) {
    const categoryResults = new Map<string, BaseProductRecord[]>();
    const pendingCategoryIds: string[] = [];

    for (const id of normalizedCategoryIds) {
      const categoryCacheKey = `${id}:${searchKey}`;
      const cachedCategory = categoryProductsCache.get(categoryCacheKey);
      if (cachedCategory && cachedCategory.expiresAt > Date.now()) {
        categoryResults.set(id, cachedCategory.products);
      } else {
        pendingCategoryIds.push(id);
      }
    }

    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < pendingCategoryIds.length) {
        const id = pendingCategoryIds[nextIndex++];
        const parameters: Record<string, unknown> = {
          inventory_id: inventoryId(),
          filter_category_id: Number(id),
          page: 1,
          filter_sort: "id ASC",
          include_variants: false,
        };
        if (search?.trim()) parameters.filter_name = search.trim().slice(0, 200);

        const listing = await callBaseLinker<
          BaseResponse & { products?: Record<string, BaseProductRecord> }
        >("getInventoryProductsList", parameters);
        const products = Object.values(listing.products ?? {});
        categoryProductsCache.set(`${id}:${searchKey}`, {
          expiresAt: Date.now() + CATEGORY_PRODUCTS_CACHE_MS,
          products,
        });
        categoryResults.set(id, products);
      }
    };

    if (pendingCategoryIds.length > 0) {
      await Promise.all(
        Array.from(
          { length: Math.min(CATEGORY_REQUEST_CONCURRENCY, pendingCategoryIds.length) },
          () => worker(),
        ),
      );
    }

    const uniqueProducts = new Map<string, BaseProductRecord>();
    for (const products of categoryResults.values()) {
      for (const product of products) uniqueProducts.set(String(product.id), product);
    }
    allProducts = [...uniqueProducts.values()].sort((left, right) => left.id - right.id);
  } else {
    const basePage = Math.floor(totalOffset / BASE_PAGE_SIZE) + 1;
    const pageOffset = totalOffset % BASE_PAGE_SIZE;
    const parameters: Record<string, unknown> = {
      inventory_id: inventoryId(),
      page: basePage,
      filter_sort: "id ASC",
      include_variants: false,
    };
    if (search?.trim()) parameters.filter_name = search.trim().slice(0, 200);

    const listing = await callBaseLinker<
      BaseResponse & { products?: Record<string, BaseProductRecord> }
    >("getInventoryProductsList", parameters);
    allProducts = Object.values(listing.products ?? {});
    const selected = allProducts.slice(pageOffset, pageOffset + safePageSize);
    const resultProducts = await getProductDetails(selected);
    const hasNextPage =
      pageOffset + selected.length < allProducts.length ||
      allProducts.length === BASE_PAGE_SIZE;
    const value = {
      products: resultProducts,
      cursor: hasNextPage ? String(safePage + 1) : null,
    };

    productPageCache.set(cacheKey, {
      expiresAt: Date.now() + PRODUCT_PAGE_CACHE_MS,
      value,
    });
    return value;
  }

  const selected = allProducts.slice(totalOffset, totalOffset + safePageSize);
  const products = await getProductDetails(selected);
  const hasNextPage = totalOffset + selected.length < allProducts.length;
  const value = {
    products,
    cursor: hasNextPage ? String(safePage + 1) : null,
  };

  productPageCache.set(cacheKey, {
    expiresAt: Date.now() + PRODUCT_PAGE_CACHE_MS,
    value,
  });

  return value;
}

async function getProductDetails(selected: BaseProductRecord[]) {
  const detailsById = new Map<number, BaseProductDetails>();

  if (selected.length) {
    const details = await callBaseLinker<
      BaseResponse & { products?: Record<string, BaseProductDetails> }
    >("getInventoryProductsData", {
      inventory_id: inventoryId(),
      products: selected.map((product) => product.id),
    });

    for (const [id, product] of Object.entries(details.products ?? {})) {
      detailsById.set(Number(id), product);
    }
  }

  return selected.map((product) =>
    productFromBase(product, detailsById.get(product.id)),
  );
}

export async function getBaseProductBySlug(slug: string) {
  const id = productIdFromSlug(slug);
  if (!id) return null;

  const response = await callBaseLinker<
    BaseResponse & { products?: Record<string, BaseProductDetails> }
  >("getInventoryProductsData", {
    inventory_id: inventoryId(),
    products: [id],
  });

  const product = response.products?.[String(id)];
  if (!product) return null;

  const textFields = product.text_fields ?? {};
  const name = typeof textFields.name === "string" ? textFields.name : `Produkt ${id}`;
  const summary: BaseProductRecord = {
    id,
    name,
    sku: product.sku,
    ean: product.ean,
    prices: product.prices,
    stock: product.stock,
    parent_id: product.parent_id,
  };

  return productFromBase(summary, product);
}

export async function getBaseProductsByIds(ids: string[]) {
  const productIds = [...new Set(ids)].map(Number);
  if (!productIds.length || productIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return new Map<string, Product>();
  }

  const response = await callBaseLinker<
    BaseResponse & { products?: Record<string, BaseProductDetails> }
  >("getInventoryProductsData", {
    inventory_id: inventoryId(),
    products: productIds,
  });

  const result = new Map<string, Product>();

  for (const [id, details] of Object.entries(response.products ?? {})) {
    if (details.parent_id) continue;

    const textFields = details.text_fields ?? {};
    const name = typeof textFields.name === "string" ? textFields.name : `Produkt ${id}`;
    const summary: BaseProductRecord = {
      id: Number(id),
      name,
      sku: details.sku,
      ean: details.ean,
      prices: details.prices,
      stock: details.stock,
    };

    result.set(id, productFromBase(summary, details));
  }

  return result;
}