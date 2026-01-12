import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const q = query(
    collection(db, "products"),
    where("slug", "==", slug),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = snap.docs[0];
  const d = doc.data();

  return NextResponse.json(
    {
      id: doc.id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      price: d.price,
      images: d.images ?? [],
      stock: d.stock,
      categoryIds: d.categoryIds,
      createdAt: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : null,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}
