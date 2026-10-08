import { NextRequest, NextResponse } from "next/server";
import { BaseLinkerError } from "@/app/lib/base-linker";
import { getBaseProductsPage } from "@/app/lib/base-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get("categoryIds")?.split(",").filter(Boolean) ?? [];
    const search = searchParams.get("search") ?? undefined;
    const requestedPage = Number(searchParams.get("cursor") ?? "1");
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const data = await getBaseProductsPage({ categoryIds, search, page });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    const notConfigured =
      error instanceof BaseLinkerError && error.code === "NOT_CONFIGURED";

    return NextResponse.json(
      {
        products: [],
        cursor: null,
        error: notConfigured
          ? "BASE_LINKER_NOT_CONFIGURED"
          : "BASE_LINKER_REQUEST_FAILED",
      },
      { status: notConfigured ? 503 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
