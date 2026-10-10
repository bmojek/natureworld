import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAllowedOrderStatusTransition,
  OrderStatusConflictError,
  OrderStatusValidationError,
  parseChangeOrderStatusInput,
} from "../app/lib/order-status-core.ts";

test("allows only forward fulfillment transitions", () => {
  assert.doesNotThrow(() => assertAllowedOrderStatusTransition("new", "processing"));
  assert.doesNotThrow(() => assertAllowedOrderStatusTransition("processing", "ready_to_ship"));
  assert.doesNotThrow(() => assertAllowedOrderStatusTransition("ready_to_ship", "shipped"));
  assert.doesNotThrow(() => assertAllowedOrderStatusTransition("shipped", "completed"));
  assert.doesNotThrow(() => assertAllowedOrderStatusTransition("new", "cancelled"));
  assert.doesNotThrow(() => assertAllowedOrderStatusTransition("pending", "processing"));
});

test("rejects backwards transitions and changes after terminal statuses", () => {
  assert.throws(() => assertAllowedOrderStatusTransition("new", "shipped"), OrderStatusConflictError);
  assert.throws(() => assertAllowedOrderStatusTransition("completed", "processing"), OrderStatusConflictError);
  assert.throws(() => assertAllowedOrderStatusTransition("cancelled", "processing"), OrderStatusConflictError);
  assert.throws(() => assertAllowedOrderStatusTransition("delivered", "cancelled"), OrderStatusConflictError);
});

test("status endpoint accepts only status fields and rejects invalid or protected-field input", () => {
  assert.deepEqual(
    parseChangeOrderStatusInput({ expectedStatus: "new", status: "processing" }),
    { expectedStatus: "new", status: "processing" },
  );
  assert.throws(() => parseChangeOrderStatusInput({ expectedStatus: "new", status: "paid" }), OrderStatusValidationError);
  assert.throws(() => parseChangeOrderStatusInput({ expectedStatus: "new", status: "processing", total: 1 }), OrderStatusValidationError);
  assert.throws(() => parseChangeOrderStatusInput({ expectedStatus: "new", status: "processing", paymentStatus: "paid" }), OrderStatusValidationError);
  assert.throws(() => parseChangeOrderStatusInput({ expectedStatus: "new", status: "processing", orderNumber: "NW-1" }), OrderStatusValidationError);
});
