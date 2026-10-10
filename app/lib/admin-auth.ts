import "server-only";

import { adminAuth } from "@/app/lib/firebase-admin";
import { verifyAdminRequest } from "@/app/lib/admin-auth-core";

/** Use at the start of every future administrative route handler. */
export function requireAdmin(request: Request) {
  return verifyAdminRequest(request, (token, checkRevoked) =>
    adminAuth.verifyIdToken(token, checkRevoked),
  );
}
