import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { BaseLinkerError, callBaseLinker } from "@/app/lib/base-linker";
import { getBaseProductsByIds } from "@/app/lib/base-store";
import { adminDb } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";

const FREE_SHIPPING_THRESHOLD = 99;
const STANDARD_SHIPPING_PRICE = 15;
const MAX_ORDER_ITEMS = 30;
const MAX_ITEM_QUANTITY = 50;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;

type CheckoutItemInput = {
  productId: string;
  qty: number;
};

type CheckoutInput = {
  idempotencyKey: string;
  items: CheckoutItemInput[];
  customer: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    postalCode: string;
    city: string;
    note: string;
    wantInvoice: boolean;
    nip: string;
  };
};

type AddOrderResponse = {
  order_id?: number;
};

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function jsonError(status: number, error: string, safeToRetry = false) {
  return NextResponse.json(
    { error, safeToRetry },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeInput(value: unknown): CheckoutInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const customerInput = body.customer;
  if (!customerInput || typeof customerInput !== "object") return null;

  const customer = customerInput as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_ORDER_ITEMS) {
    return null;
  }

  const quantities = new Map<string, number>();
  for (const rawItem of body.items) {
    if (!rawItem || typeof rawItem !== "object") return null;
    const item = rawItem as Record<string, unknown>;
    const productId = text(item.productId, 24);
    const qty = Number(item.qty);
    if (!/^\d+$/.test(productId) || !Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QUANTITY) {
      return null;
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + qty);
  }

  if ([...quantities.values()].some((qty) => qty > MAX_ITEM_QUANTITY)) return null;

  const idempotencyKey = text(body.idempotencyKey, 64);
  const fullName = text(customer.fullName, 120);
  const email = text(customer.email, 150).toLowerCase();
  const phone = text(customer.phone, 40);
  const street = text(customer.street, 150);
  const postalCode = text(customer.postalCode, 20);
  const city = text(customer.city, 100);
  const wantInvoice = customer.wantInvoice === true;
  const nip = text(customer.nip, 20).replace(/[\s-]/g, "");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey) ||
    fullName.length < 3 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length < 6 ||
    street.length < 4 ||
    postalCode.length < 4 ||
    city.length < 2 ||
    (wantInvoice && !/^\d{10}$/.test(nip))
  ) {
    return null;
  }

  return {
    idempotencyKey,
    items: [...quantities].map(([productId, qty]) => ({ productId, qty })),
    customer: {
      fullName,
      email,
      phone,
      street,
      postalCode,
      city,
      note: text(customer.note, 500),
      wantInvoice,
      nip: wantInvoice ? nip : "",
    },
  };
}

function requestDigest(input: CheckoutInput) {
  const secret = process.env.BASELINKER_API_TOKEN;
  if (!secret) throw new BaseLinkerError("BaseLinker API token is not configured.", "NOT_CONFIGURED");

  const payload = JSON.stringify({ items: input.items, customer: input.customer });
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function sameDigest(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function rateLimited(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const current = rateLimits.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
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

async function updateLedger(
  idempotencyKey: string,
  values: Record<string, unknown>,
) {
  await adminDb.collection("baseOrderRequests").doc(idempotencyKey).set(
    { ...values, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return jsonError(403, "INVALID_ORIGIN");
  if (rateLimited(request)) return jsonError(429, "TOO_MANY_REQUESTS", true);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) return jsonError(413, "REQUEST_TOO_LARGE");

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }

  const body = rawBody as Record<string, unknown>;
  if (text(body?.website, 200)) return jsonError(400, "INVALID_REQUEST");
  if (body?.termsAccepted !== true) return jsonError(400, "TERMS_NOT_ACCEPTED");

  const input = normalizeInput(rawBody);
  if (!input) return jsonError(400, "INVALID_CHECKOUT_DATA");

  let digest: string;
  try {
    digest = requestDigest(input);
  } catch {
    return jsonError(503, "BASE_LINKER_NOT_CONFIGURED", true);
  }

  const ledgerRef = adminDb.collection("baseOrderRequests").doc(input.idempotencyKey);
  let baseOrderCreated = false;

  try {
    const reservation = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ledgerRef);
      const previous = snapshot.data();

      if (previous) {
        if (typeof previous.requestDigest !== "string" || !sameDigest(previous.requestDigest, digest)) {
          return { state: "conflict" as const };
        }
        if (previous.state === "succeeded" && Number.isInteger(previous.baseOrderId)) {
          return { state: "succeeded" as const, orderId: previous.baseOrderId as number };
        }
        if (previous.state === "processing") return { state: "processing" as const };
      }

      transaction.set(
        ledgerRef,
        {
          requestDigest: digest,
          state: "processing",
          attempt: FieldValue.increment(1),
          createdAt: previous?.createdAt ?? FieldValue.serverTimestamp(),
          expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { state: "reserved" as const };
    });

    if (reservation.state === "conflict") return jsonError(409, "IDEMPOTENCY_KEY_REUSED");
    if (reservation.state === "processing") {
      return NextResponse.json(
        { error: "ORDER_PROCESSING", safeToRetry: false },
        { status: 202, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
      );
    }
    if (reservation.state === "succeeded") {
      return NextResponse.json({ orderId: reservation.orderId, repeated: true });
    }

    const currentProducts = await getBaseProductsByIds(input.items.map((item) => item.productId));
    const orderProducts = [];
    let productTotal = 0;

    for (const item of input.items) {
      const product = currentProducts.get(item.productId);
      if (!product) {
        await updateLedger(input.idempotencyKey, { state: "failed", failureCode: "PRODUCT_UNAVAILABLE" });
        return jsonError(409, "PRODUCT_UNAVAILABLE", true);
      }
      if (product.stock < item.qty) {
        await updateLedger(input.idempotencyKey, { state: "failed", failureCode: "INSUFFICIENT_STOCK" });
        return jsonError(409, "INSUFFICIENT_STOCK", true);
      }

      productTotal += product.price * item.qty;
      orderProducts.push({
        storage: "db",
        storage_id: 0,
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        price_brutto: product.price,
        tax_rate: product.taxRate ?? 23,
        quantity: item.qty,
      });
    }

    const normalizedTotal = Math.round(productTotal * 100) / 100;
    const deliveryPrice = normalizedTotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_PRICE;
    const statuses = await callBaseLinker<
      { status: "SUCCESS" | "ERROR"; statuses?: Array<{ id: number; is_primary?: number }> }
    >("getOrderStatusList");
    const orderStatus = statuses.statuses?.find((status) => status.is_primary === 1) ?? statuses.statuses?.[0];

    if (!orderStatus) {
      await updateLedger(input.idempotencyKey, { state: "failed", failureCode: "BASE_STATUS_NOT_CONFIGURED" });
      return jsonError(503, "BASE_STATUS_NOT_CONFIGURED", true);
    }

    let orderResponse: AddOrderResponse;
    try {
      orderResponse = await callBaseLinker<
        { status: "SUCCESS" | "ERROR"; order_id?: number }
      >("addOrder", {
        order_status_id: orderStatus.id,
        date_add: Math.floor(Date.now() / 1000),
        currency: "PLN",
        payment_method: "Płatność przy odbiorze",
        payment_method_cod: true,
        paid: false,
        user_comments: input.customer.note,
        email: input.customer.email,
        phone: input.customer.phone,
        delivery_method: "Dostawa kurierem",
        delivery_price: deliveryPrice,
        delivery_fullname: input.customer.fullName,
        delivery_address: input.customer.street,
        delivery_postcode: input.customer.postalCode,
        delivery_city: input.customer.city,
        delivery_country_code: "PL",
        want_invoice: input.customer.wantInvoice,
        ...(input.customer.wantInvoice
          ? {
              invoice_fullname: input.customer.fullName,
              invoice_address: input.customer.street,
              invoice_postcode: input.customer.postalCode,
              invoice_city: input.customer.city,
              invoice_country_code: "PL",
              invoice_nip: input.customer.nip,
            }
          : {}),
        extra_field_1: `NW-${input.idempotencyKey}`,
        products: orderProducts,
      });
      baseOrderCreated = true;
    } catch (error) {
      if (error instanceof BaseLinkerError) {
        await updateLedger(input.idempotencyKey, { state: "failed", failureCode: error.code ?? "BASE_REJECTED" });
        return jsonError(502, "BASE_REJECTED_ORDER", true);
      }

      // An interrupted API call might have created the order; keep the key locked to prevent duplicates.
      console.error("Base addOrder request outcome is unknown.");
      return jsonError(202, "ORDER_PROCESSING", false);
    }

    if (!Number.isSafeInteger(orderResponse.order_id) || !orderResponse.order_id) {
      console.error("Base addOrder response did not include an order ID.");
      return jsonError(202, "ORDER_PROCESSING", false);
    }

    await updateLedger(input.idempotencyKey, {
      state: "succeeded",
      baseOrderId: orderResponse.order_id,
      productTotal: normalizedTotal,
      deliveryPrice,
    });

    return NextResponse.json({
      orderId: orderResponse.order_id,
      productTotal: normalizedTotal,
      deliveryPrice,
      total: normalizedTotal + deliveryPrice,
    });
  } catch (error) {
    if (baseOrderCreated) {
      console.error("Base order created but checkout finalization is incomplete.");
      return jsonError(202, "ORDER_PROCESSING", false);
    }

    if (error instanceof BaseLinkerError && error.code === "NOT_CONFIGURED") {
      await updateLedger(input.idempotencyKey, { state: "failed", failureCode: "BASE_NOT_CONFIGURED" }).catch(() => undefined);
      return jsonError(503, "BASE_LINKER_NOT_CONFIGURED", true);
    }

    console.error(
      "Checkout failed:",
      error instanceof BaseLinkerError ? error.code : error instanceof Error ? error.name : "UNKNOWN_ERROR",
    );
    await updateLedger(input.idempotencyKey, { state: "failed", failureCode: "CHECKOUT_FAILED" }).catch(() => undefined);
    return jsonError(502, "CHECKOUT_FAILED", true);
  }
}

export async function GET(request: NextRequest) {
  if (!sameOrigin(request)) return jsonError(403, "INVALID_ORIGIN");

  const key = request.nextUrl.searchParams.get("key") ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    return jsonError(400, "INVALID_STATUS_KEY");
  }

  try {
    const snapshot = await adminDb.collection("baseOrderRequests").doc(key).get();
    const record = snapshot.data();

    if (!record) return jsonError(404, "ORDER_REQUEST_NOT_FOUND", true);
    if (record.state === "succeeded" && Number.isSafeInteger(record.baseOrderId)) {
      const productTotal = Number(record.productTotal ?? 0);
      const deliveryPrice = Number(record.deliveryPrice ?? 0);
      return NextResponse.json({
        state: "succeeded",
        orderId: record.baseOrderId,
        total: productTotal + deliveryPrice,
      });
    }
    if (record.state === "failed") return jsonError(409, "ORDER_FAILED", true);

    return NextResponse.json(
      { state: "processing" },
      { status: 202, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
    );
  } catch {
    return jsonError(503, "ORDER_STATUS_UNAVAILABLE", true);
  }
}