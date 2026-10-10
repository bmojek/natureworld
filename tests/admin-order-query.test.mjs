import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_ORDER_PAGE_SIZE,
  decodeOrderCursor,
  encodeOrderCursor,
  OrderQueryError,
  parseAdminOrderQuery,
  selectOrderPage,
} from "../app/lib/admin-order-query.ts";

const id = "123e4567-e89b-42d3-a456-426614174000";

test("list query validates status and normalizes order number", () => {
  assert.deepEqual(
    parseAdminOrderQuery(new URLSearchParams("status=paid&number=nw-42")),
    { status: "paid", orderNumber: "NW-0000042", cursor: null },
  );
  assert.equal(ADMIN_ORDER_PAGE_SIZE, 25);
});

test("invalid status and malformed order number are rejected", () => {
  assert.throws(() => parseAdminOrderQuery(new URLSearchParams("status=all-orders")), OrderQueryError);
  assert.throws(() => parseAdminOrderQuery(new URLSearchParams("number=NW-abc")), OrderQueryError);
});

test("pagination cursor round-trips and rejects invalid data", () => {
  const cursor = { createdAtMs: 1_800_000_000_000, id };
  assert.deepEqual(decodeOrderCursor(encodeOrderCursor(cursor)), cursor);
  assert.throws(() => decodeOrderCursor("not-a-cursor"), OrderQueryError);
  assert.throws(() => encodeOrderCursor({ createdAtMs: -1, id }), OrderQueryError);
});

test("server pagination returns at most one page and reports whether another exists", () => {
  const documents = Array.from({ length: ADMIN_ORDER_PAGE_SIZE + 1 }, (_, index) => index);
  const page = selectOrderPage(documents);
  assert.equal(page.documents.length, ADMIN_ORDER_PAGE_SIZE);
  assert.equal(page.hasMore, true);
  assert.deepEqual(selectOrderPage([1, 2]), { documents: [1, 2], hasMore: false });
});
