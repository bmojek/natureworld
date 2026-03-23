import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");

    let q = query(
      collection(db, "posts"),
      where("isPublished", "==", true),
      orderBy("publishedAt", "desc"),
    );

    if (type) {
      q = query(
        collection(db, "posts"),
        where("isPublished", "==", true),
        where("type", "==", type),
        orderBy("publishedAt", "desc"),
      );
    }

    const snap = await getDocs(q);

    const posts = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
