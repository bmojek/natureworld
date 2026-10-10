import { createHmac, timingSafeEqual } from "node:crypto";
import type { Product } from "@/app/models/product";
import type {
  CreateOrderInput,
  OrderCustomer,
  OrderItemSnapshot,
} from "@/app/models/order";

const MAX_ORDER_ITEMS = 30;
const MAX_ITEM_QUANTITY = 50;
const FREE_SHIPPING_THRESHOLD_GROSZE = 9_900;
const STANDARD_SHIPPING_GROSZE = 1_500;
const IDEMPOTENCY_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const INITIAL_ORDER_STATE = {
  paymentMethod: "cod",
  deliveryMethod: "courier",
  paymentStatus: "unpaid",
  fulfillmentStatus: "new",
} as const;

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export class OrderConflictError extends Error {
  constructor(message = "The idempotency key was already used for another request.") {
    super(message);
    this.name = "OrderConflictError";
  }
}

export class OrderProductError extends Error {
  readonly code: "PRODUCT_UNAVAILABLE" | "INSUFFICIENT_STOCK";

  constructor(code: "PRODUCT_UNAVAILABLE" | "INSUFFICIENT_STOCK") {
    super(code);
    this.name = "OrderProductError";
    this.code = code;
  }
}

export function digestOrderRequest(input: CreateOrderInput, secret: string) {
  if (!secret) throw new Error("An idempotency secret is required.");
  return createHmac("sha256", secret)
    .update(JSON.stringify({ items: input.items, customer: input.customer }))
    .digest("hex");
}

export function orderRequestDigestMatches(saved: unknown, submitted: string) {
  if (typeof saved !== "string" || !/^[0-9a-f]{64}$/.test(saved)) return false;
  const savedBytes = Buffer.from(saved, "hex");
  const submittedBytes = Buffer.from(submitted, "hex");
  return savedBytes.length === submittedBytes.length && timingSafeEqual(savedBytes, submittedBytes);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeCreateOrderInput(value: unknown): CreateOrderInput {
  const body = asRecord(value);
  const customerRaw = asRecord(body?.customer);
  if (!body || !customerRaw || !Array.isArray(body.items) ||
      body.items.length === 0 || body.items.length > MAX_ORDER_ITEMS) {
    throw new OrderValidationError("Invalid order data.");
  }

  const quantities = new Map<string, number>();
  for (const valueItem of body.items) {
    const item = asRecord(valueItem);
    const productId = cleanText(item?.productId, 24);
    const qty = item?.qty;
    if (!/^\d+$/.test(productId) || !Number.isSafeInteger(qty) ||
        (qty as number) < 1 || (qty as number) > MAX_ITEM_QUANTITY) {
      throw new OrderValidationError("Invalid product or quantity.");
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + (qty as number));
  }
  if ([...quantities.values()].some((qty) => qty > MAX_ITEM_QUANTITY)) {
    throw new OrderValidationError("Product quantity exceeds the limit.");
  }

  const idempotencyKey = cleanText(body.idempotencyKey, 64);
  const customer = {
    fullName: cleanText(customerRaw.fullName, 120),
    email: cleanText(customerRaw.email, 150).toLowerCase(),
    phone: cleanText(customerRaw.phone, 40),
    street: cleanText(customerRaw.street, 150),
    postalCode: cleanText(customerRaw.postalCode, 20),
    city: cleanText(customerRaw.city, 100),
    note: cleanText(customerRaw.note, 500),
    wantInvoice: customerRaw.wantInvoice === true,
    nip: cleanText(customerRaw.nip, 20).replace(/[\s-]/g, ""),
  };

  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey) || customer.fullName.length < 3 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || customer.phone.length < 6 ||
      customer.street.length < 4 || customer.postalCode.length < 4 || customer.city.length < 2 ||
      (customer.wantInvoice && !/^\d{10}$/.test(customer.nip))) {
    throw new OrderValidationError("Invalid customer data or idempotency key.");
  }

  return {
    idempotencyKey,
    items: [...quantities].map(([productId, qty]) => ({ productId, qty })),
    customer,
  };
}

function toGrosze(amount: number) {
  const grosze = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(grosze)) {
    throw new OrderProductError("PRODUCT_UNAVAILABLE");
  }
  return grosze;
}

export function buildOrderSnapshotFromProducts(
  inputValue: unknown,
  products: Map<string, Product>,
) {
  const input = normalizeCreateOrderInput(inputValue);
  const items: OrderItemSnapshot[] = [];
  let productTotalGrosze = 0;

  for (const requested of input.items) {
    const product = products.get(requested.productId);
    if (!product || !product.isActive) throw new OrderProductError("PRODUCT_UNAVAILABLE");
    if (!Number.isSafeInteger(product.stock) || product.stock < requested.qty) {
      throw new OrderProductError("INSUFFICIENT_STOCK");
    }
    const unitPriceGrosze = toGrosze(product.price);
    const lineTotalGrosze = unitPriceGrosze * requested.qty;
    if (!Number.isSafeInteger(lineTotalGrosze) || !Number.isSafeInteger(productTotalGrosze + lineTotalGrosze)) {
      throw new OrderProductError("PRODUCT_UNAVAILABLE");
    }
    productTotalGrosze += lineTotalGrosze;
    items.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      variant: null,
      quantity: requested.qty,
      unitPrice: unitPriceGrosze / 100,
      lineTotal: lineTotalGrosze / 100,
      image: product.images[0] ?? null,
    });
  }

  const deliveryGrosze = productTotalGrosze >= FREE_SHIPPING_THRESHOLD_GROSZE
    ? 0
    : STANDARD_SHIPPING_GROSZE;
  if (!Number.isSafeInteger(productTotalGrosze + deliveryGrosze)) {
    throw new OrderProductError("PRODUCT_UNAVAILABLE");
  }

  const customer: OrderCustomer = {
    fullName: input.customer.fullName,
    email: input.customer.email,
    phone: input.customer.phone,
    note: input.customer.note ?? "",
    wantInvoice: input.customer.wantInvoice === true,
    nip: input.customer.wantInvoice ? input.customer.nip ?? "" : null,
  };

  return {
    input,
    items,
    customer,
    productTotal: productTotalGrosze / 100,
    deliveryCost: deliveryGrosze / 100,
    discountTotal: 0,
    total: (productTotalGrosze + deliveryGrosze) / 100,
  };
}
