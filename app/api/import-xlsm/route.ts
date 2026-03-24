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

function cleanCategory(cat: string) {
  if (!cat) return "";
  return cat.replace(/\(\d+\)/g, "").trim();
}

const categoryMap: Record<string, string> = {
  "Rośliny > Nasiona > Warzywa": "warzywa",
  "Rośliny > Nasiona > Zioła": "ziola",
  "Rośliny > Nasiona > Rośliny ozdobne": "ozdobne",

  "Doniczki i pojemniki > Doniczki": "doniczki",
  "Doniczki i pojemniki > Osłonki": "oslonki",

  "Nawozy i preparaty > Nawozy": "nawozy",
  "Podłoża > Ziemia": "podloza",

  "Ozdoby świąteczne i okolicznościowe > Wielkanoc > Figurki": "figurki",
  "Ozdoby świąteczne i okolicznościowe > Wielkanoc > Zawieszki wielkanocne":
    "zawieszki",
};

async function uploadImages(urls: string[]) {
  if (!urls.length) return [];

  const form = new FormData();

  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i]);

      const blob = await res.blob();

      const file = new File([blob], `img-${Date.now()}-${i}.webp`, {
        type: "image/webp",
      });

      form.append("files", file);
    } catch (e) {
      console.log("IMG FAIL", urls[i]);
    }
  }

  const upload = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/upload-images`,
    {
      method: "POST",
      body: form,
    },
  );

  const data = await upload.json();

  return data.files || [];
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const buffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet =
      workbook.getWorksheet("Szablon") ||
      workbook.getWorksheet("Template") ||
      workbook.worksheets[1];

    if (!sheet) {
      return NextResponse.json({
        error: "No sheet found",
      });
    }

    const headerRowIndex = 4;
    const dataStartRow = 5;

    const headers: string[] = [];

    sheet.getRow(headerRowIndex).eachCell((cell) => {
      headers.push(cell.text.trim());
    });

    const rows: any[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      const obj: any = {};

      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber - 1];
        if (!key) return;
        obj[key] = cell.text;
      });

      rows.push(obj);
    });

    const catsSnap = await getDocs(collection(db, "categories"));

    const slugToId: Record<string, string> = {};

    catsSnap.forEach((d) => {
      const data = d.data();
      slugToId[data.slug] = d.id;
    });

    for (const row of rows) {
      const name = row["Tytuł oferty"] || row["Tytuł oferty "];
      const price = row["Cena PL"] || row["Cena PL "];

      const sku =
        row["Sygnatura/SKU Sprzedającego"] ||
        row["Sygnatura/SKU Sprzedającego "] ||
        slugify(name);

      const imagesStr = row["Zdjęcia"] || row["Zdjęcia "];

      const html = row["Opis oferty"] || row["Opis oferty "];

      const cat = row["Kategoria główna"] || row["Kategoria główna "];

      if (!name) continue;

      const slug = slugify(name);

      const clean = cleanCategory(cat);

      const mappedSlug = categoryMap[clean];

      if (!mappedSlug) continue;

      const categoryId = slugToId[mappedSlug];

      if (!categoryId) continue;

      // ✅ upload images

      let uploadedImages: string[] = [];

      if (imagesStr) {
        const urls = imagesStr.split("|");

        uploadedImages = await uploadImages(urls.slice(0, 5));
      }

      const q = query(collection(db, "products"), where("sku", "==", sku));

      const snap = await getDocs(q);

      if (!snap.empty) {
        const id = snap.docs[0].id;

        await updateDoc(doc(db, "products", id), {
          name,
          slug,
          price: Number(price),
          categoryIds: [categoryId],
          content: html,
          images: uploadedImages,
        });

        continue;
      }

      await addDoc(collection(db, "products"), {
        name,
        slug,
        price: Number(price) || 0,
        sku,
        images: uploadedImages,
        categoryIds: [categoryId],
        stock: 10,
        isActive: true,
        createdAt: new Date(),
        content: html,
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ error: true }, { status: 500 });
  }
}
