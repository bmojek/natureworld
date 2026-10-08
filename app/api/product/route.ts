import { NextRequest, NextResponse } from "next/server";
import { BaseLinkerError } from "@/app/lib/base-linker";
import { getBaseProductBySlug } from "@/app/lib/base-store";

export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  try {
    const product = await getBaseProductBySlug(slug);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(product, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    const notConfigured =
      error instanceof BaseLinkerError && error.code === "NOT_CONFIGURED";
    console.error(
      "Base product details request failed:",
      error instanceof BaseLinkerError
        ? error.code
        : error instanceof Error
          ? `${error.name}: ${error.message.slice(0, 240)}`
          : "UNEXPECTED_ERROR",
    );

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
