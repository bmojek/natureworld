import { NextResponse } from "next/server";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/app/lib/firebase";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ż/g, "z")
    .replace(/ź/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tree = body.tree;

    async function findCategory(
      name: string,
      parentId: string | null,
      level: number,
    ) {
      const q = query(
        collection(db, "categories"),
        where("name", "==", name),
        where("level", "==", level),
      );

      const snap = await getDocs(q);

      if (snap.empty) return null;

      for (const d of snap.docs) {
        const data = d.data();

        if ((data.parentId || null) === parentId) {
          return d.id;
        }
      }

      return null;
    }

    async function saveNode(
      name: string,
      children: any,
      parentId: string | null,
      level: number,
    ) {
      let id = await findCategory(name, parentId, level);

      if (!id) {
        const ref = await addDoc(collection(db, "categories"), {
          name,
          slug: slugify(name),
          parentId,
          level,
        });

        id = ref.id;

        console.log("CREATED", name, parentId, level);
      } else {
        console.log("EXISTS", name, parentId, level);
      }

      for (const key of Object.keys(children)) {
        await saveNode(key, children[key], id, level + 1);
      }
    }

    for (const root of Object.keys(tree)) {
      await saveNode(root, tree[root], null, 0);
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ error: true }, { status: 500 });
  }
}
