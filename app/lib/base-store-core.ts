export class BasePriceConfigurationError extends Error {}
export class BaseProductPriceError extends Error {}
export class BasePaginationError extends Error {}

export function shouldContinueProductScroll(cursor: string | null) {
  return typeof cursor === "string" && cursor.length > 0;
}

export function parsePriceGroupId(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) throw new BasePriceConfigurationError("Invalid price group ID");
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new BasePriceConfigurationError("Invalid price group ID");
  }
  return String(parsed);
}

export function priceFor(
  prices: Record<string, unknown> | undefined,
  priceGroupId: string | undefined,
): number {
  let groupId: string;
  try {
    groupId = parsePriceGroupId(priceGroupId);
  } catch {
    throw new BasePriceConfigurationError("Price group is not configured");
  }

  if (!prices || !Object.prototype.hasOwnProperty.call(prices, groupId)) {
    throw new BaseProductPriceError("Configured price is missing");
  }
  const price = prices[groupId];
  // Zero is valid in the existing Product/order model, so reject only negative or malformed values.
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    throw new BaseProductPriceError("Configured price is invalid");
  }
  return price;
}

export async function fetchAllBasePages<T extends { id: number }>(
  fetchPage: (page: number) => Promise<T[]>,
  pageSize = 1000,
): Promise<T[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new BasePaginationError("Invalid page size");

  const products = new Map<number, T>();
  for (let page = 1; ; page += 1) {
    const currentPage = await fetchPage(page);
    let newItems = 0;
    for (const product of currentPage) {
      if (!products.has(product.id)) newItems += 1;
      products.set(product.id, product);
    }
    if (currentPage.length < pageSize) {
      return [...products.values()].sort((left, right) => left.id - right.id);
    }
    if (newItems === 0) {
      throw new BasePaginationError("Base.com pagination did not return new products");
    }
    if (page === Number.MAX_SAFE_INTEGER) {
      throw new BasePaginationError("Base.com pagination exceeded the supported page range");
    }
  }
}
