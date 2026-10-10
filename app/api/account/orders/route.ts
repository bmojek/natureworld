import { NextRequest, NextResponse } from "next/server";
import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;
type Cursor = { seconds: number; nanoseconds: number; id: string };

function decodeCursor(value: string | null): Cursor | null | false {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<Cursor>;
    if (!Number.isSafeInteger(parsed.seconds) || !Number.isInteger(parsed.nanoseconds) ||
      parsed.nanoseconds! < 0 || parsed.nanoseconds! > 999_999_999 ||
      typeof parsed.id !== "string" || !/^[a-f0-9-]{36}$/i.test(parsed.id)) return false;
    return parsed as Cursor;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Zaloguj się ponownie." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    if (decoded.email_verified !== true || typeof decoded.email !== "string") {
      return NextResponse.json({ error: "Zweryfikuj adres e-mail, aby zobaczyć zamówienia." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    email = decoded.email.trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Sesja jest nieprawidłowa lub wygasła. Zaloguj się ponownie." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const cursor = decodeCursor(request.nextUrl.searchParams.get("cursor"));
  if (cursor === false) return NextResponse.json({ error: "Nieprawidłowy parametr strony." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  try {
    let query = adminDb.collection("orders")
      .where("customer.email", "==", email)
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(new Timestamp(cursor.seconds, cursor.nanoseconds), cursor.id);

    const snapshot = await query.get();
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt as Timestamp | undefined;
      return {
        id: doc.id,
        orderNumber: data.orderNumber,
        createdAt: createdAt?.toDate().toISOString() ?? null,
        items: Array.isArray(data.items) ? data.items.map((item: Record<string, unknown>) => ({
          name: item.name,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })) : [],
        productTotal: data.productTotal,
        deliveryCost: data.deliveryCost,
        discountTotal: data.discountTotal,
        total: data.total,
        paymentMethod: data.paymentMethod,
        deliveryMethod: data.deliveryMethod,
        paymentStatus: data.paymentStatus,
        fulfillmentStatus: data.fulfillmentStatus,
      };
    });
    const last = snapshot.docs.at(-1);
    const lastDate = last?.get("createdAt") as Timestamp | undefined;
    const nextCursor = snapshot.size === PAGE_SIZE && lastDate
      ? Buffer.from(JSON.stringify({ seconds: lastDate.seconds, nanoseconds: lastDate.nanoseconds, id: last!.id })).toString("base64url")
      : null;

    return NextResponse.json({ orders, nextCursor }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Nie udało się pobrać zamówień. Spróbuj ponownie później." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
