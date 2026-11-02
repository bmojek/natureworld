import "server-only";

import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebase-admin";
import type { OrderModel } from "@/app/models/order";

let stripeClient: Stripe | undefined;

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  stripeClient ??= new Stripe(key);
  return stripeClient;
}

export async function createOrderPaymentIntent(order: OrderModel) {
  if (order.paymentMethod !== "stripe" || order.paymentStatus !== "unpaid") {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  const stripe = getStripeClient();
  const expectedAmount = Math.round(order.total * 100);
  if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0) {
    throw new Error("INVALID_ORDER_AMOUNT");
  }

  let intent = order.stripePaymentIntentId
    ? await stripe.paymentIntents.retrieve(order.stripePaymentIntentId)
    : null;

  if (intent?.status === "canceled") throw new Error("PAYMENT_ATTEMPT_CANCELED");
  if (!intent) {
    intent = await stripe.paymentIntents.create({
      amount: expectedAmount,
      currency: "pln",
      automatic_payment_methods: { enabled: true },
      receipt_email: order.customer.email,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      description: `Nature-World ${order.orderNumber}`,
    }, { idempotencyKey: `natureworld-order-${order.id}` });
  }

  if (intent.amount !== expectedAmount || intent.currency !== "pln" || intent.metadata.orderId !== order.id) {
    throw new Error("PAYMENT_INTENT_MISMATCH");
  }
  if (!intent.client_secret) throw new Error("PAYMENT_INTENT_UNAVAILABLE");

  const orderRef = adminDb.collection("orders").doc(order.id);
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists || snapshot.get("paymentMethod") !== "stripe") {
      throw new Error("ORDER_NOT_PAYABLE");
    }
    const currentIntentId = snapshot.get("stripePaymentIntentId");
    if (currentIntentId && currentIntentId !== intent!.id) {
      throw new Error("PAYMENT_INTENT_MISMATCH");
    }
    if (!currentIntentId) {
      transaction.update(orderRef, {
        stripePaymentIntentId: intent!.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

export async function markStripeOrderPaid(intent: Stripe.PaymentIntent) {
  const orderId = intent.metadata.orderId;
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) return "ignored" as const;

  const orderRef = adminDb.collection("orders").doc(orderId);
  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) return "ignored" as const;
    const order = snapshot.data() as OrderModel;
    const amount = Math.round(order.total * 100);

    if (order.paymentMethod !== "stripe" || order.stripePaymentIntentId !== intent.id ||
        intent.currency !== "pln" || intent.amount !== amount || intent.amount_received !== amount) {
      throw new Error("STRIPE_ORDER_MISMATCH");
    }
    if (order.paymentStatus === "paid") return "already_paid" as const;
    if (order.paymentStatus !== "unpaid") throw new Error("ORDER_PAYMENT_STATE_INVALID");

    transaction.update(orderRef, {
      paymentStatus: "paid",
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "paid" as const;
  });
}
