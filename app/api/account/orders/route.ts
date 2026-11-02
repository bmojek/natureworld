import { NextRequest, NextResponse } from "next/server";
import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;
type Cursor = { createdAt: number; id: string };

function decodeCursor(value: string | null): Cursor | null | false {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<Cursor>;
    if (!Number.isSafeInteger(decoded.createdAt) || typeof decoded.id !== "string" || !/^[\w-]{1,100}$/.test(decoded.id)) return false;
    return { createdAt: decoded.createdAt as number, id: decoded.id };
  } catch { return false; }
}

function millis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function orderCursor(createdAt: number, id: string) {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString("base64url");
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Zaloguj się ponownie." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  let uid: string;
  let email: string | null;
  let emailVerified: boolean;
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    uid = decoded.uid;
    email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : null;
    emailVerified = decoded.email_verified === true;
  } catch {
    return NextResponse.json({ error: "Sesja jest nieprawidłowa lub wygasła. Zaloguj się ponownie." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const cursor = decodeCursor(request.nextUrl.searchParams.get("cursor"));
  if (cursor === false) return NextResponse.json({ error: "Nieprawidłowy kursor." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  try {
    // UID is the primary owner link. Verified email is only a migration fallback
    // for orders created before ownerUid was stored; never trust an email from input.
    const [owned, legacy] = await Promise.all([
      adminDb.collection("orders").where("ownerUid", "==", uid).get(),
      emailVerified && email
        ? adminDb.collection("orders").where("customer.email", "==", email).get()
        : Promise.resolve(null),
    ]);
    const docs = new Map<string, QueryDocumentSnapshot>();
    for (const doc of owned.docs) docs.set(doc.id, doc);
    for (const doc of legacy?.docs ?? []) docs.set(doc.id, doc);

    const sorted = [...docs.values()].map((doc) => ({ doc, createdAt: millis(doc.data().createdAt) }))
      .sort((a, b) => b.createdAt - a.createdAt || b.doc.id.localeCompare(a.doc.id));
    const afterCursor = cursor
      ? sorted.filter(({ doc, createdAt }) => createdAt < cursor.createdAt || (createdAt === cursor.createdAt && doc.id.localeCompare(cursor.id) < 0))
      : sorted;
    const page = afterCursor.slice(0, PAGE_SIZE + 1);
    const hasMore = page.length > PAGE_SIZE;
    const visible = page.slice(0, PAGE_SIZE);

    const orders = visible.map(({ doc }) => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : null;
      const items = Array.isArray(data.items) ? data.items.flatMap((value: unknown) => {
        if (!value || typeof value !== "object") return [];
        const item = value as Record<string, unknown>;
        return [{
          name: typeof item.name === "string" ? item.name : "Produkt",
          quantity: typeof item.quantity === "number" && Number.isFinite(item.quantity) ? item.quantity : 0,
          unitPrice: typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) ? item.unitPrice : 0,
          lineTotal: typeof item.lineTotal === "number" && Number.isFinite(item.lineTotal) ? item.lineTotal : 0,
        }];
      }) : [];
      const customer = data.customer && typeof data.customer === "object" ? data.customer as Record<string, unknown> : {};
      const address = data.shippingAddress && typeof data.shippingAddress === "object" ? data.shippingAddress as Record<string, unknown> : {};
      const safeNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
      return {
        id: doc.id,
        orderNumber: typeof data.orderNumber === "string" ? data.orderNumber : "Zamówienie",
        createdAt: createdAt?.toDate().toISOString() ?? null,
        items,
        customer: {
          fullName: typeof customer.fullName === "string" ? customer.fullName : "",
          phone: typeof customer.phone === "string" ? customer.phone : "",
        },
        shippingAddress: {
          street: typeof address.street === "string" ? address.street : "",
          postalCode: typeof address.postalCode === "string" ? address.postalCode : "",
          city: typeof address.city === "string" ? address.city : "",
        },
        productTotal: safeNumber(data.productTotal),
        deliveryCost: safeNumber(data.deliveryCost),
        discountTotal: safeNumber(data.discountTotal),
        total: safeNumber(data.total),
        paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod : "",
        deliveryMethod: typeof data.deliveryMethod === "string" ? data.deliveryMethod : "",
        paymentStatus: typeof data.paymentStatus === "string" ? data.paymentStatus : "",
        fulfillmentStatus: typeof data.fulfillmentStatus === "string" ? data.fulfillmentStatus : "",
      };
    });
    const last = visible.at(-1);
    const nextCursor = hasMore && last ? orderCursor(last.createdAt, last.doc.id) : null;
    return NextResponse.json({ orders, nextCursor }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const firestoreError = error as { code?: unknown; name?: unknown };
    console.error("Account orders Firestore query failed", {
      code: typeof firestoreError.code === "string" || typeof firestoreError.code === "number" ? String(firestoreError.code) : "unknown",
      name: typeof firestoreError.name === "string" ? firestoreError.name : "unknown",
    });
    return NextResponse.json({ error: "Nie udało się pobrać zamówień. Spróbuj ponownie później." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
