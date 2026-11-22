import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Online payment creation is paused until the store is ready to accept it. */
export async function POST() {
  return NextResponse.json(
    { error: "ONLINE_PAYMENTS_NOT_AVAILABLE" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
