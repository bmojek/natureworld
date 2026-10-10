import assert from "node:assert/strict";
import test from "node:test";
import { AdminAuthError, verifyAdminRequest } from "../app/lib/admin-auth-core.ts";

function request(authorization) {
  return new Request("http://localhost/api/admin/orders", {
    headers: authorization ? { authorization } : {},
  });
}

test("missing bearer token is rejected", async () => {
  await assert.rejects(
    verifyAdminRequest(request(), async () => ({ uid: "x", admin: true })),
    (error) => error instanceof AdminAuthError && error.status === 401,
  );
});

test("verified ordinary user is rejected", async () => {
  await assert.rejects(
    verifyAdminRequest(request("Bearer user-token"), async () => ({ uid: "user-1" })),
    (error) => error instanceof AdminAuthError && error.status === 403,
  );
});

test("verified admin claim grants a principal", async () => {
  const principal = await verifyAdminRequest(
    request("Bearer admin-token"),
    async (token, checkRevoked) => {
      assert.equal(token, "admin-token");
      assert.equal(checkRevoked, true);
      return { uid: "admin-1", admin: true };
    },
  );
  assert.deepEqual(principal, { uid: "admin-1" });
});

test("invalid or expired token rejected by Firebase verifier is unauthorized", async () => {
  await assert.rejects(
    verifyAdminRequest(request("Bearer expired-token"), async () => {
      throw new Error("auth/id-token-expired");
    }),
    (error) => error instanceof AdminAuthError && error.status === 401,
  );
});
