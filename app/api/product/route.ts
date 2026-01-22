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

    const doc = snap.docs[0];
    const d = doc.data();

    /* ================= RESPONSE ================= */

    return NextResponse.json(
      {
        id: doc.id,

        /* BASIC */
        name: d.name,
        slug: d.slug,
        shortDescription: d.shortDescription ?? "",
        description: d.description ?? "",

        price: d.price,
        stock: d.stock ?? 0,
        isActive: d.isActive ?? true,

        images: d.images ?? [],
        categoryIds: d.categoryIds ?? [],

        /* OPTIONAL STRUCTURED DATA */
        attributes: {
          weightKg: d.attributes?.weightKg ?? null,
          lengthCm: d.attributes?.lengthCm ?? null,
          widthCm: d.attributes?.widthCm ?? null,
          heightCm: d.attributes?.heightCm ?? null,
          material: d.attributes?.material ?? null,
          flavor: d.attributes?.flavor ?? null,
          ageGroup: d.attributes?.ageGroup ?? null,
        },

        nutrition: {
          protein: d.nutrition?.protein ?? null,
          fat: d.nutrition?.fat ?? null,
          fiber: d.nutrition?.fiber ?? null,
          ash: d.nutrition?.ash ?? null,
          moisture: d.nutrition?.moisture ?? null,
        },

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
