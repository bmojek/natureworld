import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError } from "@/app/lib/admin-auth-core";
import { requireAdmin } from "@/app/lib/admin-auth";
import { changeAdminOrderStatus, getAdminOrder } from "@/app/lib/admin-orders";
import {
  OrderStatusConflictError,
  OrderStatusValidationError,
  parseChangeOrderStatusInput,
} from "@/app/lib/order-status-core";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const order = await getAdminOrder(id);
    if (!order) {
      return NextResponse.json({ error: "Nie znaleziono zamówienia." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(order, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("Admin order detail failed", error);
    return NextResponse.json({ error: "Nie udało się pobrać zamówienia." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new OrderStatusValidationError("Invalid JSON body");
    }
    const input = parseChangeOrderStatusInput(body);
    const order = await changeAdminOrderStatus(id, input, admin.uid);
    if (!order) {
      return NextResponse.json({ error: "Nie znaleziono zamówienia." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(order, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof OrderStatusValidationError) {
      return NextResponse.json({ error: "Nieprawidłowe żądanie zmiany statusu." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof OrderStatusConflictError) {
      return NextResponse.json({ error: "Status zamówienia został zmieniony lub przejście jest niedozwolone. Odśwież dane." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    console.error("Admin order status update failed", error);
    return NextResponse.json({ error: "Nie udało się zmienić statusu zamówienia." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
