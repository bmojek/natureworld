export const ORDER_FILTERS = [
  "all",
  "unpaid",
  "paid",
  "refunded",
  "new",
  "pending",
  "processing",
  "ready_to_ship",
  "shipped",
  "completed",
  "delivered",
  "cancelled",
] as const;

export type OrderFilter = (typeof ORDER_FILTERS)[number];
export const ADMIN_ORDER_PAGE_SIZE = 25;

export type OrderCursor = { createdAtMs: number; id: string };
export type AdminOrderQuery = {
  status: OrderFilter;
  orderNumber: string | null;
  cursor: OrderCursor | null;
};

export function selectOrderPage<T>(documents: T[]) {
  return {
    documents: documents.slice(0, ADMIN_ORDER_PAGE_SIZE),
    hasMore: documents.length > ADMIN_ORDER_PAGE_SIZE,
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class OrderQueryError extends Error {}

export function parseAdminOrderQuery(params: URLSearchParams): AdminOrderQuery {
  const rawStatus = params.get("status") ?? "all";
  if (!(ORDER_FILTERS as readonly string[]).includes(rawStatus)) {
    throw new OrderQueryError("Invalid status filter");
  }

  const rawNumber = params.get("number")?.trim() ?? "";
  if (rawNumber && !/^NW-\d{1,12}$/i.test(rawNumber)) {
    throw new OrderQueryError("Invalid order number");
  }

  const rawCursor = params.get("cursor");
  return {
    status: rawStatus as OrderFilter,
    orderNumber: rawNumber
      ? `NW-${rawNumber.slice(3).padStart(7, "0")}`.toUpperCase()
      : null,
    cursor: rawCursor ? decodeOrderCursor(rawCursor) : null,
  };
}

export function encodeOrderCursor(cursor: OrderCursor): string {
  if (!Number.isSafeInteger(cursor.createdAtMs) || cursor.createdAtMs < 0 || !UUID_PATTERN.test(cursor.id)) {
    throw new OrderQueryError("Invalid cursor");
  }
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeOrderCursor(value: string): OrderCursor {
  if (value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new OrderQueryError("Invalid cursor");
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" || parsed === null ||
      !Number.isSafeInteger((parsed as OrderCursor).createdAtMs) ||
      (parsed as OrderCursor).createdAtMs < 0 ||
      typeof (parsed as OrderCursor).id !== "string" ||
      !UUID_PATTERN.test((parsed as OrderCursor).id)
    ) throw new Error();
    return parsed as OrderCursor;
  } catch {
    throw new OrderQueryError("Invalid cursor");
  }
}
