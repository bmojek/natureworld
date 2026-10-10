import "server-only";

import { BaseLinkerError, callBaseLinker } from "@/app/lib/base-linker";
import {
  getCachedBaseCategories,
  getCachedBaseProductDetails,
  getCachedBaseProductStock,
  getCachedBaseProductsList,
} from "@/app/lib/base-store-data-cache";
import { createAsyncStaleCache } from "@/app/lib/base-store-cache-core";
import {
  BaseProductPriceError,
  fetchAllBasePages,
  priceFor,
  parsePriceGroupId,
} from "@/app/lib/base-store-core";
import { CategoryModel } from "@/app/models/category";
import { Product } from "@/app/models/product";
import { CatalogQuery, expandCategorySelection, queryCatalogRecords } from "@/app/lib/catalog-query-core";

const BASE_PAGE_SIZE = 1000;
const PRODUCT_PAGE_CACHE_MS = 30_000;
const CATEGORY_REQUEST_CONCURRENCY = 4;
const listingMemoryCache = createAsyncStaleCache<BaseProductRecord[]>({
  freshTtlMs: 30_000,
  staleTtlMs: 300_000,
});
const detailMemoryCache = createAsyncStaleCache<Record<string, BaseProductDetails>>({
  freshTtlMs: 30_000,
  staleTtlMs: 120_000,
});
const categoryMemoryCache = createAsyncStaleCache<CategoryModel[]>({
  freshTtlMs: 300_000,
  staleTtlMs: 3_600_000,
});

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
  totalCount: number;
};

const productPageCache = new Map<
  string,
  { expiresAt: number; value: ProductPage }
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

function configuredPriceGroupId() {
  try {
    return parsePriceGroupId(process.env.BASELINKER_PRICE_GROUP_ID);
  } catch {
    throw new BaseLinkerError(
      "BASELINKER_PRICE_GROUP_ID must be configured as a positive integer.",
      "NOT_CONFIGURED",
    );
  }
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
  priceGroupId?: string,
): Product {
  const textFields = details?.text_fields ?? {};
  const content = textFields.description;
  const sku = details?.sku ?? baseProduct.sku ?? "";

  return {
    id: String(baseProduct.id),
    name: details?.name ?? baseProduct.name,
    slug: productSlug(details?.name ?? baseProduct.name, baseProduct.id),
    sku,
    price: priceFor(details?.prices ?? baseProduct.prices, priceGroupId),
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
  return categoryMemoryCache.get(String(inventoryId()), async () => {
  const response = await getCachedBaseCategories<
    BaseResponse & {
      categories: Array<{
        category_id: number;
        name: string;
        parent_id: number;
      }>;
    }
  >(inventoryId());

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
  });
}

export async function getBaseProductsPage({
  categoryId,
  categoryIds = categoryId ? [categoryId] : [],
  search,
  query = { sort: "relevance", inStock: false },
  selectedCategoryIds = [],
  preview = false,
  page = 1,
  pageSize = 6,
}: {
  categoryId?: string;
  categoryIds?: string[];
  search?: string;
  query?: CatalogQuery;
  selectedCategoryIds?: string[];
  preview?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<ProductPage> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(24, Math.floor(pageSize)));
  const normalizedCategoryIds = [
    ...new Set(categoryIds.filter((id) => /^\d+$/.test(id))),
  ];
  if (categoryIds.length > 0 && normalizedCategoryIds.length === 0) {
    return { products: [], cursor: null, totalCount: 0 };
  }
  const requestedCategories = [...new Set(selectedCategoryIds.filter((id) => /^\d+$/.test(id)))];
  if (requestedCategories.some((id) => !normalizedCategoryIds.includes(id))) {
    return { products: [], cursor: null, totalCount: 0 };
  }
  let effectiveCategoryIds = requestedCategories.length ? requestedCategories : normalizedCategoryIds;
  if (requestedCategories.length) {
    const categories = await getBaseCategories();
    effectiveCategoryIds = expandCategorySelection(categories, requestedCategories, normalizedCategoryIds);
  }
  // A preview is intentionally bounded. Full category listings keep the complete scope.
  if (preview) effectiveCategoryIds = effectiveCategoryIds.slice(0, 6);
  const priceGroupId = configuredPriceGroupId();
  const searchKey = search?.trim().toLowerCase() ?? "";
  const queryKey = JSON.stringify(query);
  const cacheKey = `${inventoryId()}:${priceGroupId}:${effectiveCategoryIds.join(",") || "all"}:${searchKey}:${queryKey}:${preview ? "preview" : "full"}:${safePage}:${safePageSize}`;
  const cached = productPageCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let allProducts: BaseProductRecord[];
  if (effectiveCategoryIds.length > 0) {
    const categoryResults = new Map<string, BaseProductRecord[]>();

    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < effectiveCategoryIds.length) {
        const id = effectiveCategoryIds[nextIndex++];
        const categoryCacheKey = `${inventoryId()}:${id}:${searchKey}:${preview ? "preview" : "full"}`;
        const products = await listingMemoryCache.get(categoryCacheKey, async () =>
          preview
            ? getCachedBaseProductsList<BaseResponse & { products: Record<string, BaseProductRecord> }>({
              inventory_id: inventoryId(),
              filter_category_id: Number(id),
              page: 1,
              filter_sort: "id ASC",
              include_variants: false,
              ...(search?.trim() ? { filter_name: search.trim().slice(0, 200) } : {}),
            }).then((listing) => Object.values(listing.products))
            : fetchAllBasePages(async (basePage) => {
            const parameters: Record<string, unknown> = {
              inventory_id: inventoryId(),
              filter_category_id: Number(id),
              page: basePage,
              filter_sort: "id ASC",
              include_variants: false,
            };
            if (search?.trim()) parameters.filter_name = search.trim().slice(0, 200);

            const listing = await getCachedBaseProductsList<
              BaseResponse & { products: Record<string, BaseProductRecord> }
            >(parameters);
            return Object.values(listing.products);
          }, BASE_PAGE_SIZE),
        );
        categoryResults.set(id, products);
      }
    };

    if (effectiveCategoryIds.length > 0) {
      await Promise.all(
        Array.from(
          { length: Math.min(CATEGORY_REQUEST_CONCURRENCY, effectiveCategoryIds.length) },
          () => worker(),
        ),
      );
    }

    const uniqueProducts = new Map<string, BaseProductRecord>();
    for (const products of categoryResults.values()) {
      for (const product of products) uniqueProducts.set(String(product.id), product);
    }
    allProducts = [...uniqueProducts.values()];
  } else {
    const configuredInventoryId = inventoryId();
    const listingCacheKey = `${configuredInventoryId}:all:${searchKey}:${preview ? "preview" : "full"}`;
    allProducts = await listingMemoryCache.get(listingCacheKey, async () => {
      if (preview) {
        const listing = await getCachedBaseProductsList<BaseResponse & { products: Record<string, BaseProductRecord> }>({
          inventory_id: configuredInventoryId,
          page: 1,
          filter_sort: "id ASC",
          include_variants: false,
          ...(search?.trim() ? { filter_name: search.trim().slice(0, 200) } : {}),
        });
        return Object.values(listing.products);
      }
      return fetchAllBasePages(async (basePage) => {
        const parameters: Record<string, unknown> = {
          inventory_id: configuredInventoryId,
          page: basePage,
          filter_sort: "id ASC",
          include_variants: false,
        };
        if (search?.trim()) parameters.filter_name = search.trim().slice(0, 200);
        const listing = await getCachedBaseProductsList<
          BaseResponse & { products: Record<string, BaseProductRecord> }
        >(parameters);
        return Object.values(listing.products);
      }, BASE_PAGE_SIZE);
    });
  }

  const stocks = query.inStock && !preview ? await getAllProductStock(effectiveCategoryIds, search) : undefined;
  const queryRecords = allProducts.flatMap((product) => {
    try {
      return [{
        product,
        id: product.id,
        name: product.name,
        price: priceFor(product.prices, priceGroupId),
        stock: stocks
          ? stockFor(stocks[String(product.id)]?.stock, stocks[String(product.id)]?.reservations)
          : stockFor(product.stock, undefined),
      }];
    } catch (error) {
      if (error instanceof BaseProductPriceError) return [];
      throw error;
    }
  });
  const matchingProducts = queryCatalogRecords(queryRecords, query);
  const totalCount = matchingProducts.length;
  const selected = matchingProducts.slice((safePage - 1) * safePageSize, safePage * safePageSize).map((entry) => entry.product);
  const products = await getProductDetails(selected, priceGroupId);
  const hasNextPage = !preview && safePage * safePageSize < totalCount;
  const value = {
    products,
    cursor: hasNextPage ? String(safePage + 1) : null,
    totalCount,
  };

  productPageCache.set(cacheKey, {
    expiresAt: Date.now() + PRODUCT_PAGE_CACHE_MS,
    value,
  });

  return value;
}

type StockRecord = { product_id?: number; stock?: Record<string, number>; reservations?: Record<string, number> };

async function getAllProductStock(categoryIds: string[], search?: string) {
  const stockById: Record<string, StockRecord> = {};
  const ids = categoryIds.length ? categoryIds : [""];
  for (const categoryId of ids) {
    await fetchAllBasePages(async (page) => {
      const parameters: Record<string, unknown> = {
        inventory_id: inventoryId(), page, filter_sort: "id ASC",
      };
      if (categoryId) parameters.filter_category_id = Number(categoryId);
      if (search?.trim()) parameters.filter_name = search.trim().slice(0, 200);
      const response = await getCachedBaseProductStock<BaseResponse & { products: Record<string, StockRecord> }>(parameters);
      const records = Object.values(response.products ?? {});
      for (const record of records) {
        if (record.product_id) stockById[String(record.product_id)] = record;
      }
      return records.map((record) => ({ id: Number(record.product_id) }));
    }, BASE_PAGE_SIZE);
  }
  return stockById;
}

async function getProductDetails(selected: BaseProductRecord[], priceGroupId: string) {
  const detailsById = new Map<number, BaseProductDetails>();

  if (selected.length) {
    const configuredInventoryId = inventoryId();
    const ids = selected.map((product) => product.id).sort((left, right) => left - right);
    const details = await detailMemoryCache.get(`${configuredInventoryId}:${ids.join(",")}`, () =>
      getCachedBaseProductDetails<BaseResponse & { products: Record<string, BaseProductDetails> }>(
        configuredInventoryId,
        ids,
      ).then((response) => response.products),
    );

    for (const [id, product] of Object.entries(details)) {
      detailsById.set(Number(id), product);
    }
  }

  return selected.flatMap((product) => {
    try {
      return [productFromBase(product, detailsById.get(product.id), priceGroupId)];
    } catch (error) {
      if (error instanceof BaseProductPriceError) return [];
      throw error;
    }
  });
}

export async function getBaseProductBySlug(slug: string) {
  const id = productIdFromSlug(slug);
  if (!id) return null;
  const priceGroupId = configuredPriceGroupId();

  const response = await detailMemoryCache.get(`${inventoryId()}:product:${id}`, () => getCachedBaseProductDetails<
    BaseResponse & { products?: Record<string, BaseProductDetails> }
  >(inventoryId(), [id]).then((data) => data.products ?? {}));

  const product = response[String(id)];
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

  try {
    return productFromBase(summary, product, priceGroupId);
  } catch (error) {
    if (error instanceof BaseProductPriceError) return null;
    throw error;
  }
}

export async function getBaseProductsByIds(ids: string[]) {
  const productIds = [...new Set(ids)].map(Number);
  if (!productIds.length || productIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return new Map<string, Product>();
  }
  const priceGroupId = configuredPriceGroupId();

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

    try {
      result.set(id, productFromBase(summary, details, priceGroupId));
    } catch (error) {
      if (!(error instanceof BaseProductPriceError)) throw error;
      // Omitting this product makes checkout validation reject it as unavailable.
    }
  }

  return result;
}
