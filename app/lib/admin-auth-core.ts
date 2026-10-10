export type VerifiedAdminToken = {
  uid: string;
  admin?: unknown;
};

export class AdminAuthError extends Error {
  public readonly status: 401 | 403;

  constructor(
    message: string,
    status: 401 | 403,
  ) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

/** Verifies the bearer token through the supplied verifier and requires a trusted admin claim. */
export async function verifyAdminRequest(
  request: Request,
  verifyIdToken: (token: string, checkRevoked: true) => Promise<VerifiedAdminToken>,
) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new AdminAuthError("Authentication required", 401);

  let token: VerifiedAdminToken;
  try {
    token = await verifyIdToken(match[1], true);
  } catch {
    // Firebase Admin rejects malformed, expired, revoked, and invalid-signature tokens.
    throw new AdminAuthError("Invalid or expired token", 401);
  }

  if (token.admin !== true) throw new AdminAuthError("Administrator access required", 403);
  return { uid: token.uid };
}
