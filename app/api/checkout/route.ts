import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { BaseLinkerError } from "@/app/lib/base-linker";
import {
  createFirestoreOrder,
  getFirestoreOrderByIdempotencyKey,
  OrderConflictError,
  OrderProductError,
  OrderValidationError,
} from "@/app/lib/orders";
import { normalizeCreateOrderInput } from "@/app/lib/order-core";
import { adminDb } from "@/app/lib/firebase-admin";
import type { CreateOrderInput } from "@/app/models/order";

export const runtime = "nodejs";

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const idempotencyKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(status: number, error: string, safeToRetry = false) {
  return NextResponse.json(
    { error, safeToRetry },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function legacyDigest(input: CreateOrderInput) {
  const secret = process.env.BASELINKER_API_TOKEN;
  if (!secret) throw new BaseLinkerError("Base.com token is not configured.", "NOT_CONFIGURED");
  return createHmac("sha256", secret)
    .update(JSON.stringify({ items: input.items, customer: input.customer }))
    .digest("hex");
}

function digestMatches(saved: unknown, submitted: string) {
  if (typeof saved !== "string" || !/^[0-9a-f]{64}$/i.test(saved)) return false;
  return timingSafeEqual(Buffer.from(saved, "hex"), Buffer.from(submitted, "hex"));
}

function rateLimited(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const current = rateLimits.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 8;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host && originHost === host);
  } catch {
    return false;
  }
}

async function getLegacyRequest(key: string) {
  const snapshot = await adminDb.collection("baseOrderRequests").doc(key).get();
  return snapshot.exists ? snapshot.data() : undefined;
}

function legacySuccess(record: Record<string, unknown>) {
  const baseOrderId = Number(record.baseOrderId);
  if (!Number.isSafeInteger(baseOrderId) || baseOrderId <= 0) return null;
  const productTotal = Number(record.productTotal ?? 0);
  const deliveryPrice = Number(record.deliveryPrice ?? 0);
  return {
    orderId: String(baseOrderId),
    orderNumber: String(baseOrderId),
    productTotal,
    deliveryPrice,
    total: productTotal + deliveryPrice,
    repeated: true,
    legacy: true,
  };
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return jsonError(403, "INVALID_ORIGIN");
  if (rateLimited(request)) return jsonError(429, "TOO_MANY_REQUESTS", true);
  if (Number(request.headers.get("content-length") ?? 0) > 32_000) {
    return jsonError(413, "REQUEST_TOO_LARGE");
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }
  const body = rawBody as Record<string, unknown>;
  if (text(body?.website, 200)) return jsonError(400, "INVALID_REQUEST");
  if (body?.termsAccepted !== true) return jsonError(400, "TERMS_NOT_ACCEPTED");

  let input: CreateOrderInput;
  try {
    input = normalizeCreateOrderInput(rawBody);
  } catch {
    return jsonError(400, "INVALID_CHECKOUT_DATA");
  }

  try {
    // Preserve idempotency for requests created by the previous Base.com checkout.
    const oldRecord = await getLegacyRequest(input.idempotencyKey);
    if (oldRecord) {
      const digest = legacyDigest(input);
      if (!digestMatches(oldRecord.requestDigest, digest)) return jsonError(409, "IDEMPOTENCY_KEY_REUSED");
      if (oldRecord.state === "succeeded") {
        const result = legacySuccess(oldRecord);
        if (result) return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
        return NextResponse.json(
          { error: "ORDER_PROCESSING", safeToRetry: false },
          { status: 202, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
        );
      }
      if (oldRecord.state === "processing") {
        return NextResponse.json(
          { error: "ORDER_PROCESSING", safeToRetry: false },
          { status: 202, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
        );
      }
      if (oldRecord.state !== "failed") {
        return NextResponse.json(
          { error: "ORDER_PROCESSING", safeToRetry: false },
          { status: 202, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
        );
      }
    }

    const result = await createFirestoreOrder(input);
    return NextResponse.json({
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      productTotal: result.order.productTotal,
      deliveryPrice: result.order.deliveryCost,
      total: result.order.total,
      repeated: result.repeated,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof OrderValidationError) return jsonError(400, "INVALID_CHECKOUT_DATA");
    if (error instanceof OrderConflictError) return jsonError(409, "IDEMPOTENCY_KEY_REUSED");
    if (error instanceof OrderProductError) return jsonError(409, error.code, true);
    if (error instanceof BaseLinkerError) {
      return jsonError(error.code === "NOT_CONFIGURED" ? 503 : 502,
        error.code === "NOT_CONFIGURED" ? "BASE_LINKER_NOT_CONFIGURED" : "PRODUCTS_UNAVAILABLE", true);
    }

    // Firestore may have committed before a network failure. Keep the same idempotency key
    // and ask the status endpoint rather than claiming either success or safe failure.
    console.error("Firestore checkout failed:", error instanceof Error ? error.name : "UNKNOWN_ERROR");
    return NextResponse.json(
      { error: "ORDER_PROCESSING", safeToRetry: false },
      { status: 202, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!sameOrigin(request)) return jsonError(403, "INVALID_ORIGIN");
  const key = request.nextUrl.searchParams.get("key") ?? "";
  if (!idempotencyKeyPattern.test(key)) return jsonError(400, "INVALID_STATUS_KEY");

  try {
    const order = await getFirestoreOrderByIdempotencyKey(key);
    if (order) {
      return NextResponse.json({
        state: "succeeded",
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    // Read-only fallback for checkout attempts recorded by the previous release.
    const record = await getLegacyRequest(key);
    if (!record) return jsonError(404, "ORDER_REQUEST_NOT_FOUND", true);
    if (record.state === "succeeded") {
      const result = legacySuccess(record);
      if (result) return NextResponse.json({ ...result, state: "succeeded" }, { headers: { "Cache-Control": "no-store" } });
    }
    if (record.state === "failed") return jsonError(409, "ORDER_FAILED", true);
    return NextResponse.json(
      { state: "processing" },
      { status: 202, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
    );
  } catch {
    return jsonError(503, "ORDER_STATUS_UNAVAILABLE", false);
  }
}
