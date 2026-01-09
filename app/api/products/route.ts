import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";

const PAGE_SIZE = 4;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const categoryIdsParam = searchParams.get("categoryIds");
    const cursorParam = searchParams.get("cursor");

    if (!categoryIdsParam) {
      return NextResponse.json(
        { products: [], cursor: null },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    const categoryIds = categoryIdsParam.split(",");

    let q = query(
      collection(db, "products"),
      where("categoryIds", "array-contains-any", categoryIds.slice(0, 10)),
      orderBy("createdAt", "desc"),
      orderBy("__name__"),
      limit(PAGE_SIZE)
    );

    if (cursorParam) {
      const cursorTs = Timestamp.fromMillis(Number(cursorParam));
      q = query(
        collection(db, "products"),
        where("categoryIds", "array-contains-any", categoryIds.slice(0, 10)),
        orderBy("createdAt", "desc"),
        orderBy("__name__"),
        startAfter(cursorTs),
        limit(PAGE_SIZE)
      );
    }

    const snap = await getDocs(q);

    const products = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        slug: d.slug,
        price: d.price,
        images: d.images ?? [],
        createdAt: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : 0,
      };
    });

    const last = snap.docs.at(-1);

    return NextResponse.json(
      {
        products,
        cursor: last?.data().createdAt?.seconds
          ? last.data().createdAt.seconds * 1000
          : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("API /products error:", err);
    return NextResponse.json(
      { products: [], cursor: null },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
