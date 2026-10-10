import type { OrderFulfillmentStatus } from "@/app/models/order";

export const MANAGEABLE_ORDER_STATUSES = [
  "new",
  "processing",
  "ready_to_ship",
  "shipped",
  "completed",
  "cancelled",
] as const satisfies readonly OrderFulfillmentStatus[];

export type ManageableOrderStatus = (typeof MANAGEABLE_ORDER_STATUSES)[number];

const TRANSITIONS: Record<ManageableOrderStatus, readonly ManageableOrderStatus[]> = {
  new: ["processing", "cancelled"],
  processing: ["ready_to_ship", "cancelled"],
  ready_to_ship: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export class OrderStatusValidationError extends Error {}
export class OrderStatusConflictError extends Error {}

export type ChangeOrderStatusInput = {
  expectedStatus: OrderFulfillmentStatus;
  status: ManageableOrderStatus;
};

const LEGACY_STATUSES = ["pending", "delivered"] as const;
const ALL_CURRENT_OR_LEGACY_STATUSES: readonly string[] = [
  ...MANAGEABLE_ORDER_STATUSES,
  ...LEGACY_STATUSES,
];

function isStatus(value: unknown): value is OrderFulfillmentStatus {
  return typeof value === "string" && ALL_CURRENT_OR_LEGACY_STATUSES.includes(value);
}

export function parseChangeOrderStatusInput(value: unknown): ChangeOrderStatusInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new OrderStatusValidationError("Invalid request body");
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== "expectedStatus" || keys[1] !== "status") {
    throw new OrderStatusValidationError("Only status and expectedStatus are allowed");
  }
  if (!isStatus(record.expectedStatus)) {
    throw new OrderStatusValidationError("Invalid expected status");
  }
  if (!MANAGEABLE_ORDER_STATUSES.includes(record.status as ManageableOrderStatus)) {
    throw new OrderStatusValidationError("Invalid target status");
  }
  return {
    expectedStatus: record.expectedStatus,
    status: record.status as ManageableOrderStatus,
  };
}

export function canonicalOrderStatus(status: OrderFulfillmentStatus): ManageableOrderStatus {
  if (status === "pending") return "new";
  if (status === "delivered") return "completed";
  return status;
}

export function getAllowedNextOrderStatuses(status: OrderFulfillmentStatus): readonly ManageableOrderStatus[] {
  return TRANSITIONS[canonicalOrderStatus(status)] ?? [];
}

export function assertAllowedOrderStatusTransition(
  previousStatus: OrderFulfillmentStatus,
  nextStatus: ManageableOrderStatus,
) {
  const current = canonicalOrderStatus(previousStatus);
  if (!TRANSITIONS[current]?.includes(nextStatus)) {
    throw new OrderStatusConflictError("This status transition is not allowed");
  }
}
