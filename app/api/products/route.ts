import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";

const PAGE_SIZE = 4;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const categoryIdsParam = searchParams.get("categoryIds");
    const cursorId = searchParams.get("cursor"); // doc.id
    const sort = searchParams.get("sort") ?? "newest";

    if (!categoryIdsParam) {
      return NextResponse.json(
        { products: [], cursor: null },
        { headers: { "Cache-Control": "public, s-maxage=60" } },
      );
    }

    const categoryIds = categoryIdsParam.split(",");

    /* ================= SORT ================= */

    let orderField: "createdAt" | "price" = "createdAt";
    let orderDir: "asc" | "desc" = "desc";

    if (sort === "price-asc") {
      orderField = "price";
      orderDir = "asc";
    }

    if (sort === "price-desc") {
      orderField = "price";
      orderDir = "desc";
    }

    /* ================= BASE QUERY ================= */

    let baseQuery = query(
      collection(db, "products"),
      where("categoryIds", "array-contains-any", categoryIds.slice(0, 10)),
      orderBy(orderField, orderDir),
      orderBy("__name__"),
      limit(PAGE_SIZE),
    );

    /* ================= CURSOR ================= */

    if (cursorId) {
      const cursorSnap = await getDocs(
        query(collection(db, "products"), where("__name__", "==", cursorId)),
      );

      if (!cursorSnap.empty) {
        const lastDoc = cursorSnap.docs[0];

        baseQuery = query(
          collection(db, "products"),
          where("categoryIds", "array-contains-any", categoryIds.slice(0, 10)),
          orderBy(orderField, orderDir),
          orderBy("__name__"),
          startAfter(lastDoc),
          limit(PAGE_SIZE),
        );
      }
    }

    /* ================= FETCH ================= */

    const snap = await getDocs(baseQuery);

    const products = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        slug: d.slug,
        price: d.price,
        images: d.images ?? [],
      };
    });

    const lastDoc = snap.docs.at(-1);

    return NextResponse.json(
      {
        products,
        cursor: lastDoc ? lastDoc.id : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("API /products error:", err);
    return NextResponse.json(
      { products: [], cursor: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
