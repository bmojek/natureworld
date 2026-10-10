import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOrderSnapshotFromProducts,
  digestOrderRequest,
  INITIAL_ORDER_STATE,
  normalizeCreateOrderInput,
  OrderProductError,
  orderRequestDigestMatches,
  OrderValidationError,
} from "../app/lib/order-core.ts";

const validCustomer = {
  fullName: "Jan Kowalski",
  email: "jan@example.com",
  phone: "500600700",
  street: "Długa 1",
  postalCode: "00-001",
  city: "Warszawa",
};

function checkoutInput(overrides = {}) {
  return {
    idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
    items: [{ productId: "123", qty: 2 }],
    customer: { ...validCustomer },
    ...overrides,
  };
}

function product(overrides = {}) {
  return {
    id: "123",
    name: "Ziemia uniwersalna",
    sku: "SKU-123",
    price: 12.345,
    stock: 5,
    images: ["https://example.test/product.jpg"],
    content: "",
    categoryIds: [],
    isActive: true,
    ...overrides,
  };
}

test("valid COD order uses authoritative catalog price and server totals", () => {
  const input = checkoutInput({ items: [{ productId: "123", qty: 2, price: 0.01 }] });
  const snapshot = buildOrderSnapshotFromProducts(input, new Map([["123", product()]]));

  assert.deepEqual(INITIAL_ORDER_STATE, {
    paymentMethod: "cod",
    deliveryMethod: "courier",
    paymentStatus: "unpaid",
    fulfillmentStatus: "new",
  });
  assert.equal(snapshot.items[0].unitPrice, 12.35);
  assert.equal(snapshot.items[0].lineTotal, 24.7);
  assert.equal(snapshot.productTotal, 24.7);
  assert.equal(snapshot.deliveryCost, 15);
  assert.equal(snapshot.discountTotal, 0);
  assert.equal(snapshot.total, 39.7);
});

test("free delivery threshold is calculated from rounded server price", () => {
  const snapshot = buildOrderSnapshotFromProducts(
    checkoutInput({ items: [{ productId: "123", qty: 1 }] }),
    new Map([["123", product({ price: 99.005 })]]),
  );
  assert.equal(snapshot.productTotal, 99.01);
  assert.equal(snapshot.deliveryCost, 0);
  assert.equal(snapshot.total, 99.01);
});

test("empty cart, invalid quantity, and missing delivery data are rejected", () => {
  assert.throws(() => normalizeCreateOrderInput(checkoutInput({ items: [] })), OrderValidationError);
  assert.throws(() => normalizeCreateOrderInput(checkoutInput({ items: [{ productId: "123", qty: 0 }] })), OrderValidationError);
  assert.throws(() => normalizeCreateOrderInput(checkoutInput({ items: [{ productId: "123", qty: 1.5 }] })), OrderValidationError);
  assert.throws(() => normalizeCreateOrderInput(checkoutInput({ customer: { ...validCustomer, street: "" } })), OrderValidationError);
});

test("missing product and insufficient stock are rejected", () => {
  assert.throws(
    () => buildOrderSnapshotFromProducts(checkoutInput(), new Map()),
    (error) => error instanceof OrderProductError && error.code === "PRODUCT_UNAVAILABLE",
  );
  assert.throws(
    () => buildOrderSnapshotFromProducts(checkoutInput(), new Map([["123", product({ stock: 1 })]])),
    (error) => error instanceof OrderProductError && error.code === "INSUFFICIENT_STOCK",
  );
});

test("unsafe prices that overflow precise grosz arithmetic are rejected", () => {
  assert.throws(
    () => buildOrderSnapshotFromProducts(checkoutInput(), new Map([["123", product({ price: Number.MAX_VALUE })]])),
    (error) => error instanceof OrderProductError && error.code === "PRODUCT_UNAVAILABLE",
  );
});

test("idempotency digest accepts an exact retry and rejects changed cart contents", () => {
  const original = normalizeCreateOrderInput(checkoutInput());
  const changed = normalizeCreateOrderInput(checkoutInput({ items: [{ productId: "123", qty: 3 }] }));
  const originalDigest = digestOrderRequest(original, "test-only-secret");

  assert.equal(orderRequestDigestMatches(originalDigest, digestOrderRequest(original, "test-only-secret")), true);
  assert.equal(orderRequestDigestMatches(originalDigest, digestOrderRequest(changed, "test-only-secret")), false);
});
