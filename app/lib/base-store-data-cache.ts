import "server-only";

import { unstable_cache } from "next/cache";
import { callBaseLinker } from "@/app/lib/base-linker";
import { requireObjectField } from "@/app/lib/base-store-cache-core";

type BaseResponse = {
  status: "SUCCESS" | "ERROR";
  [key: string]: unknown;
};

// Next's Data Cache persists these successful responses across requests. TTLs are
// deliberately separate: category/list data changes less often than price/stock.
const readCategories = unstable_cache(
  async (inventoryId: number) => {
    const response = await callBaseLinker<BaseResponse & { categories?: unknown }>(
      "getInventoryCategories",
      { inventory_id: inventoryId },
    );
    if (!Array.isArray(response.categories)) {
      throw new Error("Base.com returned an incomplete categories response.");
    }
    return response;
  },
  ["base-store-categories-v1"],
  { revalidate: 300, tags: ["base-store-categories"] },
);

const readProductsList = unstable_cache(
  async (parametersJson: string) => {
    const parameters = JSON.parse(parametersJson) as Record<string, unknown>;
    const response = await callBaseLinker<BaseResponse & { products?: unknown }>(
      "getInventoryProductsList",
      parameters,
    );
    requireObjectField(response, "products");
    return response;
  },
  ["base-store-product-list-v1"],
  // The list response also carries price-group prices and stock. Keep its TTL
  // aligned with volatile catalog values used by filters and ordering.
  { revalidate: 30, tags: ["base-store-products"] },
);

const readProductStock = unstable_cache(
  async (parametersJson: string) => {
    const parameters = JSON.parse(parametersJson) as Record<string, unknown>;
    const response = await callBaseLinker<BaseResponse & { products?: unknown }>(
      "getInventoryProductsStock",
      parameters,
    );
    requireObjectField(response, "products");
    return response;
  },
  ["base-store-product-stock-v1"],
  { revalidate: 15, tags: ["base-store-product-stock"] },
);

const readProductDetails = unstable_cache(
  async (inventoryId: number, productIdsJson: string) => {
    const productIds = JSON.parse(productIdsJson) as number[];
    const response = await callBaseLinker<BaseResponse & { products?: unknown }>(
      "getInventoryProductsData",
      { inventory_id: inventoryId, products: productIds },
    );
    const products = requireObjectField(response, "products");
    if (productIds.some((id) => !Object.prototype.hasOwnProperty.call(products, String(id)))) {
      throw new Error("Base.com returned an incomplete product details response.");
    }
    return response;
  },
  ["base-store-product-details-v1"],
  { revalidate: 30, tags: ["base-store-product-details"] },
);

export function getCachedBaseCategories<T>(inventoryId: number) {
  return readCategories(inventoryId) as Promise<T>;
}

export function getCachedBaseProductsList<T>(parameters: Record<string, unknown>) {
  return readProductsList(JSON.stringify(parameters)) as Promise<T>;
}

export function getCachedBaseProductStock<T>(parameters: Record<string, unknown>) {
  return readProductStock(JSON.stringify(parameters)) as Promise<T>;
}

export function getCachedBaseProductDetails<T>(inventoryId: number, productIds: number[]) {
  const normalizedIds = [...new Set(productIds)].sort((left, right) => left - right);
  return readProductDetails(inventoryId, JSON.stringify(normalizedIds)) as Promise<T>;
}
