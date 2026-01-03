import { NextRequest, NextResponse } from "next/server";
import { getSignedImageUrl } from "@/app/lib/r2";

export async function GET(
  req: NextRequest,
  context: { params: { key: string } }
) {
  const { key } = await context.params;

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const signedUrl = await getSignedImageUrl(key);
    const response = await fetch(signedUrl);
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=3600", // tu dodajesz cache
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
