import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/app/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(null);
    }

    const q = query(
      collection(db, "posts"),
      where("slug", "==", slug),
      where("isPublished", "==", true),
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json(null);
    }

    const doc = snap.docs[0];

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(null);
  }
}
