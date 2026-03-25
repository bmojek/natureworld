import { NextRequest, NextResponse } from "next/server";

import {
  collection,
  getDocs,
  query,
  where,
  limit,
  startAfter,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

const PAGE_SIZE = 6;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const categoryIdsParam = searchParams.get("categoryIds");

    const cursorId = searchParams.get("cursor");

    if (!categoryIdsParam) {
      return NextResponse.json({
        products: [],
        cursor: null,
      });
    }

    const categoryIds = categoryIdsParam.split(",");

    /* ================= BASE ================= */

    let q = query(
      collection(db, "products"),

      where("categoryIds", "array-contains-any", categoryIds.slice(0, 10)),

      limit(PAGE_SIZE),
    );

    /* ================= CURSOR ================= */

    if (cursorId) {
      const lastDoc = await getDoc(doc(db, "products", cursorId));

      if (lastDoc.exists()) {
        q = query(
          collection(db, "products"),

          where("categoryIds", "array-contains-any", categoryIds.slice(0, 10)),

          startAfter(lastDoc),

          limit(PAGE_SIZE),
        );
      }
    }

    /* ================= FETCH ================= */

    const snap = await getDocs(q);

    const products = snap.docs.map((d) => {
      const data = d.data();

      return {
        id: d.id,
        name: data.name,
        slug: data.slug,
        price: data.price ?? 0,
        images: data.images ?? [],
      };
    });

    const lastDoc = snap.docs.at(-1);

    return NextResponse.json({
      products,
      cursor: lastDoc?.id ?? null,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({
      products: [],
      cursor: null,
    });
  }
}
