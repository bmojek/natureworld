import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type BaseLinkerRequestContext = {
  correlationId: string;
  path: string;
  operation: string;
};

const requestContext = new AsyncLocalStorage<BaseLinkerRequestContext>();
const processInstanceId = randomUUID();

export function withBaseLinkerRequestContext<T>(
  context: { path: string; operation: string; correlationId?: string },
  work: () => T,
): T {
  return requestContext.run({
    correlationId: context.correlationId && /^[\w-]{1,80}$/.test(context.correlationId)
      ? context.correlationId
      : randomUUID(),
    path: context.path.slice(0, 240),
    operation: context.operation.slice(0, 80),
  }, work);
}

function safeErrorCode(code: string | undefined) {
  if (!code) return undefined;
  return /^[A-Za-z0-9_-]{1,48}$/.test(code) ? code : "BASE_ERROR";
}

export function logBaseLinkerProductsList(
  parameters: Record<string, unknown>,
  result: "success" | "error" | "rate_limited",
  details?: { errorCode?: string; httpStatus?: number },
) {
  const context = requestContext.getStore();
  const hasSearch = typeof parameters.filter_name === "string" && parameters.filter_name.length > 0;
  const operation = context?.operation ?? (hasSearch ? "catalog-search" : "catalog-listing");
  const event = {
    event: "baselinker.products_list",
    at: new Date().toISOString(),
    correlationId: context?.correlationId ?? randomUUID(),
    processInstanceId,
    region: process.env.VERCEL_REGION ?? undefined,
    path: context?.path ?? "unknown",
    operation,
    source: hasSearch ? "search" : operation.includes("preview") ? "preview" : typeof parameters.filter_category_id === "number" ? "category" : "catalog",
    cacheEvent: "next-data-cache-miss-or-revalidate",
    inventoryId: typeof parameters.inventory_id === "number" && Number.isSafeInteger(parameters.inventory_id) ? parameters.inventory_id : undefined,
    page: typeof parameters.page === "number" && Number.isSafeInteger(parameters.page) ? parameters.page : undefined,
    categoryId: typeof parameters.filter_category_id === "number" && Number.isSafeInteger(parameters.filter_category_id) ? parameters.filter_category_id : undefined,
    hasSearch,
    result,
    errorCode: safeErrorCode(details?.errorCode),
    httpStatus: details?.httpStatus,
  };
  const serialized = JSON.stringify(event);
  if (result === "success") console.info(serialized);
  else console.warn(serialized);
}
