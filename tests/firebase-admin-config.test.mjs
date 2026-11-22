import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFirebasePrivateKey } from "../app/lib/firebase-admin-config-core.ts";

const pem = "-----BEGIN PRIVATE KEY-----\nheader\n-----END PRIVATE KEY-----";

test("normalizes a quoted environment value with escaped newlines", () => {
  assert.equal(normalizeFirebasePrivateKey(`"${pem.replace(/\n/g, "\\n")}"`), pem);
});

test("accepts the private_key field from a service-account JSON value", () => {
  const serviceAccount = JSON.stringify({ private_key: pem });
  assert.equal(normalizeFirebasePrivateKey(serviceAccount), pem);
});

test("normalizes Windows line endings without changing the PEM contents", () => {
  assert.equal(normalizeFirebasePrivateKey(pem.replace(/\n/g, "\r\n")), pem);
});
