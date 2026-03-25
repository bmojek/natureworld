import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

/* ================= helpers ================= */

function cleanCategory(cat?: string) {
  if (!cat) return "";
  return cat.replace(/\(\d+\)/g, "").trim();
}

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

/* ================= R2 UPLOAD ================= */

async function uploadImagesToR2(urls: string[], slug: string) {
  const form = new FormData();

  let index = 0;

  for (const url of urls) {
    if (!url) continue;

    const res = await fetch(url);

    const blob = await res.blob();

    const main = new File([blob], `${slug}_${index}_main.webp`, {
      type: "image/webp",
    });

    const thumb = new File([blob], `${slug}_${index}_thumb.webp`, {
      type: "image/webp",
    });

    form.append("files", main);
    form.append("files", thumb);

    index++;
  }

  const upload = await fetch("http://localhost:3000/api/upload-images", {
    method: "POST",
    body: form,
  });

  const data = await upload.json();

  return data.files || [];
}

/* ================= ROUTE ================= */

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    const buffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet("Szablon") || workbook.worksheets[1];

    const headerRow = 4;
    const dataStart = 5;

    const headers: string[] = [];

    sheet.getRow(headerRow).eachCell((c) => {
      headers.push(c.text.trim());
    });

    /* ================= categories ================= */

    const catsSnap = await getDocs(collection(db, "categories"));

    const slugToId: Record<string, string> = {};

    catsSnap.forEach((d) => {
      const data = d.data();
      slugToId[data.slug] = d.id;
    });

    /* ================= rows ================= */

    const rows: any[] = [];

    sheet.eachRow((row, i) => {
      if (i < dataStart) return;

      const obj: any = {};

      row.eachCell((cell, col) => {
        const key = headers[col - 1];
        if (!key) return;

        obj[key] = cell.text;
      });

      rows.push(obj);
    });

    /* ================= LOOP ================= */

    for (const obj of rows) {
      const name = obj["Tytuł oferty"];

      if (!name) continue;

      const price = Number(obj["Cena PL"] || 0);
      const stock = Number(obj["Liczba sztuk"] || 0);
      const sku = obj["Sygnatura/SKU Sprzedającego"] || "";
      const html = obj["Opis oferty"] || "";
      const imagesStr = obj["Zdjęcia"] || "";
      const allegroId = obj["ID oferty"] || "";

      const slug = slugify(name);

      const urls = imagesStr ? imagesStr.split("|") : [];

      const imageNames: string[] = [];

      for (let i = 0; i < urls.length; i++) {
        imageNames.push(`${slug}_${i}`);
      }

      /* ================= category ================= */

      const catRaw = cleanCategory(obj["Podkategoria"]);

      const catSlug = slugify(catRaw.split(">").pop() || "");

      const categoryId = slugToId[catSlug];

      /* ================= FIND EXISTING ================= */

      let existingDoc: any = null;
      let existingId: string | null = null;

      if (allegroId) {
        const q1 = query(
          collection(db, "products"),
          where("allegroId", "==", allegroId),
        );

        const snap1 = await getDocs(q1);

        if (!snap1.empty) {
          existingDoc = snap1.docs[0].data();
          existingId = snap1.docs[0].id;
        }
      }

      if (!existingDoc) {
        const q2 = query(collection(db, "products"), where("slug", "==", slug));

        const snap2 = await getDocs(q2);

        if (!snap2.empty) {
          existingDoc = snap2.docs[0].data();
          existingId = snap2.docs[0].id;
        }
      }

      const newData = {
        name,
        slug,
        allegroId,
        price,
        stock,
        sku,
        categoryIds: categoryId ? [categoryId] : [],
        content: html,
        isActive: true,
      };

      /* ================= UPDATE ================= */

      if (existingId && existingDoc) {
        let changed = false;

        if (existingDoc.price !== price) changed = true;
        if (existingDoc.stock !== stock) changed = true;
        if (existingDoc.content !== html) changed = true;

        if (changed) {
          await updateDoc(doc(db, "products", existingId), newData);

          console.log("UPDATE", name);
        } else {
          console.log("OK", name);
        }

        continue;
      }

      /* ================= UPLOAD IMAGES ================= */

      await uploadImagesToR2(urls, slug);

      /* ================= ADD ================= */

      await addDoc(collection(db, "products"), {
        ...newData,
        images: imageNames,
      });

      console.log("ADD", name);
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ error: true }, { status: 500 });
  }
}
