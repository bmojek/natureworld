import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

import { db } from "@/app/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const q = query(
      collection(db, "products"),
      where("slug", "==", slug),
      limit(1),
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const docSnap = snap.docs[0];
    const d = docSnap.data();

    return NextResponse.json(
      {
        id: docSnap.id,

        /* BASIC */
        name: d.name,
        slug: d.slug,
        price: d.price ?? 0,
        stock: d.stock ?? 0,
        isActive: d.isActive ?? true,

        /* IMPORTANT */
        images: d.images ?? [],
        content: d.content ?? "",

        /* OPTIONAL */
        sku: d.sku ?? "",
        allegroId: d.allegroId ?? "",
        categoryIds: d.categoryIds ?? [],

        /* META */
        createdAt: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("API /product error:", err);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
