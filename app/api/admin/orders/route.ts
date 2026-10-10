import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError } from "@/app/lib/admin-auth-core";
import { requireAdmin } from "@/app/lib/admin-auth";
import { listAdminOrders } from "@/app/lib/admin-orders";
import { OrderQueryError, parseAdminOrderQuery } from "@/app/lib/admin-order-query";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const filters = parseAdminOrderQuery(request.nextUrl.searchParams);
    const result = await listAdminOrders(filters);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof OrderQueryError) {
      return NextResponse.json({ error: "Nieprawidłowe parametry zapytania." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    console.error("Admin order list failed", error);
    return NextResponse.json({ error: "Nie udało się pobrać zamówień." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
