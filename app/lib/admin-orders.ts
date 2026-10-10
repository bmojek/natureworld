import "server-only";

import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebase-admin";
import {
  ADMIN_ORDER_PAGE_SIZE,
  encodeOrderCursor,
  selectOrderPage,
  type AdminOrderQuery,
  type OrderFilter,
} from "@/app/lib/admin-order-query";
import type { OrderModel } from "@/app/models/order";
import {
  assertAllowedOrderStatusTransition,
  OrderStatusConflictError,
  type ChangeOrderStatusInput,
} from "@/app/lib/order-status-core";

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  customerName: string;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

export type AdminOrderDetails = Omit<OrderModel, "idempotencyKey" | "createdAt" | "updatedAt" | "statusHistory"> & {
  createdAt: string | null;
  updatedAt: string | null;
  statusHistory: Array<{ previousStatus: string; newStatus: string; changedAt: string | null; adminUid: string }>;
};

function toIsoDate(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("toDate" in value)) return null;
  const date = (value as { toDate: () => Date }).toDate();
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toSummary(id: string, raw: FirebaseFirestore.DocumentData): AdminOrderSummary {
  return {
    id,
    orderNumber: typeof raw.orderNumber === "string" ? raw.orderNumber : "",
    createdAt: toIsoDate(raw.createdAt),
    customerName: typeof raw.customer?.fullName === "string" ? raw.customer.fullName : "",
    total: typeof raw.total === "number" && Number.isFinite(raw.total) ? raw.total : 0,
    currency: typeof raw.currency === "string" ? raw.currency : "PLN",
    paymentMethod: typeof raw.paymentMethod === "string" ? raw.paymentMethod : "",
    paymentStatus: typeof raw.paymentStatus === "string" ? raw.paymentStatus : "",
    fulfillmentStatus: typeof raw.fulfillmentStatus === "string" ? raw.fulfillmentStatus : "",
  };
}

function toDetails(raw: FirebaseFirestore.DocumentData): AdminOrderDetails {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    createdAt: toIsoDate(raw.createdAt),
    updatedAt: toIsoDate(raw.updatedAt),
    statusHistory: Array.isArray(raw.statusHistory) ? raw.statusHistory.map((entry) => ({
      previousStatus: typeof entry.previousStatus === "string" ? entry.previousStatus : "",
      newStatus: typeof entry.newStatus === "string" ? entry.newStatus : "",
      changedAt: toIsoDate(entry.changedAt),
      adminUid: typeof entry.adminUid === "string" ? entry.adminUid : "",
    })) : [],
    currency: raw.currency,
    items: Array.isArray(raw.items) ? raw.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      variant: item.variant ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      image: item.image ?? null,
    })) : [],
    productTotal: raw.productTotal,
    deliveryCost: raw.deliveryCost,
    discountTotal: raw.discountTotal,
    total: raw.total,
    customer: {
      fullName: raw.customer?.fullName ?? "",
      email: raw.customer?.email ?? "",
      phone: raw.customer?.phone ?? "",
      note: raw.customer?.note ?? "",
      wantInvoice: raw.customer?.wantInvoice === true,
      nip: raw.customer?.nip ?? null,
    },
    shippingAddress: {
      street: raw.shippingAddress?.street ?? "",
      postalCode: raw.shippingAddress?.postalCode ?? "",
      city: raw.shippingAddress?.city ?? "",
      countryCode: raw.shippingAddress?.countryCode ?? "PL",
    },
    paymentMethod: raw.paymentMethod,
    deliveryMethod: raw.deliveryMethod,
    paymentStatus: raw.paymentStatus,
    fulfillmentStatus: raw.fulfillmentStatus,
  } as AdminOrderDetails;
}

function isPaymentStatus(status: OrderFilter): status is "unpaid" | "paid" | "refunded" {
  return status === "unpaid" || status === "paid" || status === "refunded";
}

export async function listAdminOrders(filters: AdminOrderQuery) {
  const collection = adminDb.collection("orders");

  if (filters.orderNumber) {
    const snapshot = await collection.where("orderNumber", "==", filters.orderNumber).limit(1).get();
    return {
      orders: snapshot.docs
        .filter((doc) => filters.status === "all" || doc.get(isPaymentStatus(filters.status) ? "paymentStatus" : "fulfillmentStatus") === filters.status)
        .map((doc) => toSummary(doc.id, doc.data())),
      nextCursor: null,
    };
  }

  let query = collection.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "desc");
  if (filters.status !== "all") {
    query = query.where(isPaymentStatus(filters.status) ? "paymentStatus" : "fulfillmentStatus", "==", filters.status);
  }
  if (filters.cursor) {
    query = query.startAfter(Timestamp.fromMillis(filters.cursor.createdAtMs), filters.cursor.id);
  }

  const snapshot = await query.limit(ADMIN_ORDER_PAGE_SIZE + 1).get();
  const { documents: page, hasMore } = selectOrderPage(snapshot.docs);
  const last = page.at(-1);
  return {
    orders: page.map((doc) => toSummary(doc.id, doc.data())),
    nextCursor: hasMore && last ? encodeOrderCursor({
      createdAtMs: last.get("createdAt")?.toMillis?.() ?? 0,
      id: last.id,
    }) : null,
  };
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetails | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const snapshot = await adminDb.collection("orders").doc(id).get();
  return snapshot.exists ? toDetails(snapshot.data()!) : null;
}

export async function changeAdminOrderStatus(
  id: string,
  input: ChangeOrderStatusInput,
  adminUid: string,
): Promise<AdminOrderDetails | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const orderRef = adminDb.collection("orders").doc(id);

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) return;

    const currentStatus = snapshot.get("fulfillmentStatus") as OrderModel["fulfillmentStatus"] | undefined;
    if (!currentStatus || currentStatus !== input.expectedStatus) {
      throw new OrderStatusConflictError("The order status changed; reload and try again");
    }
    assertAllowedOrderStatusTransition(currentStatus, input.status);

    const existingHistory = snapshot.get("statusHistory");
    if (existingHistory !== undefined && !Array.isArray(existingHistory)) {
      throw new Error("Invalid order status history");
    }
    const event = {
      previousStatus: currentStatus,
      newStatus: input.status,
      changedAt: Timestamp.now(),
      adminUid,
    };
    transaction.update(orderRef, {
      fulfillmentStatus: input.status,
      updatedAt: FieldValue.serverTimestamp(),
      statusHistory: [...(existingHistory ?? []), event],
    });
  });

  return getAdminOrder(id);
}
