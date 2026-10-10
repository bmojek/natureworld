import "server-only";

import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getBaseProductsByIds } from "@/app/lib/base-store";
import { adminDb } from "@/app/lib/firebase-admin";
import {
  buildOrderSnapshotFromProducts,
  digestOrderRequest,
  INITIAL_ORDER_STATE,
  normalizeCreateOrderInput,
  orderRequestDigestMatches,
  OrderConflictError,
} from "@/app/lib/order-core";
import type { CreateOrderInput, OrderModel } from "@/app/models/order";

const IDEMPOTENCY_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export { OrderConflictError, OrderProductError, OrderValidationError } from "@/app/lib/order-core";

export type CreateOrderResult = { order: OrderModel; repeated: boolean };

function digestInput(input: CreateOrderInput) {
  // The Firebase Admin private key is already required to access Firestore and stays server-only.
  const secret = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!secret) throw new Error("Firebase Admin credentials are not configured.");
  return digestOrderRequest(input, secret);
}

/** Build authoritative order totals from a server-fetched Base.com catalog snapshot. */
export async function buildOrderSnapshot(inputValue: unknown) {
  const input = normalizeCreateOrderInput(inputValue);
  const products = await getBaseProductsByIds(input.items.map(({ productId }) => productId));
  return buildOrderSnapshotFromProducts(input, products);
}

/**
 * Create an order and its idempotency record atomically. This server-only service is
 * used by the live checkout.
 */
export async function createFirestoreOrder(value: unknown): Promise<CreateOrderResult> {
  const input = normalizeCreateOrderInput(value);
  const requestDigest = digestInput(input);

  // Fast replay path: once stored, the original result does not depend on Base availability
  // or the current stock level.
  const previousRequest = await adminDb.collection("orderRequests").doc(input.idempotencyKey).get();
  if (previousRequest.exists) {
    const previous = previousRequest.data();
    if (!orderRequestDigestMatches(previous?.requestDigest, requestDigest) || typeof previous?.orderId !== "string") {
      throw new OrderConflictError();
    }
    const previousOrder = await adminDb.collection("orders").doc(previous.orderId).get();
    if (!previousOrder.exists) throw new Error("Idempotency record points to a missing order.");
    return { order: previousOrder.data() as OrderModel, repeated: true };
  }

  const snapshot = await buildOrderSnapshot(input);
  const id = randomUUID();
  const orderRef = adminDb.collection("orders").doc(id);
  const requestRef = adminDb.collection("orderRequests").doc(input.idempotencyKey);
  const counterRef = adminDb.collection("system").doc("orderNumberSequence");

  const committed = await adminDb.runTransaction(async (transaction) => {
    const previousRequest = await transaction.get(requestRef);
    const previous = previousRequest.data();
    if (previous) {
      if (!orderRequestDigestMatches(previous.requestDigest, requestDigest) || typeof previous.orderId !== "string") {
        throw new OrderConflictError();
      }
      const existingRef = adminDb.collection("orders").doc(previous.orderId);
      const existing = await transaction.get(existingRef);
      if (!existing.exists) throw new Error("Idempotency record points to a missing order.");
      return { orderId: previous.orderId as string, repeated: true };
    }

    const counterSnapshot = await transaction.get(counterRef);
    const nextNumber = (Number(counterSnapshot.data()?.value) || 0) + 1;
    const order: Omit<OrderModel, "createdAt"> & { createdAt: FieldValue } = {
      id,
      orderNumber: `NW-${String(nextNumber).padStart(7, "0")}`,
      createdAt: FieldValue.serverTimestamp(),
      currency: "PLN",
      items: snapshot.items,
      productTotal: snapshot.productTotal,
      deliveryCost: snapshot.deliveryCost,
      discountTotal: snapshot.discountTotal,
      total: snapshot.total,
      customer: snapshot.customer,
      shippingAddress: {
        street: input.customer.street,
        postalCode: input.customer.postalCode,
        city: input.customer.city,
        countryCode: "PL",
      },
      ...INITIAL_ORDER_STATE,
      idempotencyKey: input.idempotencyKey,
    };

    transaction.create(orderRef, order);
    transaction.create(requestRef, {
      requestDigest,
      orderId: id,
      orderNumber: order.orderNumber,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.set(counterRef, { value: nextNumber }, { merge: true });

    return { orderId: id, repeated: false };
  });

  // Read after commit so the caller receives Firestore's resolved server timestamp.
  const savedOrder = await adminDb.collection("orders").doc(committed.orderId).get();
  if (!savedOrder.exists) throw new Error("Committed order could not be read back.");
  return { order: savedOrder.data() as OrderModel, repeated: committed.repeated };
}

/** Server-side lookup; callers must enforce authorization before exposing order data. */
export async function getFirestoreOrder(id: string): Promise<OrderModel | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const snapshot = await adminDb.collection("orders").doc(id).get();
  return snapshot.exists ? snapshot.data() as OrderModel : null;
}

/** Resolve a checkout status key to its private order record on the server. */
export async function getFirestoreOrderByIdempotencyKey(key: string): Promise<OrderModel | null> {
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) return null;
  const request = await adminDb.collection("orderRequests").doc(key).get();
  if (!request.exists) return null;
  const orderId = request.data()?.orderId;
  if (typeof orderId !== "string") throw new Error("Idempotency record has no order ID.");
  const order = await getFirestoreOrder(orderId);
  if (!order) throw new Error("Idempotency record points to a missing order.");
  return order;
}
