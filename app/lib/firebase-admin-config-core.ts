export function normalizeFirebasePrivateKey(value: string | undefined): string | undefined {
  if (!value) return undefined;

  let key = value.trim();
  if (key.startsWith("{") && key.endsWith("}")) {
    try {
      const serviceAccount = JSON.parse(key) as { private_key?: unknown };
      if (typeof serviceAccount.private_key === "string") key = serviceAccount.private_key.trim();
    } catch {
      // Continue with the supplied value and let Admin SDK validation reject it.
    }
  }

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  return key
    .replace(/\\r?n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}
