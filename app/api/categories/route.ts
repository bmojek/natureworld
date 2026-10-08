import { NextResponse } from "next/server";
import { BaseLinkerError } from "@/app/lib/base-linker";
import { getBaseCategories } from "@/app/lib/base-store";

export async function GET() {
  try {
    const categories = await getBaseCategories();

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const notConfigured =
      error instanceof BaseLinkerError && error.code === "NOT_CONFIGURED";

    return NextResponse.json(
      {
        error: notConfigured
          ? "BASE_LINKER_NOT_CONFIGURED"
          : "BASE_LINKER_REQUEST_FAILED",
      },
      { status: notConfigured ? 503 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
