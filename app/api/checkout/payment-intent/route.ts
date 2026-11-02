import { NextRequest, NextResponse } from "next/server";
import { BaseLinkerError } from "@/app/lib/base-linker";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";
import { normalizeCreateOrderInput } from "@/app/lib/order-core";
import { createFirestoreOrder, OrderConflictError, OrderProductError, OrderValidationError } from "@/app/lib/orders";
import { createOrderPaymentIntent } from "@/app/lib/stripe-payment";

export const runtime = "nodejs";

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function error(status: number, code: string) {
  return NextResponse.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host && new URL(origin).host === host);
  } catch {
    return false;
  }
}

function isRateLimited(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const record = rateLimits.get(ip);
  if (!record || record.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  record.count += 1;
  return record.count > 8;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return error(403, "INVALID_ORIGIN");
  if (isRateLimited(request)) return error(429, "TOO_MANY_REQUESTS");
  if (Number(request.headers.get("content-length") ?? 0) > 32_000) return error(413, "REQUEST_TOO_LARGE");

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return error(400, "INVALID_REQUEST");
    body = parsed as Record<string, unknown>;
  } catch {
    return error(400, "INVALID_JSON");
  }
  if (typeof body.website === "string" && body.website.trim()) return error(400, "INVALID_REQUEST");
  if (body.termsAccepted !== true) return error(400, "TERMS_NOT_ACCEPTED");

  let ownerUid: string | undefined;
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return error(401, "INVALID_SESSION");
    try {
      ownerUid = (await adminAuth.verifyIdToken(token, true)).uid;
    } catch {
      return error(401, "INVALID_SESSION");
    }
  }

  try {
    const input = normalizeCreateOrderInput({ ...body, paymentMethod: "stripe" });
    const legacy = await adminDb.collection("baseOrderRequests").doc(input.idempotencyKey).get();
    if (legacy.exists) return error(409, "IDEMPOTENCY_KEY_REUSED");

    const { order } = await createFirestoreOrder(input, ownerUid);
    const payment = await createOrderPaymentIntent(order);
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      clientSecret: payment.clientSecret,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    if (cause instanceof OrderValidationError) return error(400, "INVALID_CHECKOUT_DATA");
    if (cause instanceof OrderConflictError) return error(409, "IDEMPOTENCY_KEY_REUSED");
    if (cause instanceof OrderProductError) return error(409, cause.code);
    if (cause instanceof BaseLinkerError) {
      return error(cause.code === "NOT_CONFIGURED" ? 503 : 502,
        cause.code === "NOT_CONFIGURED" ? "BASE_LINKER_NOT_CONFIGURED" : "PRODUCTS_UNAVAILABLE");
    }
    const message = cause instanceof Error ? cause.message : "UNKNOWN_ERROR";
    console.error("Stripe checkout initialization failed:", message === "STRIPE_NOT_CONFIGURED" ? message : "PAYMENT_SETUP_FAILED");
    if (message === "STRIPE_NOT_CONFIGURED") return error(503, "PAYMENTS_NOT_CONFIGURED");
    if (message === "ORDER_NOT_PAYABLE" || message === "PAYMENT_ATTEMPT_CANCELED") return error(409, "ORDER_NOT_PAYABLE");
    return error(502, "PAYMENT_SETUP_FAILED");
  }
}
